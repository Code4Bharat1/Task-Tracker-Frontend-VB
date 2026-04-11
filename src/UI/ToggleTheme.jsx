"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme.js";

export default function ToggleTheme() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 text-foreground-muted hover:text-foreground hover:bg-surface-high transition-all"
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
