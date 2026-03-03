import { HeroVideo } from "@/components/home/hero-video";
import { StatsBar } from "@/components/home/stats-bar";
import { ToursPreview } from "@/components/home/tours-preview";
import { FleetShowcase } from "@/components/home/fleet-showcase";
import { RestaurantTeaser } from "@/components/home/restaurant-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { BlogPreview } from "@/components/home/blog-preview";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroVideo />
      <StatsBar />
      <ToursPreview />
      <FleetShowcase />
      <RestaurantTeaser />
      <Testimonials />
      <BlogPreview />
      <CtaSection />
    </>
  );
}
