import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Radio, Signal, Network, WifiOff, Cpu, Layers, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function CommsTopology() {
  const { comms, tourist } = useSystem();
  const isLoRa = comms.channel === 'LORA_MESH';

  const bin = comms.lora_binary_packet || {
    raw_hex: '0x475838393231414C506861210000000000000000',
    byte_length: 24,
    crc16: '0x4A8C',
    toa_ms: 185.4,
    spreading_factor: 'SF9',
    bandwidth_khz: 125,
    coding_rate: '4/5',
    frequency_mhz: 868.100
  };

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 font-mono text-[10px]">
      <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-tactical-border/60 pb-1.5">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <Network className="w-4 h-4 text-tactical-cyan" />
          LORA MESH TOPOLOGY &amp; 24-BYTE BINARY CODEC
        </span>
        <StatusBadge
          status={isLoRa ? 'WARNING' : 'NORMAL'}
          label={isLoRa ? 'LORA 868MHz MESH' : '4G LTE PRIMARY'}
          size="xs"
        />
      </div>

      {/* Network Node Topology Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-2 rounded border transition-all ${
          !isLoRa ? 'bg-tactical-card border-tactical-cyan' : 'bg-slate-900 border-tactical-border opacity-50'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>CELLULAR 4G/LTE</span>
            <span className={!isLoRa ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {!isLoRa ? 'PRIMARY' : 'ATTENUATED'}
            </span>
          </div>
          <div className="text-slate-400 mt-1">RSSI: {comms.cellular_rssi_dbm} dBm</div>
          <div className="text-slate-500 text-[9px]">Relay: Ranger Tower 01</div>
        </div>

        <div className={`p-2 rounded border transition-all ${
          isLoRa ? 'bg-amber-950/40 border-amber-500 shadow-amber-glow' : 'bg-slate-900 border-tactical-border'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>LORA 868MHz MESH</span>
            <span className={isLoRa ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
              {isLoRa ? 'ACTIVE FAILOVER' : 'STANDBY'}
            </span>
          </div>
          <div className="text-slate-400 mt-1">SNR: +{comms.lora_snr_db} dB | Hops: {comms.hop_count}</div>
          <div className="text-slate-500 text-[9px]">Air Time (ToA): {bin.toa_ms} ms</div>
        </div>
      </div>

      {/* 24-Byte Compact Binary Stream Box */}
      <div className="p-2 rounded bg-black/85 border border-cyan-950/90 space-y-1">
        <div className="flex items-center justify-between text-[9px] text-tactical-muted">
          <span>24-BYTE BINARY PACKET [STRUCT !2sIIiiBBBBH]:</span>
          <span className="text-cyan-400 font-bold">{bin.spreading_factor} / {bin.bandwidth_khz}kHz (CR {bin.coding_rate})</span>
        </div>
        <div className="text-[9px] text-emerald-400 break-all font-mono tracking-wider">
          {bin.raw_hex}
        </div>
        <div className="flex justify-between text-[8px] text-slate-400 border-t border-cyan-950/60 pt-0.5">
          <span>CRC-16: <strong className="text-cyan-300">{bin.crc16}</strong></span>
          <span>FREQ: {bin.frequency_mhz} MHz</span>
          <span>PAYLOAD: 24 BYTES (0 BYTE LOSS)</span>
        </div>
      </div>
    </div>
  );
}
