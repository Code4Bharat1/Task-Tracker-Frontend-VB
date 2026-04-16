"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getRedirectPath } from "@/lib/auth/utils";
import AuthLoader from "@/components/AuthLoader";
import Navbar from "@/components/Navbar/Navbar";
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
    if (!loading && user) router.replace(getRedirectPath(user.role));
  }, [user, loading, router]);

  if (loading) return <AuthLoader />;

  return (
    <div className="relative bg-surface">
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />
      <Navbar />
      <div className="relative pt-[65px]">
        {/* Hero — centered, full-width */}
        <HeroSection />
        {/* Feature grid */}
        <FeaturesSection />
        {/* Role dashboards + lifecycle flow + comparison + benefits */}
        <DashboardPanelsSection />
        {/* Testimonials */}
        <TestimonialsSection />
        {/* FAQ */}
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
}
