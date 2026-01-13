/**
 * Error Boundary Components
 * 
 * Provides comprehensive error handling and recovery mechanisms
 * for the MEUGRIND productivity system.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { performanceMonitor } from '../../lib/performance-monitor';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Track performance impact
    performanceMonitor.addMetric({
      name: 'error.boundary',
      value: Date.now(),
      timestamp: Date.now(),
      category: 'custom',
      metadata: {
        level,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo, level);
  }

  private reportError(error: Error, errorInfo: ErrorInfo, level: string) {
    // In a real application, you would send this to an error tracking service
    // like Sentry, Bugsnag, or a custom logging endpoint
    
    const errorReport = {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      level,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    // Store locally for now (in production, send to error service)
    try {
      const existingErrors = JSON.parse(localStorage.getItem('meugrind_errors') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50);
      localStorage.setItem('meugrind_errors', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }
  }

  private getCurrentUserId(): string | null {
    // Get current user ID from auth context or localStorage
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || null;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback, level = 'component' } = this.props;
      
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          level={level}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI Component
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  level: string;
  onRetry: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function ErrorFallback({
  error,
  errorInfo,
  errorId,
  level,
  onRetry,
  onReload,
  onGoHome,
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const isCritical = level === 'critical' || level === 'page';

  return (
    <div className={`${isCritical ? 'min-h-screen' : 'min-h-64'} flex items-center justify-center bg-gray-50 p-4`}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {isCritical ? 'Application Error' : 'Component Error'}
            </h3>
            <p className="text-sm text-gray-500">
              Something went wrong. We&apos;re working to fix this.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Error ID: <code className="bg-gray-100 px-1 rounded text-xs">{errorId}</code>
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <p className="text-sm text-red-800 font-medium">
                {error.message}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>

          {showDetails && (
            <div className="mt-3 bg-gray-100 rounded p-3 text-xs font-mono overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Stack Trace:</strong>
                <pre className="whitespace-pre-wrap">{error?.stack}</pre>
              </div>
              {errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          {!isCritical && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={onReload}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reload Page
          </button>
          
          {isCritical && (
            <button
              onClick={onGoHome}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Go to Dashboard
            </button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If this problem persists, please contact support with the error ID above.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Async Error Boundary for handling async errors
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (error) {
    return (
      <ErrorBoundary level="critical">
        <div>Error: {error.message}</div>
      </ErrorBoundary>
    );
  }

  return <>{children}</>;
}

/**
 * Network Error Handler
 */
export function NetworkErrorHandler({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [networkError, setNetworkError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('You are currently offline. Some features may not be available.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {networkError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{networkError}</p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

/**
 * Retry mechanism hook
 */
export function useRetry(maxRetries: number = 3, delay: number = 1000) {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(async (fn: () => Promise<any>) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded`);
    }

    setIsRetrying(true);
    
    try {
      const result = await fn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      
      if (retryCount < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retryCount)));
        return retry(fn);
      } else {
        throw error;
      }
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, delay]);

  const reset = React.useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
}

/**
 * Error reporting utilities
 */
export const errorReporting = {
  // Get stored error reports
  getErrorReports: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('meugrind_errors') || '[]');
    } catch {
      return [];
    }
  },

  // Clear error reports
  clearErrorReports: () => {
    localStorage.removeItem('meugrind_errors');
  },

  // Export error reports for support
  exportErrorReports: (): string => {
    const reports = errorReporting.getErrorReports();
    return JSON.stringify(reports, null, 2);
  },

  // Get error statistics
  getErrorStats: () => {
    const reports = errorReporting.getErrorReports();
    const now = Date.now();
    const last24h = reports.filter(r => (now - new Date(r.timestamp).getTime()) < 86400000);
    
    return {
      total: reports.length,
      last24h: last24h.length,
      byLevel: reports.reduce((acc, r) => {
        acc[r.level] = (acc[r.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      mostCommon: reports.reduce((acc, r) => {
        acc[r.message] = (acc[r.message] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};