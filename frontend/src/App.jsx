import React, { useState, useEffect } from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import Header from './components/common/Header';
import MobileView from './components/mobile/MobileView';
import TacticalView from './components/tactical/TacticalView';
import UAVView from './components/uav/UAVView';
import CommandDeck from './components/deck/CommandDeck';
import useVoiceAnnouncer from './hooks/useVoiceAnnouncer';

function MainLayout() {
  const { demoPhase, tourist } = useSystem();
  useVoiceAnnouncer(demoPhase, tourist?.threat_level);

  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('mobile')) return 'mobile';
    if (path.includes('tactical')) return 'tactical';
    if (path.includes('uav')) return 'uav';
    return 'deck'; // Default to Master Command Deck for competition presentation!
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('mobile')) setCurrentRoute('mobile');
      else if (path.includes('tactical')) setCurrentRoute('tactical');
      else if (path.includes('uav')) setCurrentRoute('uav');
      else setCurrentRoute('deck');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-void text-slate-200 flex flex-col selection:bg-tactical-cyan selection:text-black">
      {/* Top Tactical Navigation Header */}
      <Header currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto">
        {currentRoute === 'mobile' && <MobileView />}
        {currentRoute === 'tactical' && <TacticalView />}
        {currentRoute === 'uav' && <UAVView />}
        {currentRoute === 'deck' && <CommandDeck />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <MainLayout />
    </SystemProvider>
  );
}
