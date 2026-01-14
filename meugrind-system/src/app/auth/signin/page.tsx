/**
 * Sign In Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInForm } from '../../../components/auth/signin-form';
import { useAuth } from '../../../hooks/use-auth';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && !loading) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router, mounted]);

  // Show loading during SSR and initial hydration
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignInForm
        onSuccess={() => router.push('/')}
        onSignUpClick={() => router.push('/auth/signup')}
      />
    </div>
  );
}