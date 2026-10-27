import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSection } from "@/components/home/HeroSection";
import { ComboSection } from "@/components/home/ComboSection";
import { FinderCta } from "@/components/home/FinderCta";
import { MeaningSection } from "@/components/home/MeaningSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import {
  BenefitsSection,
  GiftSection,
  SocialCtaSection,
  StoryTeaser,
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
      <SocialCtaSection />
    </>
  );
}
