import { HeroSection } from './components/HeroSection';
import { HowItWorks } from './components/HowItWorks';
import { Benefits } from './components/Benefits';
import { MapPreview } from './components/MapPreview';
import { CTASection } from './components/CTASection';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <Benefits />
      <MapPreview />
      <CTASection />
    </>
  );
}
