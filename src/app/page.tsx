import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import TrustedBySection from "../components/landing/TrustedBySection";
import FeaturesSection from "../components/landing/FeaturesSection";
import ShowcaseSection from "../components/landing/ShowcaseSection";
import IntegrationsSection from "../components/landing/IntegrationsSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <ShowcaseSection />
      <IntegrationsSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
