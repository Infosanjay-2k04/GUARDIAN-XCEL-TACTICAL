import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Radio, Signal, Network, WifiOff, Cpu } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function CommsTopology() {
  const { comms } = useSystem();
  const isLoRa = comms.channel === 'LORA_MESH';

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200 border-b border-tactical-border/60 pb-1.5">
        <span className="flex items-center gap-1.5">
          <Network className="w-4 h-4 text-tactical-cyan" />
          COMMS TOPOLOGY & LORA MESH
        </span>
        <StatusBadge
          status={isLoRa ? 'WARNING' : 'NORMAL'}
          label={comms.channel}
          size="xs"
        />
      </div>

      {/* Network Node Topology Cards */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className={`p-2 rounded border ${
          !isLoRa ? 'bg-tactical-card border-tactical-cyan' : 'bg-slate-900 border-tactical-border opacity-50'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>CELLULAR 4G/LTE</span>
            <span className={!isLoRa ? 'text-emerald-400' : 'text-slate-500'}>
              {!isLoRa ? 'PRIMARY' : 'ATTENUATED'}
            </span>
          </div>
          <div className="text-slate-400 mt-1">RSSI: {comms.cellular_rssi_dbm} dBm</div>
          <div className="text-slate-500 text-[9px]">Relay: Ranger Tower 01</div>
        </div>

        <div className={`p-2 rounded border ${
          isLoRa ? 'bg-amber-950/40 border-amber-500 shadow-amber-glow' : 'bg-slate-900 border-tactical-border'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>LORA 868MHz MESH</span>
            <span className={isLoRa ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
              {isLoRa ? 'ACTIVE FAILOVER' : 'STANDBY'}
            </span>
          </div>
          <div className="text-slate-400 mt-1">SNR: +{comms.lora_snr_db} dB | Hops: {comms.hop_count}</div>
          <div className="text-slate-500 text-[9px]">Protocol: 24-Byte Binary</div>
        </div>
      </div>

      {/* Protocol Stream Status */}
      <div className="p-1.5 rounded bg-tactical-card border border-tactical-border text-[9px] font-mono flex items-center justify-between text-slate-300">
        <span className="text-tactical-muted">STREAM PROTOCOL:</span>
        <span className="font-bold text-tactical-cyan">{comms.active_protocol}</span>
        <span className="text-slate-400">Loss: {comms.packet_loss_pct}%</span>
      </div>
    </div>
  );
}
