import React from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import {
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Usb,
  UploadCloud,
  FileCode,
  Box
} from 'lucide-react';

export const GcsFlashingTab = () => {
  const {
    mavlinkConnected,
    toggleMavlinkConnect,
    flashStage,
    flashProgress,
    flashStatusText,
    firmwareInstalled,
    initiateFlashing,
    confirmUpload,
    usbConnected,
    toggleUsb,
    setFlashStage,
    propsInstalled,
  } = useSimulator();

  const vehicles = [
    { id: 'quad', name: 'ArduCopter Quad', icon: '🚁', version: 'V4.5.1 Stable', desc: 'Standard X-Frame Quadcopter firmware' },
    { id: 'plane', name: 'ArduPlane Fixed-Wing', icon: '🛩️', version: 'V4.5.1 Stable', desc: 'Conventional elevator & rudder plane' },
    { id: 'rover', name: 'ArduRover Ackermann', icon: '🏎️', version: 'V4.5.0 Stable', desc: 'Ground rover & differential steering' },
    { id: 'heli', name: 'Traditional Heli', icon: '🚁', version: 'V4.5.1 Stable', desc: 'Single rotor with swashplate servos' },
    { id: 'sub', name: 'ArduSub ROV', icon: '🛥️', version: 'V4.4.0 Stable', desc: 'Underwater tethered sub' },
    { id: 'vtol', name: 'VTOL Quadplane', icon: '🛩️', version: 'V4.5.1 Stable', desc: 'Hybrid vertical takeoff airplane' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="gcs-panel p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-wider">
              <span className="hidden sm:inline">MISSION PLANNER - </span>FIRMWARE INSTALLATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Simulate ArduPilot bootloader handshake & firmware flash state machine for Radiolink Crossflight V2.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">MAVLink State:</span>
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
              mavlinkConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}
          >
            <span className="sm:hidden">{mavlinkConnected ? 'CONNECTED (DISCONNECT TO FLASH)' : 'DISCONNECTED (READY)'}</span>
            <span className="hidden sm:inline">{mavlinkConnected ? 'CONNECTED (DISCONNECT REQUIRED TO FLASH)' : 'DISCONNECTED (READY)'}</span>
          </span>
        </div>
      </div>

      {/* Active Connection Lock Warning Modal */}
      {flashStage === 'WARN_CONNECTED' && (
        <div className="p-3 sm:p-4 bg-amber-950/60 border-2 border-amber-500 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 animate-shake font-mono">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">ACTIVE CONNECTION LOCK TRIGGERED!</h4>
              <p className="text-xs text-slate-300 font-sans">
                Flashing cannot begin while MAVLink telemetry is actively CONNECTED. You must click DISCONNECT first to free the COM port for bootloader flashing.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              toggleMavlinkConnect();
              setFlashStage('IDLE');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shrink-0 shadow-md w-full sm:w-auto"
          >
            DISCONNECT MAVLINK NOW
          </button>
        </div>
      )}

      {/* Flashing State Wizard */}
      {flashStage === 'CONFIRM' && (
        <div className="gcs-panel p-6 rounded-xl border-2 border-cyan-500/80 bg-slate-950/90 max-w-xl mx-auto shadow-[0_0_30px_rgba(6,182,212,0.2)] font-mono">
          <div className="flex items-center gap-3 text-cyan-400 mb-4">
            <UploadCloud className="w-7 h-7" />
            <h3 className="text-base font-bold">CONFIRM FIRMWARE UPLOAD</h3>
          </div>
          <p className="text-xs text-slate-300 font-sans mb-4 leading-relaxed">
            Are you sure you want to upload <span className="font-bold text-cyan-300">ArduCopter V4.5.1 Quad</span> to your Radiolink Crossflight V2 board over USB? Existing parameters will be backed up.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setFlashStage('IDLE')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpload}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-cyan-950/50"
            >
              Yes, Upload Firmware
            </button>
          </div>
        </div>
      )}

      {/* Bootloader Reset Trigger Step */}
      {flashStage === 'WAITING_BOOTLOADER' && (
        <div className="gcs-panel p-6 rounded-xl border-2 border-purple-500 bg-purple-950/40 max-w-xl mx-auto shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono animate-pulse">
          <div className="flex items-center gap-3 text-purple-300 mb-3">
            <Usb className="w-7 h-7 animate-bounce" />
            <h3 className="text-base font-bold">BOOTLOADER RESET REQUIRED!</h3>
          </div>
          <p className="text-xs text-slate-200 font-sans mb-4 leading-relaxed">
            Please reset board now: <span className="font-bold text-purple-300">Unplug USB cable and plug back in</span> on the Virtual Bench to trigger the bootloader handshake.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-purple-800/60 mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">USB Status:</span>
            <span className={`text-xs font-bold ${usbConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {usbConnected ? 'PLUGGED IN (UNPLUG NEXT)' : 'UNPLUGGED (PLUG BACK IN NEXT)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleUsb}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2"
            >
              <Usb className="w-4 h-4" />
              {usbConnected ? 'CLICK TO UNPLUG USB ON BENCH' : 'CLICK TO RE-PLUG USB ON BENCH'}
            </button>
          </div>
        </div>
      )}

      {/* Active Flashing Progress Screen */}
      {flashStage === 'FLASHING' && (
        <div className="gcs-panel p-8 rounded-xl border-2 border-red-500/80 bg-slate-950 max-w-2xl mx-auto shadow-[0_0_40px_rgba(239,68,68,0.3)] font-mono">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
              <h3 className="text-base font-bold text-slate-100">PROGRAMMING AUTOPILOT FLASH...</h3>
            </div>
            <span className="text-lg font-bold text-red-400">{flashProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-800 p-0.5 mb-4">
            <div
              className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-150 shadow-[0_0_15px_#ef4444]"
              style={{ width: `${flashProgress}%` }}
            />
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>Stage: {flashStatusText}</span>
            <span className="text-[10px] text-red-400 font-bold animate-pulse">FC LED: SOLID RED</span>
          </div>
        </div>
      )}

      {/* Flashing Completed Celebration Screen */}
      {flashStage === 'COMPLETE' && (
        <div className="gcs-panel p-6 rounded-xl border-2 border-emerald-500 bg-emerald-950/30 max-w-xl mx-auto font-mono text-center">
          <div className="inline-p-3 bg-emerald-500/20 text-emerald-400 rounded-full p-3 mb-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-emerald-300 mb-1">UPLOAD DONE & VERIFIED!</h3>
          <p className="text-xs text-slate-300 font-sans mb-4">
            ArduCopter V4.5.1 Quad firmware successfully flashed to Radiolink Crossflight V2. Musical startup chime played!
          </p>
          <button
            onClick={() => setFlashStage('IDLE')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-950/50"
          >
            Return to Firmware Grid
          </button>
        </div>
      )}

      {/* Target Firmware Vehicle Selection Grid */}
      {flashStage === 'IDLE' && (
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider mb-4">
            Select Target Vehicle Firmware Icon:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {vehicles.map((v) => {
              const isQuad = v.id === 'quad';
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (isQuad) initiateFlashing();
                  }}
                  className={`gcs-panel p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isQuad
                      ? 'border-purple-500/80 hover:border-purple-400 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                      : 'border-slate-800 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{v.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-cyan-400 rounded border border-slate-700">
                      {v.version}
                    </span>
                  </div>
                  <h4 className="text-base font-bold font-mono text-slate-100 group-hover:text-purple-300 transition-colors">
                    {v.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-sans mt-1">{v.desc}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-slate-500">Board: Crossflight V2</span>
                    <span className={`font-bold ${isQuad ? 'text-purple-400' : 'text-slate-500'}`}>
                      {isQuad ? 'Click to Flash →' : 'Secondary'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
