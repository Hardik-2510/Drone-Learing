import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { AlertOctagon, Flame, Wrench, XCircle } from 'lucide-react';

export const SafetyModal = () => {
  const { safetyAlert, setSafetyAlert, toggleProps } = useSimulator();

  if (!safetyAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full glass-card border-2 border-red-500 rounded-xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse-glow-red relative">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/50 animate-bounce">
            <AlertOctagon className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400 font-mono tracking-wider">CRITICAL HAZARD!</h3>
            <p className="text-xs text-red-300">Safety Check Failed</p>
          </div>
        </div>

        <div className="space-y-3 mb-6 bg-red-950/40 p-4 rounded-lg border border-red-800/50">
          <div className="flex items-start gap-2 text-red-200 text-sm font-semibold">
            <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{safetyAlert.title}</span>
          </div>
          <p className="text-xs leading-relaxed font-sans" style={{ color: 'var(--text-secondary)' }}>
            {safetyAlert.message}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              toggleProps();
              setSafetyAlert(null);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all font-mono text-sm"
          >
            <Wrench className="w-4 h-4" />
            SAFELY REMOVE PROPELLERS NOW
          </button>

          <button
            onClick={() => setSafetyAlert(null)}
            className="w-full py-2 font-mono text-xs rounded-lg flex items-center justify-center gap-1 transition-all border"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <XCircle className="w-3.5 h-3.5" />
            Dismiss Hazard Warning
          </button>
        </div>
      </div>
    </div>
  );
};
