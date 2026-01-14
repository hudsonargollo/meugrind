'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from "../components/auth/auth-provider";
import { AppShell } from "../components/interface/app-shell";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <AppShell />
    </AuthGuard>
  );
}
