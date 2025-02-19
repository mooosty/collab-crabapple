'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import OnboardingPopup from './components/OnboardingPopup';
import DashboardLayout from './dashboard/layout';
import DashboardPage from './dashboard/page';

interface DynamicUser {
  id?: string;
  email?: string;
}

interface DynamicContext {
  user: DynamicUser | null;
  isAuthenticated: boolean;
  handleLogOut: () => void;
}

export default function Home() {
  const { user, handleLogOut, isAuthenticated } = useDynamicContext() as DynamicContext;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (mounted && isAuthenticated && user?.email) {
        try {
          const response = await fetch(`/api/user?email=${user.email}`);
          const userData = await response.json();
          
          if (!response.ok || !userData || !userData.onboarding_completed) {
            setOnboardingCompleted(false);
            setShowOnboarding(true);
          } else {
            setOnboardingCompleted(true);
            setShowOnboarding(false);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setOnboardingCompleted(false);
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(false);
      }
    };

    checkUserStatus();
  }, [isAuthenticated, user, mounted]);

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return null;
  }

  // If authenticated and onboarding completed, show dashboard
  if (isAuthenticated && onboardingCompleted) {
    return (
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    );
  }

  // Otherwise show clean login page
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a18] via-[#2a2a28] to-[#1a1a18] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="mb-12">
          <img 
            src="/DLlogo.png" 
            alt="Darknight Labs Logo" 
            className="w-48 md:w-56 lg:w-64 h-auto"
          />
        </div>

        {/* Auth Widget Container */}
        <div className="w-full max-w-md">
          <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 md:p-8 shadow-2xl flex justify-center items-center">
            <DynamicWidget />
          </div>
        </div>
      </div>

      {showOnboarding && mounted && !onboardingCompleted && (
        <OnboardingPopup 
          onClose={() => setShowOnboarding(false)} 
        />
      )}
    </div>
  );
}
