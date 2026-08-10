import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Wrench,
  Cpu,
  Activity,
  Compass,
  Radio,
  Zap,
  Navigation,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  FileText
} from 'lucide-react';

export const DocsModal = ({ isOpen, onClose }) => {
  const [activeDocTab, setActiveDocTab] = useState('overview');

  if (!isOpen) return null;

  const docTabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'bench', label: '1. Bench & Safety', icon: Wrench },
    { id: 'flashing', label: '2. Firmware Flash', icon: Cpu },
    { id: 'calib', label: '3-6. Calibrations', icon: Activity },
    { id: 'sitl', label: '7. SITL Arena', icon: Navigation },
    { id: 'faq', label: 'FAQs & Troubleshooting', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-4xl w-full max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/80 border border-purple-500/40 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                MISSION PLANNER SIMULATOR DOCUMENTATION
                <span className="px-2 py-0.5 text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-full font-mono">
                  v2.4 User Guide
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                End-to-End Drone Commissioning & Radiolink Crossflight V2 Autopilot Setup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-800 bg-slate-900/30 px-5 flex items-center gap-2 overflow-x-auto py-2">
          {docTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDocTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDocTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed flex-1 font-sans">
          {activeDocTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-purple-950/40 border border-purple-500/40 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-purple-300 font-mono flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Welcome to Drone Commissioning Simulator
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Complete interactive guide for quadcopter setup on Radiolink Crossflight V2 Autopilot.
                  </p>
                </div>
                <a
                  href="https://github.com/Hardik-2510/Drone-Learing/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all shrink-0 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Detailed README Info on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              <p>
                This web application simulates the full commissioning sequence for a quadcopter running on a <strong>Radiolink Crossflight V2 Flight Controller</strong> with ArduPilot firmware.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 text-xs font-mono mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Safety-First Learning
                  </h4>
                  <p className="text-xs text-slate-400">
                    Enforces prop removal rules and bootloader safety checks before high-risk operations like flashing or ESC throttle programming.
                  </p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-100 text-xs font-mono mb-2 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    3D SITL Flight Arena
                  </h4>
                  <p className="text-xs text-slate-400">
                    Once all calibrations are complete, unlock the 3D Three.js flight arena with real-world Leaflet satellite mapping at UTU Maliba Campus, Bardoli.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeDocTab === 'bench' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                Stage 1: Physical Virtual Bench Setup
              </h3>
              <ul className="space-y-2.5 text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Propeller Safety Toggle:</strong> Click <em>REMOVE PROPS NOW</em> to ensure bench safety before performing ESC or firmware procedures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>USB Power Cable:</strong> Click <em>PLUG USB</em> to supply 5V telemetry power to the Radiolink Crossflight board.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>LiPo Battery:</strong> Toggle 4S LiPo power on/off for ESC high-voltage initialization.</span>
                </li>
              </ul>
            </div>
          )}

          {activeDocTab === 'flashing' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Stage 2: ArduPilot Firmware Flashing
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 font-sans">
                <li>Click <strong>DISCONNECT MAVLink</strong> in the top header (COM port lock protection).</li>
                <li>Select target firmware (e.g., <em>ArduCopter Quad V4.5.1 Stable</em>).</li>
                <li>Confirm firmware upload in the dialog window.</li>
                <li>Perform physical bootloader reset by toggling USB cable on bench.</li>
                <li>Wait for flashing progress to complete and automatic reboot into ArduCopter firmware.</li>
              </ol>
            </div>
          )}

          {activeDocTab === 'calib' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Stages 3-6: Sensor & Hardware Calibrations
              </h3>
              <div className="space-y-3 font-sans text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-slate-100 font-mono">3. Accel (6-Axis):</strong> Rotate vehicle through 6 cardinal positions (Level, Left, Right, Nose Down, Nose Up, Inverted). Keep mouse motionless for 2.0s per position.
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-slate-100 font-mono">4. Compass 3D:</strong> Drag 3D globe or enable Auto-Orbit mode to capture 120 spherical magnetic vector points.
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-slate-100 font-mono">5. Radio Setup:</strong> Drag Mode-2 virtual joysticks to set min/max PWM limits [1100µs - 1900µs] and verify Channel 2 Pitch reversal.
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-slate-100 font-mono">6. ESC Throttle:</strong> Follow the 5-step sequence (Set MAX → Plug LiPo → Re-plug LiPo → Press Safety Switch → Set MIN). Listen for ESC chimes.
                </div>
              </div>
            </div>
          )}

          {activeDocTab === 'sitl' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-400" />
                Stage 7: 3D SITL Flight Arena
              </h3>
              <p className="font-sans text-xs text-slate-300">
                Unlocked after completing all calibrations. Features a 3D Three.js flight view with physical rotor spinning and a Leaflet map showing live GPS coordinates at UTU Maliba Campus, Bardoli.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-purple-300">ARM / DISARM</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300">TAKEOFF SLIDER</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-emerald-300">STABILIZE / ALT_HOLD / POSHOLD</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300">RTL (Return to Launch)</span>
              </div>
            </div>
          )}

          {activeDocTab === 'faq' && (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-lg text-amber-200">
                <strong className="font-mono text-amber-400">Q: Why is SITL Arena Locked?</strong>
                <p className="mt-1">Complete all 6 preceding commissioning steps (Bench, Flashing, Accel, Compass, Radio, ESC) to unlock flight testing.</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <strong className="font-mono text-cyan-400">Q: Accel Inconsistent Error?</strong>
                <p className="mt-1">Ensure zero mouse movement during the 2.0s sampling window for each cardinal position.</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <strong className="font-mono text-purple-400">Q: Channel Reversal Warning?</strong>
                <p className="mt-1">Click "TOGGLE REVERSE CH2" in the Radio tab to invert pitch channel direction according to ArduPilot standards.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Radiolink Crossflight V2 • ArduPilot Commissioning Guide
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Hardik-2510/Drone-Learing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Detailed README Info</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Close Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
