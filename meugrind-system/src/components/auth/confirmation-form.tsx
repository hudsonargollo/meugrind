'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';

interface ConfirmationFormProps {
  email: string;
  onSuccess?: () => void;
  onBackClick?: () => void;
}

export function ConfirmationForm({ email, onSuccess, onBackClick }: ConfirmationFormProps) {
  const { confirmSignUp } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await confirmSignUp(email, code);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We&apos;ve sent a confirmation code to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Confirmation Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>

        {onBackClick && (
          <div className="text-center">
            <button
              type="button"
              onClick={onBackClick}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Back to sign up
            </button>
          </div>
        )}
      </form>
    </div>
  );
}