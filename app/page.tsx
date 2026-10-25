import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSection } from "@/components/home/HeroSection";
import { MeaningSection } from "@/components/home/MeaningSection";
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
      <MeaningSection />
      <BenefitsSection />
      <StoryTeaser />
      <TestimonialsSection />
      <SocialCtaSection />
    </>
  );
}
