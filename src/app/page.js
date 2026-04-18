"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getRedirectPath } from "@/lib/auth/utils";
import Navbar from "@/components/Navbar/Navbar";
import DotGrid from "@/components/DotGrid";
import HeroSection from "@/components/Landing/HeroSection";
import FeaturesSection from "@/components/Landing/FeaturesSection";
import DashboardPanelsSection from "@/components/Landing/DashboardPanelsSection";
import TestimonialsSection from "@/components/Landing/TestimonialsSection";
import FAQSection from "@/components/Landing/FAQSection";
import Footer from "@/components/Landing/Footer";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to their dashboard — don't block rendering
    if (!loading && user) router.replace(getRedirectPath(user.role));
  }, [user, loading, router]);

  // Always render the landing page — never block on auth loading
  return (
    <div className="relative bg-surface">
      <DotGrid />
      <Navbar />
      <div className="relative pt-[65px]">
        <HeroSection />
        <FeaturesSection />
        <DashboardPanelsSection />
        <TestimonialsSection />
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
}
