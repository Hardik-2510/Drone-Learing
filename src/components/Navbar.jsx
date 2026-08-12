import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { DocsModal } from './DocsModal';
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
  Activity,
  Layers,
  Navigation,
  Lock,
  BookOpen,
  Code,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

export const Navbar = () => {
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    allCalibrationsDone,
  } = useSimulator();

  const tabs = [
    { id: 'bench',    label: '1. Virtual Bench',    shortLabel: '1',  icon: Wrench },
    { id: 'flashing', label: '2. Firmware Flash',   shortLabel: '2',  icon: Cpu },
    { id: 'accel',    label: '3. Accel (6-Axis)',   shortLabel: '3',  icon: Activity },
    { id: 'compass',  label: '4. Compass 3D',       shortLabel: '4',  icon: Compass },
    { id: 'radio',    label: '5. Radio Setup',      shortLabel: '5',  icon: Radio },
    { id: 'esc',      label: '6. ESC Throttle',     shortLabel: '6',  icon: Zap },
    { id: 'sitl',     label: '7. 3D SITL Arena 🚀', shortLabel: '7🚀', icon: Navigation, requiresCalib: true },
  ];

  return (
    <>
      <header className="gcs-header sticky top-0 z-40 border-b border-slate-800 shadow-2xl">

        {/* ── Top GCS Bar ── */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">

          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-purple-950/60 border border-purple-500/40 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-100 font-mono tracking-wide flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="whitespace-nowrap">Mission Planner GCS</span>
                <span className="hidden sm:inline px-2 py-0.5 text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-full font-mono whitespace-nowrap">
                  Radiolink Crossflight V2
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans hidden xs:block truncate">
                Firmware Flashing &amp; Calibration Simulator by Hardik Patel
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Docs & Source — always visible */}
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/80 p-1 sm:p-1.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setShowDocsModal(true)}
                title="Open Commissioning Documentation & User Guide"
                className="px-2 sm:px-3 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-mono font-semibold flex items-center gap-1 sm:gap-1.5 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Docs</span>
              </button>

              <a
                href="https://github.com/Hardik-2510/Drone-Learing"
                target="_blank"
                rel="noopener noreferrer"
                title="Open GitHub Source Repository"
                className="px-2 sm:px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-semibold hidden sm:flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Source</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Desktop MAVLink Controls — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
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
                  <><PlugZap className="w-3.5 h-3.5" /><span>CONNECTED</span></>
                ) : (
                  <><Plug className="w-3.5 h-3.5" /><span>CONNECT</span></>
                )}
              </button>

              <button
                onClick={toggleSound}
                title={soundMuted ? 'Unmute Audio Tones' : 'Mute Audio Tones'}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded transition-all ml-1"
              >
                {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Mobile: Sound + Hamburger */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={toggleSound}
                title={soundMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded transition-all"
              >
                {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-slate-700"
                aria-label="Toggle connection menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Hamburger Drawer ── */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-slate-800 bg-slate-950/95 px-3 py-3 space-y-3">
            {/* Connect status bar */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${mavlinkConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {mavlinkConnected ? <PlugZap className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />}
                {mavlinkConnected ? 'MAVLink Connected' : 'MAVLink Disconnected'}
              </span>
              <button
                onClick={toggleMavlinkConnect}
                className={`px-3 py-1.5 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mavlinkConnected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600/90 hover:bg-red-500 text-white'
                }`}
              >
                {mavlinkConnected ? 'DISCONNECT' : 'CONNECT'}
              </button>
            </div>

            {/* Port & Baud selects */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Port:</label>
                <select
                  value={comPort}
                  onChange={(e) => setComPort(e.target.value)}
                  className="w-full bg-slate-900 text-cyan-300 text-xs font-mono px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
                >
                  <option>COM3 - Radiolink Crossflight V2</option>
                  <option>COM4 - MAVLink Telemetry 915MHz</option>
                  <option>COM7 - USB Serial Bootloader</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Baud Rate:</label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="w-full bg-slate-900 text-emerald-300 text-xs font-mono px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value={115200}>115200</option>
                  <option value={57600}>57600</option>
                  <option value={921600}>921600</option>
                </select>
              </div>
            </div>

            {/* Source link on mobile */}
            <a
              href="https://github.com/Hardik-2510/Drone-Learing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-cyan-300 text-xs font-mono hover:text-cyan-200 transition-all"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Source Code
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center overflow-x-auto py-1 gap-0.5 sm:gap-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = tab.requiresCalib && !allCalibrationsDone;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isLocked && setActiveTab(tab.id)}
                  title={isLocked ? 'Complete all calibrations to unlock 3D SITL Arena' : tab.label}
                  className={`px-2 sm:px-3 py-2 rounded-md font-mono text-xs font-medium flex items-center gap-1 sm:gap-2 transition-all whitespace-nowrap relative shrink-0 ${
                    isLocked
                      ? 'text-slate-600 border border-slate-800/50 cursor-not-allowed'
                      : isActive
                      ? 'bg-purple-900/50 text-purple-200 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  )}
                  {/* Mobile: short label; Desktop: full label */}
                  <span className="sm:hidden text-[11px]">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isLocked && (
                    <span className="hidden sm:inline text-[9px] bg-slate-800 text-slate-500 px-1 py-0.5 rounded ml-1">
                      LOCKED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <DocsModal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />
    </>
  );
};
