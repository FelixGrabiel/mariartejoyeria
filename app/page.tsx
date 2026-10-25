import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSection } from "@/components/home/HeroSection";
import {
  BenefitsSection,
  CategoriesSection,
  GiftSection,
  SocialCtaSection,
  StoryTeaser,
  TestimonialsSection,
} from "@/components/home/HomeSections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <GiftSection />
      <BenefitsSection />
      <StoryTeaser />
      <TestimonialsSection />
      <SocialCtaSection />
    </>
  );
}
