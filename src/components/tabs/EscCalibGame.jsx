import React from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Zap, CheckCircle2, AlertTriangle, ShieldAlert, Play, Battery, Power, ArrowDown } from 'lucide-react';

export const EscCalibGame = () => {
  const {
    escState,
    setEscThrottleMax,
    setEscThrottleMin,
    lipoConnected,
    toggleLipo,
    safetySwitchPressed,
    toggleSafetySwitch,
    propsInstalled,
    triggerSafetyViolation,
  } = useSimulator();

  const stepsList = [
    { num: 1, title: 'Set Throttle to MAXIMUM', desc: 'Move RC Transmitter throttle stick all the way up (1900us).' },
    { num: 2, title: 'Plug in LiPo Battery', desc: 'Connect LiPo on Virtual Bench to power ESCs with max throttle signal.' },
    { num: 3, title: 'Unplug & Re-plug LiPo', desc: 'Re-plug LiPo battery to enter ESC calibration programming mode. ESCs will emit musical init chimes!' },
    { num: 4, title: 'Press FC Safety Switch', desc: 'Press safety switch (turns solid red) to allow PWM passthrough signal to motors.' },
    { num: 5, title: 'Pull Throttle to MINIMUM', desc: 'Pull throttle stick down to MIN (1100us). ESCs will play long confirmation chime!' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="gcs-panel p-4 sm:p-5 rounded-xl border flex flex-wrap items-center justify-between gap-3 sm:gap-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
              <span className="hidden sm:inline">ALL-AT-ONCE </span>ESC THROTTLE CALIBRATION
            </h2>
          </div>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Calibrate Electronic Speed Controller (ESC) max/min throttle range across all 4 motors simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ESC Step:</span>
          <span className="text-sm font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded border border-amber-500/50">
            STEP {escState.step} / 5
          </span>
        </div>
      </div>

      {/* Safety Warning */}
      {propsInstalled && (
        <div className="p-3 bg-red-950/80 border-2 border-red-500 rounded-xl flex items-center justify-between gap-3 text-red-300 font-mono text-xs animate-shake">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>EXTREME RISK: ESC CALIBRATION MANDATES PROPELLERS REMOVED! ACCIDENTAL MOTOR SPIN CAN OCCUR.</span>
          </div>
        </div>
      )}

      {/* Interactive Step Machine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Step-by-Step Card Flow (2 Cols) */}
        <div className="lg:col-span-2 space-y-3 font-mono">
          {stepsList.map((st) => {
            const isCurrent = escState.step === st.num;
            const isDone = escState.step > st.num || escState.completed;
            return (
              <div
                key={st.num}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'border opacity-60'
                  }`}
                  style={(!isDone && !isCurrent) ? { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-subtle)' } : {}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center ${
                        isDone
                            ? 'bg-emerald-500 text-slate-950'
                            : isCurrent
                            ? 'bg-amber-500 text-slate-950 animate-bounce'
                            : ''
                          }`}
                          style={(!isDone && !isCurrent) ? { backgroundColor: 'var(--bg-badge)', color: 'var(--text-subtle)' } : {}}
                    >
                      {st.num}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{st.title}</h4>
                      <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-secondary)' }}>{st.desc}</p>
                    </div>
                  </div>

                  {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>

                {/* Step Action Buttons */}
                {isCurrent && (
                  <div className="mt-4 pt-3 border-t border-amber-500/30 flex flex-wrap justify-end gap-2">
                    {st.num === 1 && (
                      <button
                        onClick={setEscThrottleMax}
                        className="px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg w-full sm:w-auto"
                      >
                        Set Throttle to MAX (1900us) →
                      </button>
                    )}
                    {(st.num === 2 || st.num === 3) && (
                      <button
                        onClick={toggleLipo}
                        className="px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <Battery className="w-4 h-4" />
                        {lipoConnected ? 'Unplug LiPo Battery' : 'Plug LiPo Battery'}
                      </button>
                    )}
                    {st.num === 4 && (
                      <button
                        onClick={toggleSafetySwitch}
                        className="px-4 sm:px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <Power className="w-4 h-4" />
                        Press FC Safety Switch (Solid Red)
                      </button>
                    )}
                    {st.num === 5 && (
                      <button
                        onClick={setEscThrottleMin}
                        className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <ArrowDown className="w-4 h-4" />
                        Pull Throttle to MINIMUM (1100us)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status & Feedback Panel (1 Col) */}
        <div className="gcs-panel p-5 rounded-xl border flex flex-col justify-between font-mono" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              ESC Audio Beep Feedback
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="text-amber-400 font-bold mb-1">ESC Initialization Beeps:</div>
                <p className="font-sans" style={{ color: 'var(--text-muted)' }}>
                  {escState.beepsPlayed ? '🎵 Musical rising tone sequence heard!' : 'Waiting for LiPo re-plug step...'}
                </p>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="text-emerald-400 font-bold mb-1">Calibration Confirmation:</div>
                <p className="font-sans" style={{ color: 'var(--text-muted)' }}>
                  {escState.completed ? '🎵 Long confirmation chime played!' : 'Waiting for throttle MIN step...'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-[11px] font-sans" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <span className="font-mono font-bold text-amber-400">Why All-at-Once Calibration?</span>
            <p className="mt-1">
              It ensures all 4 motor ESCs register identical PWM endpoints [1100us - 1900us], preventing motor spin desync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
