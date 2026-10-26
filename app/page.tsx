import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSection } from "@/components/home/HeroSection";
import { ComboSection } from "@/components/home/ComboSection";
import { FinderCta } from "@/components/home/FinderCta";
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
      <ComboSection />
      <FinderCta />
      <BenefitsSection />
      <StoryTeaser />
      <TestimonialsSection />
      <SocialCtaSection />
    </>
  );
}
