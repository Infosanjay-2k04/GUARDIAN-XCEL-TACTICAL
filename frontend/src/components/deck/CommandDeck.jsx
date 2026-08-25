import React from 'react';
import DemoControlBar from '../common/DemoControlBar';
import MobileView from '../mobile/MobileView';
import TouristMonitor from '../tactical/TouristMonitor';
import TacticalMap from '../tactical/TacticalMap';
import ActiveIncidentPanel from '../tactical/ActiveIncidentPanel';
import TimelineLog from '../tactical/TimelineLog';
import DroneFleetPanel from '../uav/DroneFleetPanel';
import UAVSearchMap from '../uav/UAVSearchMap';
import MissionControlPanel from '../uav/MissionControlPanel';
import ThermalSearchVisualizer from '../uav/ThermalSearchVisualizer';

export default function CommandDeck() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-3 gap-3">
      {/* Master Presentation Demo Control Bar */}
      <DemoControlBar />

      {/* 3-in-1 Master Command Deck Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1">
        {/* INTERFACE 1: GUARDIAN XCEL MOBILE PWA (3.2 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-2 bg-tactical-darkest/90 p-2 rounded border border-tactical-border/90 shadow-2xl">
          <div className="text-[10px] font-mono font-bold text-tactical-cyan border-b border-tactical-border/60 pb-1 flex items-center justify-between">
            <span>[1.0] GUARDIAN XCEL MOBILE</span>
            <span className="text-emerald-400 font-bold">TOURIST PWA</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[820px]">
            <MobileView embedded={true} />
          </div>
        </div>

        {/* INTERFACE 2: TACTICAL COMMAND CENTER (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-3">
          {/* Tactical Map Container */}
          <div className="flex-1 min-h-[420px] bg-tactical-darkest/90 p-2 rounded border border-tactical-border/90 shadow-2xl flex flex-col gap-2">
            <div className="text-[10px] font-mono font-bold text-tactical-cyan border-b border-tactical-border/60 pb-1 flex items-center justify-between">
              <span>[2.0] TACTICAL COMMAND CENTER</span>
              <span className="text-white font-bold">RADAR GIS // LIVE</span>
            </div>
            <div className="flex-1 min-h-[380px]">
              <TacticalMap embedded={true} />
            </div>
          </div>

          {/* Tourist Monitoring & Incident Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[220px]">
            <TouristMonitor />
            <ActiveIncidentPanel />
          </div>

          {/* Bottom Timeline Log */}
          <div className="h-44 min-h-[160px]">
            <TimelineLog />
          </div>
        </div>

        {/* INTERFACE 3: UAV OPERATIONS & FLIR CENTER (3.8 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-3 bg-tactical-darkest/90 p-2 rounded border border-tactical-border/90 shadow-2xl">
          <div className="text-[10px] font-mono font-bold text-tactical-cyan border-b border-tactical-border/60 pb-1 flex items-center justify-between">
            <span>[3.0] UAV OPERATIONS & FLIR CENTER</span>
            <span className="text-emerald-400 font-bold">AUTONOMOUS SAR</span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[820px]">
            <DroneFleetPanel />
            <ThermalSearchVisualizer />
            <MissionControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
