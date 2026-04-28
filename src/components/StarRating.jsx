import React, { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-transform ${!readOnly && "hover:scale-110 cursor-pointer"}`}
        >
          <Star
            size={size}
            className={star <= display ? "text-accent fill-accent" : "text-gray-300 fill-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}
