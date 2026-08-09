import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import {
  Plug,
  PlugZap,
  Volume2,
  VolumeX,
  Wrench,
  Cpu,
  Compass,
  Radio,
  Zap,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';

export const Navbar = () => {
  const {
    comPort,
    setComPort,
    baudRate,
    setBaudRate,
    mavlinkConnected,
    toggleMavlinkConnect,
    activeTab,
    setActiveTab,
    soundMuted,
    toggleSound,
    fcPower,
    firmwareInstalled,
  } = useSimulator();

  const tabs = [
    { id: 'bench', label: '1. Virtual Bench', icon: Wrench },
    { id: 'flashing', label: '2. Firmware Flashing', icon: Cpu },
    { id: 'accel', label: '3. Accel (6-Axis)', icon: Activity },
    { id: 'compass', label: '4. Compass 3D', icon: Compass },
    { id: 'radio', label: '5. Radio Setup', icon: Radio },
    { id: 'esc', label: '6. ESC Throttle', icon: Zap },
    { id: 'quiz', label: '7. Troubleshooting Quiz', icon: HelpCircle },
  ];

  return (
    <header className="gcs-header sticky top-0 z-40 border-b border-slate-800 shadow-2xl">
      {/* Top GCS Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-950/60 border border-purple-500/40 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Layers className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
              Mission Planner GCS
              <span className="px-2 py-0.5 text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-full font-mono">
                Radiolink Crossflight V2
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Commissioning & Calibration Simulator for Junior Engineers
            </p>
          </div>
        </div>

        {/* MAVLink Connection Controls */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Port:</label>
            <select
              value={comPort}
              onChange={(e) => setComPort(e.target.value)}
              className="bg-slate-900 text-cyan-300 text-xs font-mono px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option>COM3 - Radiolink Crossflight V2</option>
              <option>COM4 - MAVLink Telemetry 915MHz</option>
              <option>COM7 - USB Serial Bootloader</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Baud:</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              className="bg-slate-900 text-emerald-300 text-xs font-mono px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value={115200}>115200</option>
              <option value={57600}>57600</option>
              <option value={921600}>921600</option>
            </select>
          </div>

          <button
            onClick={toggleMavlinkConnect}
            className={`px-3 py-1.5 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              mavlinkConnected
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-red-600/90 hover:bg-red-500 text-white shadow-red-950/50'
            }`}
          >
            {mavlinkConnected ? (
              <>
                <PlugZap className="w-3.5 h-3.5" />
                <span>CONNECTED</span>
              </>
            ) : (
              <>
                <Plug className="w-3.5 h-3.5" />
                <span>CONNECT</span>
              </>
            )}
          </button>

          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute Audio Tones' : 'Mute Audio Tones'}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded transition-all"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-none py-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md font-mono text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-900/50 text-purple-200 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
