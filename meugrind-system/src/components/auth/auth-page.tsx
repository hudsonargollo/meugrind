'use client';

import React, { useState } from 'react';
import { LoginForm } from './login-form';
import { SignUpForm } from './signup-form';
import { ConfirmationForm } from './confirmation-form';

type AuthMode = 'login' | 'signup' | 'confirm';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSignUpSuccess = () => {
    setMode('confirm');
  };

  const handleConfirmationSuccess = () => {
    setMode('login');
    setPendingEmail('');
  };

  const handleLoginSuccess = () => {
    onAuthSuccess?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">MEUGRIND</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your offline-first productivity system
          </p>
        </div>

        {mode === 'login' && (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSignUpClick={() => setMode('signup')}
          />
        )}

        {mode === 'signup' && (
          <SignUpForm
            onSuccess={handleSignUpSuccess}
            onLoginClick={() => setMode('login')}
          />
        )}

        {mode === 'confirm' && (
          <ConfirmationForm
            email={pendingEmail}
            onSuccess={handleConfirmationSuccess}
            onBackClick={() => setMode('signup')}
          />
        )}
      </div>
    </div>
  );
}