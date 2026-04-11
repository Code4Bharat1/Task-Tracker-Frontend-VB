"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getRedirectPath } from "@/lib/auth/utils";
import AuthLoader from "@/components/AuthLoader";
import Navbar from "@/components/Navbar/Navbar";
import HeroSection from "@/components/Landing/HeroSection";
import DashboardPanelsSection from "@/components/Landing/DashboardPanelsSection";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && user) router.replace(getRedirectPath(user.role));
  }, [user, loading, router]);

  if (loading) return <AuthLoader />;

  return (
    <div className="relative bg-surface">
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />
      <Navbar />
      {/* Hero — full viewport height, offset by fixed navbar */}
      <div className="relative h-screen flex flex-col overflow-hidden pt-[65px]">
        <HeroSection />
      </div>
      {/* Sections below the fold */}
      <DashboardPanelsSection />
    </div>
  );
}
