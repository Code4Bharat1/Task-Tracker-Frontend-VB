"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import "react-day-picker/style.css";

/**
 * DatePicker — Smart-positioning calendar popover.
 *
 * Props:
 *   value       string  "yyyy-MM-dd" (empty = "")
 *   onChange    fn      called with "yyyy-MM-dd" string (or "" on clear)
 *   placeholder string
 *   className   string  extra classes on the trigger button
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const containerRef = useRef(null);

  const selected = value ? parseISO(value) : undefined;

  // Measure available space and decide direction when opening
  const calcDirection = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Calendar is roughly 320px tall
    setOpenUpward(spaceBelow < 340 && spaceAbove > spaceBelow);
  }, []);

  function handleToggle() {
    if (!open) calcDirection();
    setOpen((v) => !v);
  }

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleSelect(date) {
    if (!date) return; // ignore deselect — use the X button to clear
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 w-full bg-surface-container border border-outline px-3 py-2.5 text-left focus:outline-none focus:border-primary hover:border-primary/50 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
        <span className={`text-[12px] flex-1 ${value ? "text-foreground" : "text-foreground-muted"}`}>
          {selected ? format(selected, "MMM d, yyyy") : placeholder}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className={`absolute z-[9999] bg-surface-low border border-outline shadow-2xl rdp-theme-override ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
          />
        </div>
      )}
    </div>
  );
}
