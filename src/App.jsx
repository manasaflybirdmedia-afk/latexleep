import React from "react";
import { Check, Menu, MessageCircle, X } from "lucide-react";
import { categories, products } from "./siteData";

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function Logo() {
  return (
    <>
      LATEX <span className="text-accent">Leep</span>
    </>
  );
}

function ProductCard({ product }) {
  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="aspect-square overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground">
          {product.category}
        </div>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <div className="p-8 flex flex-col flex-1">
        <h3 className="font-heading text-2xl font-semibold text-card-foreground mb-3">{product.name}</h3>
        <p className="font-body text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

        <ul className="space-y-3 mb-8 flex-1">
          {product.features.map((feature) => (
            <li key={feature} className="font-body text-sm text-foreground flex items-start gap-3">
              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <a
          href={`https://wa.me/918374530026?text=Hi%20LATEX%20Leep!%20I%27m%20interested%20in%20your%20${encodeURIComponent(product.name)}.%20Please%20share%20details.`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-body font-semibold text-white transition-all hover:bg-[#20bd5a] hover:shadow-lg"
        >
          <WhatsAppIcon />
          Enquire on WhatsApp
        </a>
      </div>
    </div>
  );
}

export function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredProducts = products.filter(
    (product) => selectedCategory === "All" || product.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary/20 shadow-sm">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <a href="/" className="font-heading text-2xl font-bold text-primary-foreground">
            <Logo />
          </a>

          <div className="hidden md:flex items-center gap-8 font-body text-sm font-medium">
            <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Home
            </a>
            <a href="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              About Us
            </a>
            <a
              href="#products"
              onClick={() => setSelectedCategory("Services")}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Services
            </a>
            <a
              href="#products"
              onClick={() => setSelectedCategory("All")}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Products
            </a>
            <a
              href="tel:+918374530026"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Contact
            </a>
            <a
              href="https://wa.me/918374530026?text=Hi%20LATEX%20Leep!"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-white font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              WhatsApp Us
            </a>
          </div>

          <button
            className="md:hidden text-primary-foreground"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-primary border-b border-primary/20 p-4 flex flex-col gap-4 shadow-lg">
            <a
              href="#"
              className="text-primary-foreground/90 hover:text-primary-foreground font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#about"
              className="text-primary-foreground/90 hover:text-primary-foreground font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </a>
            <a
              href="#products"
              className="text-primary-foreground/90 hover:text-primary-foreground font-medium py-2"
              onClick={() => {
                setSelectedCategory("Services");
                setIsMenuOpen(false);
              }}
            >
              Services
            </a>
            <a
              href="#products"
              className="text-primary-foreground/90 hover:text-primary-foreground font-medium py-2"
              onClick={() => {
                setSelectedCategory("All");
                setIsMenuOpen(false);
              }}
            >
              Products
            </a>
            <a
              href="tel:+918374530026"
              className="text-primary-foreground/90 hover:text-primary-foreground font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <a
              href="https://wa.me/918374530026?text=Hi%20LATEX%20Leep!"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#2563eb] px-5 py-3 text-white font-semibold text-center mt-2"
            >
              WhatsApp Us
            </a>
          </div>
        )}
      </nav>

      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src="/assets/hero-bedroom.jpg"
            alt="Premium LATEX Leep mattress in a modern bedroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-white/80 font-body text-sm tracking-[0.3em] uppercase mb-4 font-semibold">
              Premium Mattress Manufacturers — Tirupathi
            </p>
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Sleep in
              <br />
              <span className="text-accent">Pure Comfort</span>
            </h1>
            <p className="text-white/90 font-body text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
              Handcrafted latex, foam & cooling gel mattresses built for the perfect night&apos;s
              rest. Made in Tirupathi with love.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-4 font-body font-semibold text-accent-foreground text-lg transition-all hover:bg-accent/90 hover:scale-105"
              >
                Explore Collection
              </a>
              <a
                href="https://wa.me/918374530026?text=Hi%20LATEX%20Leep!%20I%27m%20interested%20in%20your%20mattresses."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-black/20 backdrop-blur-sm px-8 py-4 font-body font-semibold text-white text-lg transition-all hover:bg-white/10"
              >
                <MessageCircle size={20} />
                Chat with Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent font-body text-sm tracking-[0.2em] uppercase mb-3 font-bold">
                About Us
              </p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
                Crafting Perfect Sleep Since Inception
              </h2>
              <p className="font-body text-muted-foreground text-lg leading-relaxed mb-6">
                At LATEX Leep, we believe that a good night&apos;s sleep is the foundation of a
                healthy, happy life. Based in the heart of Tirupathi, we specialize in
                manufacturing premium quality mattresses that cater to your unique comfort needs.
              </p>
              <p className="font-body text-muted-foreground text-lg leading-relaxed">
                From natural latex to advanced cooling gel technologies, every mattress is
                handcrafted with precision, care, and the finest materials. Our mission is simple:
                to provide you with pure comfort that lasts.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video md:aspect-square">
              <img src="/assets/hero-bedroom.jpg" alt="About LATEX Leep" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="py-24 bg-secondary">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-accent font-body text-sm tracking-[0.2em] uppercase mb-3 font-bold">
              Our Collection
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-10">
              Products & Services
            </h2>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background text-muted-foreground hover:bg-background/80 hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No items found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#1e293b] text-white py-16 mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-white/80">
            <div>
              <h3 className="font-heading text-3xl font-bold text-white mb-4">
                <Logo />
              </h3>
              <p className="font-body text-sm leading-relaxed max-w-sm">
                Premium mattress manufacturers based in Tirupathi. Quality sleep, handcrafted with
                care.
              </p>
            </div>

            <div>
              <h4 className="font-body font-semibold text-white text-lg mb-4">Contact</h4>
              <div className="space-y-2 font-body text-sm">
                <p>Owner: Malik Basha</p>
                <p>
                  Phone:{" "}
                  <a
                    href="tel:+918374530026"
                    className="hover:text-accent transition-colors font-medium"
                  >
                    +91 83745 30026
                  </a>
                </p>
                <p>Area: Tirupathi</p>
              </div>
            </div>

            <div>
              <h4 className="font-body font-semibold text-white text-lg mb-4">Categories</h4>
              <ul className="font-body text-sm space-y-2">
                <li>
                  <a
                    href="#products"
                    onClick={() => setSelectedCategory("Mattresses")}
                    className="hover:text-accent transition-colors cursor-pointer"
                  >
                    Mattresses
                  </a>
                </li>
                <li>
                  <a
                    href="#products"
                    onClick={() => setSelectedCategory("Pillows")}
                    className="hover:text-accent transition-colors cursor-pointer"
                  >
                    Pillows
                  </a>
                </li>
                <li>
                  <a
                    href="#products"
                    onClick={() => setSelectedCategory("Services")}
                    className="hover:text-accent transition-colors cursor-pointer"
                  >
                    Services
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-white/50">© 2026 LATEX Leep. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
}
