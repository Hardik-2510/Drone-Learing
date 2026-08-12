import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { StatusLed } from './common/StatusLed';
import {
  Wrench,
  Usb,
  Battery,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RotateCw,
  Power,
  Laptop,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const VirtualBench = () => {
  const {
    propsInstalled,
    usbConnected,
    lipoConnected,
    safetySwitchPressed,
    toggleProps,
    toggleUsb,
    toggleLipo,
    toggleSafetySwitch,
    fcPower,
    mavlinkConnected,
    firmwareInstalled,
    flashStage,
  } = useSimulator();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bench Header & Overview */}
      <div className="gcs-panel p-4 sm:p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-wider">
                PHYSICAL VIRTUAL BENCH
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Simulate physical hardware connections for Radiolink Crossflight V2 Flight Controller &amp; Quadcopter Chassis.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-3 sm:px-4 py-2 rounded-lg border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Autopilot Status</div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${fcPower ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                {fcPower ? (firmwareInstalled ? 'POWERED - ArduCopter V4.5' : 'POWERED - Bootloader Ready') : 'OFF (NO POWER)'}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Warning Banner */}
        <div
          className={`p-3 rounded-lg border flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 font-mono text-xs ${
            propsInstalled
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {propsInstalled ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {propsInstalled ? 'HAZARD STATUS: PROPELLERS INSTALLED' : 'SAFETY STATUS: PROPELLERS REMOVED'}
              </span>
              <p className="text-[11px] opacity-80 font-sans">
                {propsInstalled
                  ? 'Mandatory safety rule: Remove all props before flashing firmware or performing ESC throttle calibrations!'
                  : 'Bench is safe for high-risk commissioning procedures.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleProps}
            className={`px-3 py-1.5 rounded font-bold text-xs transition-all shrink-0 w-full sm:w-auto ${
              propsInstalled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {propsInstalled ? 'REMOVE PROPS NOW' : 'RE-INSTALL PROPS'}
          </button>
        </div>
      </div>

      {/* Main Bench Visual Representation & Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Visual Workbench Graphic (2 Columns) */}
        <div className="lg:col-span-2 gcs-panel p-4 sm:p-6 rounded-xl border border-slate-800 relative bg-slate-950/90 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px]">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Connected Cables & Flow Diagrams */}
          <div className="w-full relative flex flex-col items-center justify-between h-full gap-6 sm:gap-8 z-10">

            {/* Top Row: Laptop & USB Cable */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-2 sm:px-6">
              <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-md">
                <Laptop className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">GCS Laptop Station</div>
                  <div className="text-[10px] font-mono text-cyan-400">Mission Planner v1.3.81</div>
                </div>
              </div>

              {/* USB Cable indicator — horizontal on desktop, vertical on mobile */}
              <div className="flex sm:flex-1 sm:px-4 items-center justify-center w-full sm:w-auto">
                <div
                  className={`sm:h-1.5 sm:w-full h-full w-1.5 rounded-full transition-all duration-500 relative flex sm:block justify-center items-center ${
                    usbConnected
                      ? 'bg-cyan-500 shadow-[0_0_12px_#06b6d4]'
                      : 'bg-slate-800 border border-dashed border-slate-700'
                  }`}
                  style={{ minHeight: '2rem', minWidth: '6px' }}
                >
                  <span className="sm:absolute sm:-top-5 sm:left-1/2 sm:-translate-x-1/2 text-[10px] font-mono text-slate-400 sm:whitespace-nowrap px-1 sm:px-0 text-center sm:text-left">
                    {usbConnected ? 'USB 5V Power & MAVLink Data' : 'USB Disconnected'}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleUsb}
                className={`px-3 sm:px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 border transition-all w-full sm:w-auto justify-center ${
                  usbConnected
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Usb className="w-4 h-4" />
                <span className="sm:hidden">{usbConnected ? 'UNPLUG USB' : 'PLUG USB'}</span>
                <span className="hidden sm:inline">{usbConnected ? 'UNPLUG USB' : 'PLUG USB'}</span>
              </button>
            </div>

            {/* Middle: Quadcopter Chassis & Radiolink Crossflight V2 Flight Controller */}
            <div className="relative flex items-center justify-center" style={{ width: 'min(288px, 85vw)', height: 'min(288px, 85vw)' }}>
              {/* Drone Frame Graphic — scales with container */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Diagonal Arms */}
                <div className="absolute bg-slate-800 rounded-full rotate-45 border border-slate-700" style={{ width: '90%', height: '10px' }} />
                <div className="absolute bg-slate-800 rounded-full -rotate-45 border border-slate-700" style={{ width: '90%', height: '10px' }} />

                {/* Motors at 4 Corners */}
                {/* Motor 1: Top Right */}
                <div className="absolute top-2 right-2 flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-purple-500/60 flex items-center justify-center shadow-lg relative">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    {propsInstalled && (
                      <div className="absolute -inset-4 flex items-center justify-center">
                        <div className="w-20 h-2 bg-purple-500/40 rounded-full animate-spin-prop" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1">M1 (CCW)</span>
                </div>

                {/* Motor 2: Bottom Right */}
                <div className="absolute bottom-2 right-2 flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-purple-500/60 flex items-center justify-center shadow-lg relative">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    {propsInstalled && (
                      <div className="absolute -inset-4 flex items-center justify-center">
                        <div className="w-20 h-2 bg-purple-500/40 rounded-full animate-spin-prop" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1">M2 (CW)</span>
                </div>

                {/* Motor 3: Bottom Left */}
                <div className="absolute bottom-2 left-2 flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-purple-500/60 flex items-center justify-center shadow-lg relative">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    {propsInstalled && (
                      <div className="absolute -inset-4 flex items-center justify-center">
                        <div className="w-20 h-2 bg-purple-500/40 rounded-full animate-spin-prop" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1">M3 (CCW)</span>
                </div>

                {/* Motor 4: Top Left */}
                <div className="absolute top-2 left-2 flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-purple-500/60 flex items-center justify-center shadow-lg relative">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    {propsInstalled && (
                      <div className="absolute -inset-4 flex items-center justify-center">
                        <div className="w-20 h-2 bg-purple-500/40 rounded-full animate-spin-prop" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1">M4 (CW)</span>
                </div>
              </div>

              {/* Center FC Board: Radiolink Crossflight V2 */}
              <div className="relative z-20 bg-slate-900 border-2 border-purple-500/80 rounded-2xl p-3 shadow-[0_0_25px_rgba(168,85,247,0.3)] flex flex-col justify-between"
                   style={{ width: 'min(160px, 55%)', height: 'min(160px, 55%)' }}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono font-bold text-purple-300">RADIOLINK</span>
                  <span className="text-[9px] font-mono text-slate-400">Crossflight V2</span>
                </div>

                {/* FC Active Status LEDs */}
                <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800 flex items-center justify-around">
                  <StatusLed
                    color={fcPower ? (flashStage === 'FLASHING' ? 'red' : 'green') : 'off'}
                    state={flashStage === 'FLASHING' ? 'fast' : 'solid'}
                    label="PWR"
                  />
                  <StatusLed
                    color={mavlinkConnected ? 'blue' : fcPower ? 'blue' : 'off'}
                    state={mavlinkConnected ? 'fast' : 'slow'}
                    label="MAV"
                  />
                  <StatusLed
                    color={safetySwitchPressed ? 'red' : fcPower ? 'yellow' : 'off'}
                    state={safetySwitchPressed ? 'solid' : 'slow'}
                    label="ACT"
                  />
                </div>

                {/* Physical Safety Switch Button */}
                <button
                  onClick={toggleSafetySwitch}
                  className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 border transition-all ${
                    safetySwitchPressed
                      ? 'bg-red-950 text-red-300 border-red-500/80 shadow-[0_0_10px_#ef4444]'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Power className={`w-3 h-3 ${safetySwitchPressed ? 'text-red-400 animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{safetySwitchPressed ? 'SAFETY: ARMED / ON' : 'PRESS SAFETY SWITCH'}</span>
                  <span className="sm:hidden">{safetySwitchPressed ? 'ARMED' : 'SAFETY'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Row: LiPo Battery Cable */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-2 sm:px-6">
              <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-md">
                <Battery className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">LiPo Battery Station</div>
                  <div className="text-[10px] font-mono text-amber-400">4S 14.8V 2200mAh XT60</div>
                </div>
              </div>

              {/* Cable line */}
              <div className="flex sm:flex-1 sm:px-4 items-center justify-center w-full sm:w-auto">
                <div
                  className={`sm:h-1.5 sm:w-full h-full w-1.5 rounded-full transition-all duration-500 relative flex sm:block justify-center items-center ${
                    lipoConnected
                      ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-slate-800 border border-dashed border-slate-700'
                  }`}
                  style={{ minHeight: '2rem', minWidth: '6px' }}
                >
                  <span className="sm:absolute sm:-top-5 sm:left-1/2 sm:-translate-x-1/2 text-[10px] font-mono text-slate-400 sm:whitespace-nowrap px-1 sm:px-0 text-center sm:text-left">
                    {lipoConnected ? 'LiPo Main Bus Powered' : 'LiPo Disconnected'}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleLipo}
                className={`px-3 sm:px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 border transition-all w-full sm:w-auto justify-center ${
                  lipoConnected
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="sm:hidden">{lipoConnected ? 'DISCONNECT' : 'CONNECT LIPO'}</span>
                <span className="hidden sm:inline">{lipoConnected ? 'DISCONNECT LIPO' : 'CONNECT LIPO'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bench Interactive Control Panel & Checklist (1 Column) */}
        <div className="gcs-panel p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-purple-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Physical Hardware Controls
            </h3>

            <div className="space-y-2 sm:space-y-3">
              {/* Toggle 1: Propellers */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-200">1. Propellers</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: {propsInstalled ? 'INSTALLED (DANGER)' : 'REMOVED (SAFE)'}
                  </div>
                </div>
                <button
                  onClick={toggleProps}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    propsInstalled
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-emerald-400'
                  }`}
                >
                  {propsInstalled ? 'Remove' : 'Install'}
                </button>
              </div>

              {/* Toggle 2: USB Cable */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-200">2. Micro-USB Cable</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: {usbConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </div>
                </div>
                <button
                  onClick={toggleUsb}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    usbConnected
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {usbConnected ? 'Unplug' : 'Plug'}
                </button>
              </div>

              {/* Toggle 3: LiPo Battery */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-200">3. LiPo Battery</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: {lipoConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </div>
                </div>
                <button
                  onClick={toggleLipo}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    lipoConnected
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {lipoConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* Toggle 4: Safety Switch */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-200">4. Safety Switch</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: {safetySwitchPressed ? 'PRESSED (SOLID RED)' : 'RELEASED'}
                  </div>
                </div>
                <button
                  onClick={toggleSafetySwitch}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    safetySwitchPressed
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {safetySwitchPressed ? 'Release' : 'Press'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Physical Setup Checklist:
            </div>
            <div>• USB cable enables 5V logic &amp; firmware flashing.</div>
            <div>• LiPo battery provides 14.8V bus power for ESCs.</div>
            <div>• Propellers must be OFF during all bench setup steps.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
