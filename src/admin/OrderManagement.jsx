import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { orders as ordersApi } from "../lib/api.js";
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from "../lib/utils.js";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

function OrderList({ onSelect }) {
  const [orderList, setOrderList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetch = (page = 1) => {
    setLoading(true);
    ordersApi.adminAll({ page, search, status })
      .then((d) => { setOrderList(d.orders); setPagination(d.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 py-2" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field py-2 w-auto">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? getStatusLabel(s) : "All Status"}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 bg-secondary animate-pulse rounded" /></td></tr>)
              : orderList.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
              : orderList.map((o) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => onSelect(o.id)}>
                  <td className="font-semibold">{o.order_number}</td>
                  <td><p className="text-sm">{o.customer_name || "Guest"}</p><p className="text-xs text-muted-foreground">{o.customer_email}</p></td>
                  <td className="text-muted-foreground text-sm">{formatDateTime(o.created_at)}</td>
                  <td className="font-semibold">{formatPrice(o.total)}</td>
                  <td><span className={getStatusColor(o.status)}>{getStatusLabel(o.status)}</span></td>
                  <td><span className={getStatusColor(o.payment_status)}>{getStatusLabel(o.payment_status)}</span></td>
                  <td><button className="text-accent text-sm hover:underline">View</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => fetch(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-semibold ${pagination.page === i + 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    ordersApi.adminGet(orderId)
      .then((d) => { setOrder(d.order); setNewStatus(d.order.status); setTrackingNumber(d.order.tracking_number || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { order: updated } = await ordersApi.adminUpdateStatus(orderId, { status: newStatus, tracking_number: trackingNumber });
      setOrder(updated);
      toast.success("Order updated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" /></div>;
  if (!order) return <p>Order not found</p>;

  const shippingAddr = typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />Back to orders
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{order.order_number}</h2>
          <p className="font-body text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field py-2 text-sm w-auto">
            {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="input-field py-2 text-sm w-48" />
          <button onClick={handleUpdate} disabled={updating} className="btn-primary text-sm py-2">{updating ? "Saving..." : "Update"}</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Customer */}
        <div className="card p-5">
          <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Customer</h3>
          <p className="font-body font-semibold text-foreground">{order.customer_name || "Guest"}</p>
          <p className="font-body text-sm text-muted-foreground">{order.customer_email}</p>
          <p className="font-body text-sm text-muted-foreground">{order.customer_phone}</p>
        </div>
        {/* Shipping */}
        <div className="card p-5">
          <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Shipping</h3>
          {shippingAddr && (
            <div className="font-body text-sm text-foreground space-y-0.5">
              <p className="font-semibold">{shippingAddr.name}</p>
              <p className="text-muted-foreground">{shippingAddr.line1}{shippingAddr.line2 ? `, ${shippingAddr.line2}` : ""}</p>
              <p className="text-muted-foreground">{shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
              <p className="text-muted-foreground">{shippingAddr.phone}</p>
            </div>
          )}
        </div>
        {/* Payment */}
        <div className="card p-5">
          <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Payment</h3>
          <div className="space-y-1 font-body text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{order.payment_method || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={getStatusColor(order.payment_status)}>{getStatusLabel(order.payment_status)}</span></div>
            {order.tracking_number && <div className="flex justify-between"><span className="text-muted-foreground">Tracking</span><span className="font-semibold">{order.tracking_number}</span></div>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <h3 className="font-body font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
              <img src={item.product_image || "/assets/hero-bedroom.jpg"} alt="" className="w-12 h-12 rounded-lg object-cover" onError={(e) => { e.target.src = "/assets/hero-bedroom.jpg"; }} />
              <div className="flex-1"><p className="font-body font-medium text-foreground">{item.product_name}</p><p className="text-xs text-muted-foreground">x{item.quantity} @ {formatPrice(item.discount_price || item.price)}</p></div>
              <p className="font-body font-semibold">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2 font-body text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(order.shipping_charge)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(order.tax)}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-border"><span>Total</span><span className="font-heading text-xl font-bold">{formatPrice(order.total)}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="space-y-6">
      {!selectedOrder && (
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Orders</h1>
          <p className="font-body text-muted-foreground">Manage all customer orders</p>
        </div>
      )}
      {selectedOrder ? (
        <OrderDetail orderId={selectedOrder} onBack={() => setSelectedOrder(null)} />
      ) : (
        <OrderList onSelect={setSelectedOrder} />
      )}
    </div>
  );
}
