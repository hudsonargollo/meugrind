'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Navigation } from './navigation';
import { HeroSection } from './hero-section';
import { FeaturesShowcase } from './features-showcase';
import { SocialProof } from './social-proof';
import { FAQSection } from './faq-section';
import { CTASection } from './cta-section';
import { Footer } from './footer';

export function PremiumLandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/');
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      router.push('/');
    } else {
      router.push('/auth/signin');
    }
  };

  // Show loading state during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation 
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />
      
      <main>
        <HeroSection 
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
        />
        
        <section id="features">
          <FeaturesShowcase />
        </section>
        
        <section id="testimonials">
          <SocialProof />
        </section>
        
        <section id="faq">
          <FAQSection />
        </section>
        
        <section id="pricing">
          <CTASection 
            onGetStarted={handleGetStarted}
            onSignIn={handleSignIn}
          />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}