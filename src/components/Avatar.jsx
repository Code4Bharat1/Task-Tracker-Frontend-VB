"use client";

import React from "react";

export default function Avatar({
  name = "",
  src = null,
  size = 8,
  className = "",
  onClick,
}) {
  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const letters = parts.map((p) => p[0] ?? "").filter(Boolean);
    return (letters[0] || "?") + (letters[1] || "");
  }, [name]);

  return (
    <button
      onClick={onClick}
      aria-label={name || "profile"}
      className={`inline-flex items-center justify-center rounded-full overflow-hidden bg-surface-container text-foreground-muted ${className}`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px`, padding: 0 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-low text-sm font-bold text-foreground">
          {initials.toUpperCase()}
        </div>
      )}
    </button>
  );
}
