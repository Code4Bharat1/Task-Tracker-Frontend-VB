"use client";
import React from "react";
import ToggleTheme from "@/UI/ToggleTheme.jsx";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/10 bg-surface/60 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_24px_rgba(0,0,0,0.25)]">
      <span className="font-sans font-extrabold tracking-widest uppercase text-foreground text-sm">
        Task Tracker
      </span>
      <div className="flex items-center gap-4">
        <ToggleTheme />
        <Link
          href="/login"
          className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
