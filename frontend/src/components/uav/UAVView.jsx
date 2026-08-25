import React from 'react';
import DroneFleetPanel from './DroneFleetPanel';
import UAVSearchMap from './UAVSearchMap';
import MissionControlPanel from './MissionControlPanel';
import ThermalSearchVisualizer from './ThermalSearchVisualizer';
import MAVLinkSerialViewer from './MAVLinkSerialViewer';
import DemoControlBar from '../common/DemoControlBar';

export default function UAVView({ embedded = false }) {
  return (
    <div className={`flex flex-col ${embedded ? 'w-full h-full p-1' : 'min-h-[calc(100vh-4rem)] p-3'} gap-3`}>
      {/* Top Demo Bar if viewing standalone */}
      {!embedded && <DemoControlBar />}

      {/* Main UAV Grid Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[620px]">
        {/* LEFT PANEL: Drone Fleet Overview & MAVLink Serial Stream (3.5 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3 min-h-[320px]">
          <div className="flex-1 min-h-[260px]">
            <DroneFleetPanel />
          </div>
          <div className="h-52 min-h-[190px]">
            <MAVLinkSerialViewer />
          </div>
        </div>

        {/* CENTER PANEL: Large UAV Search Map (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col min-h-[420px]">
          <UAVSearchMap />
        </div>

        {/* RIGHT PANEL: Mission Control & Simulated Thermal FLIR Feed (3.5 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-3 min-h-[420px]">
          <div className="flex-1 min-h-[260px]">
            <MissionControlPanel />
          </div>
          <div className="flex-1 min-h-[240px]">
            <ThermalSearchVisualizer />
          </div>
        </div>
      </div>
    </div>
  );
}
