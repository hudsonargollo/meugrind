'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { AppShell } from "../components/interface/app-shell";
import { PremiumLandingPage } from "../components/landing/premium-landing-page";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Show premium landing page for unauthenticated users
  if (!isAuthenticated) {
    return <PremiumLandingPage />;
  }

  // Show app shell for authenticated users
  return <AppShell />;
}
