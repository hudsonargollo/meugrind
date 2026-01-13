/**
 * Sign Up Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignUpForm } from '../../../components/auth/signup-form';
import { useAuth } from '../../../hooks/use-auth';

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
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
      <SignUpForm
        onSuccess={() => router.push('/')}
        onSignInClick={() => router.push('/auth/signin')}
      />
    </div>
  );
}