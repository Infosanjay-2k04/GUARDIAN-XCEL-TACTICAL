import { useEffect } from 'react';

/**
 * Passive Voice Announcer Hook
 * Subscribes to demoPhase and threatLevel to announce key tactical SAR milestones.
 * Never modifies state or alters timing.
 */
export const useVoiceAnnouncer = (demoPhase, threatLevel, isMuted = false) => {
  useEffect(() => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    const announcements = {
      2: "Alert: High-G impact detected on unit Alpha.",
      3: "Warning: Tourist immobility threshold exceeded. Threat level Critical.",
      4: "Last Known Position locked. Initializing search boundary.",
      6: "UAV Alpha dispatched. Ascending to 45 meters.",
      8: "Thermal target acquired. Core temperature 36.8 degrees Celsius.",
      9: "Ground Tactical Echo-4 en route to scene.",
      10: "Rescue complete. Incident resolved and verified."
    };

    if (announcements[demoPhase]) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(announcements[demoPhase]);
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [demoPhase, threatLevel, isMuted]);
};

export default useVoiceAnnouncer;
