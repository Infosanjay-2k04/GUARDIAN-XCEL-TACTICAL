import React from 'react';
import TouristMonitor from './TouristMonitor';
import TacticalMap from './TacticalMap';
import ActiveIncidentPanel from './ActiveIncidentPanel';
import TimelineLog from './TimelineLog';
import TerrainElevationWidget from './TerrainElevationWidget';
import DemoControlBar from '../common/DemoControlBar';

export default function TacticalView({ embedded = false }) {
  return (
    <div className={`flex flex-col ${embedded ? 'w-full h-full p-1' : 'min-h-[calc(100vh-4rem)] p-3'} gap-3`}>
      {/* Top Demo Bar if viewing standalone */}
      {!embedded && <DemoControlBar />}

      {/* Main Tactical Grid Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[620px]">
        {/* LEFT PANEL: Tourist Monitoring (3.5 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3 min-h-[320px]">
          <div className="flex-1 min-h-[300px]">
            <TouristMonitor />
          </div>
          <div className="h-44 min-h-[160px]">
            <TerrainElevationWidget />
          </div>
        </div>

        {/* CENTER PANEL: Large Live Terrain / Satellite Map (5.5 Cols) */}
        <div className="xl:col-span-5 flex flex-col min-h-[420px]">
          <TacticalMap embedded={embedded} />
        </div>

        {/* RIGHT PANEL: Active Incident & Command Actions (3.5 Cols) */}
        <div className="xl:col-span-4 flex flex-col min-h-[320px]">
          <ActiveIncidentPanel />
        </div>
      </div>

      {/* BOTTOM PANEL: Live Event Timeline & Comms Indicators */}
      <div className="h-48 min-h-[180px]">
        <TimelineLog />
      </div>
    </div>
  );
}
