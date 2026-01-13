'use client';

import { useEffect, useState } from 'react';
import { pwaInstallationManager, PWAInstallationStatus } from '../../lib/pwa-installation-manager';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [installStatus, setInstallStatus] = useState<PWAInstallationStatus | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Get initial installation status
    setInstallStatus(pwaInstallationManager.getInstallationStatus());

    // Listen for installation events
    const handleInstallAvailable = () => {
      setInstallStatus(pwaInstallationManager.getInstallationStatus());
      setShowPrompt(true);
    };

    const handleInstallCompleted = () => {
      setInstallStatus(pwaInstallationManager.getInstallationStatus());
      setShowPrompt(false);
      setShowOnboarding(false);
      if (onInstall) onInstall();
    };

    const handleOnboardingShow = (data: any) => {
      setShowOnboarding(true);
    };

    pwaInstallationManager.on('install-available', handleInstallAvailable);
    pwaInstallationManager.on('install-completed', handleInstallCompleted);
    pwaInstallationManager.on('onboarding-show', handleOnboardingShow);

    return () => {
      pwaInstallationManager.off('install-available', handleInstallAvailable);
      pwaInstallationManager.off('install-completed', handleInstallCompleted);
      pwaInstallationManager.off('onboarding-show', handleOnboardingShow);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    
    try {
      const success = await pwaInstallationManager.showInstallationPrompt();
      if (success) {
        setShowPrompt(false);
        if (onInstall) onInstall();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onDismiss) onDismiss();
  };

  const handleShowInstructions = () => {
    setShowOnboarding(true);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  if (!installStatus || installStatus.isInstalled) {
    return null;
  }

  return (
    <>
      {/* Installation Prompt */}
      {showPrompt && installStatus.canInstall && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <p className="font-semibold">Install MEUGRIND</p>
                  <p className="text-sm opacity-90">Get the full app experience</p>
                </div>
              </div>
              
              <div className="text-sm opacity-90 mb-3">
                • Works offline
                • Faster loading
                • Desktop notifications
                • No browser clutter
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1 text-sm bg-white/20 rounded hover:bg-white/30 transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="px-4 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="ml-2 p-1 hover:bg-white/20 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Manual Installation Instructions (iOS/unsupported browsers) */}
      {!installStatus.canInstall && !installStatus.isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📱</span>
              <span className="font-semibold">Add to Home Screen</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm opacity-90 mb-3">
            Install MEUGRIND for the best experience
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleShowInstructions}
              className="px-4 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Show How
            </button>
          </div>
        </div>
      )}

      {/* Installation Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Install MEUGRIND</h2>
              <button
                onClick={handleCloseOnboarding}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              
              <p className="text-gray-600 text-center mb-4">
                Get the full MEUGRIND experience with offline access, notifications, and faster performance.
              </p>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">
                  {installStatus.platform === 'ios' ? 'On iPhone/iPad:' : 
                   installStatus.platform === 'android' ? 'On Android:' : 
                   'Installation Steps:'}
                </h3>
                
                <ol className="space-y-2 text-sm text-gray-600">
                  {pwaInstallationManager.showInstallationInstructions().map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Benefits:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Works completely offline</li>
                  <li>• Faster loading and performance</li>
                  <li>• Push notifications for Pomodoro sessions</li>
                  <li>• No browser address bar clutter</li>
                  <li>• Easy access from home screen</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseOnboarding}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                {installStatus.canInstall && (
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isInstalling ? 'Installing...' : 'Install Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}