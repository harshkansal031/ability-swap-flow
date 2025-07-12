import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SkillShowcase } from "@/components/SkillShowcase";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* <Navigation /> Removed, now global */}
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <SkillShowcase />
      <Footer />
    </div>
  );
};

export default Index;
