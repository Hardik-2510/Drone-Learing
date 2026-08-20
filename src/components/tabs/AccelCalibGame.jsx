import React, { useState, useEffect, useRef } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, RotateCw, Play } from 'lucide-react';

export const AccelCalibGame = () => {
  const { accelState, completeAccelStep, addLog } = useSimulator();
  const [isSampling, setIsSampling] = useState(false);
  const [sampleProgress, setSampleProgress] = useState(0);
  const [mouseJitter, setMouseJitter] = useState(false);
  const [rotation, setRotation] = useState({ pitch: 0, roll: 0, yaw: 0 });

  const steps = [
    { name: 'LEVEL (Top Up)', pitch: 0, roll: 0, yaw: 0, desc: 'Place vehicle flat and level on a still surface.' },
    { name: 'LEFT SIDE (Left Down)', pitch: 0, roll: -90, yaw: 0, desc: 'Rotate drone onto its left edge.' },
    { name: 'RIGHT SIDE (Right Down)', pitch: 0, roll: 90, yaw: 0, desc: 'Rotate drone onto its right edge.' },
    { name: 'NOSE DOWN', pitch: 90, roll: 0, yaw: 0, desc: 'Tilt drone nose straight down towards ground.' },
    { name: 'NOSE UP', pitch: -90, roll: 0, yaw: 0, desc: 'Point drone nose straight up towards sky.' },
    { name: 'BACK (Bottom Up)', pitch: 0, roll: 180, yaw: 0, desc: 'Invert drone with belly/bottom facing up.' },
  ];

  const currentTarget = steps[accelState.currentStepIndex];
  const lastMousePos = useRef({ x: 0, y: 0 });
  const jitterDetected = useRef(false);

  // Monitor mouse movement for stillness physics check
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isSampling) return;
      const dx = Math.abs(e.clientX - lastMousePos.current.x);
      const dy = Math.abs(e.clientY - lastMousePos.current.y);
      if (dx > 4 || dy > 4) {
        jitterDetected.current = true;
        setMouseJitter(true);
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    // Touch movement also counts as jitter
    const handleTouchMove = () => {
      if (!isSampling) return;
      jitterDetected.current = true;
      setMouseJitter(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isSampling]);

  // Handle Sampling timer (2 seconds = 20 ticks of 100ms)
  const handleStartSampling = () => {
    setIsSampling(true);
    setSampleProgress(0);
    setMouseJitter(false);
    jitterDetected.current = false;

    let ticks = 0;
    const interval = setInterval(() => {
      ticks += 5;
      setSampleProgress(ticks);

      if (jitterDetected.current) {
        clearInterval(interval);
        setIsSampling(false);
        completeAccelStep(false); // Fail due to movement
        return;
      }

      if (ticks >= 100) {
        clearInterval(interval);
        setIsSampling(false);
        completeAccelStep(true); // Success
      }
    }, 100);
  };

  // Sync orientation with target
  useEffect(() => {
    if (currentTarget) {
      setRotation({ pitch: currentTarget.pitch, roll: currentTarget.roll, yaw: currentTarget.yaw });
    }
  }, [accelState.currentStepIndex]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="gcs-panel p-4 sm:p-5 rounded-xl border flex flex-wrap items-center justify-between gap-3 sm:gap-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
              <span className="hidden sm:inline">3-AXIS ACCELEROMETER </span>6-POSITION CALIBRATION
            </h2>
          </div>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Calibrate gravity offsets across 6 cardinal positions. Strictly requires 0.0 movement during 2s sampling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Progress:</span>
          <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/50">
            {accelState.completedSteps.filter(Boolean).length} / 6 POSITIONS
          </span>
        </div>
      </div>

      {/* Physics Rule Banner */}
      <div className="p-3 bg-red-950/40 border border-red-500/60 rounded-xl flex items-center gap-3 font-mono text-xs text-red-300">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <span className="font-bold uppercase text-red-400">CRITICAL PHYSICS STILLNESS RULE:</span> Keep the mouse & drone completely motionless for 2.0 seconds after clicking "Click when Done"! Any jitter will cause "Accel Inconsistent" failure.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 3D Drone Orientation Canvas (2 Cols) */}
        <div className="lg:col-span-2 gcs-panel p-4 sm:p-6 rounded-xl border flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px] relative overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Position {accelState.currentStepIndex + 1}: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{currentTarget?.name}</span>
          </div>

          {/* 3D Visual Model Box — scales with screen */}
          <div
            className="relative transition-transform duration-700 ease-out flex items-center justify-center"
            style={{
              width: 'min(224px, 80vw)',
              height: 'min(224px, 80vw)',
              transformStyle: 'preserve-3d',
              transform: `perspective(800px) rotateX(${rotation.pitch}deg) rotateY(${rotation.yaw}deg) rotateZ(${rotation.roll}deg)`,
            }}
          >
            {/* Drone 3D Chassis */}
            <div className="w-40 h-40 bg-slate-900 border-4 border-purple-500 rounded-2xl flex flex-col items-center justify-between p-3 shadow-[0_0_40px_rgba(168,85,247,0.4)] relative">
              <div className="text-[10px] font-mono text-purple-300 font-bold">FRONT / NOSE ↑</div>

              <div className="w-16 h-16 bg-slate-950 rounded-xl border border-cyan-500/80 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold shadow-inner">
                ACCEL 1
              </div>

              <div className="text-[10px] font-mono text-slate-500">TAIL</div>

              {/* Arms */}
              <div className="absolute -top-8 -right-8 w-12 h-12 rounded-full border-2 border-purple-400/40 bg-purple-900/20 flex items-center justify-center text-[9px] font-mono text-purple-300">
                M1
              </div>
              <div className="absolute -bottom-8 -right-8 w-12 h-12 rounded-full border-2 border-purple-400/40 bg-purple-900/20 flex items-center justify-center text-[9px] font-mono text-purple-300">
                M2
              </div>
              <div className="absolute -bottom-8 -left-8 w-12 h-12 rounded-full border-2 border-purple-400/40 bg-purple-900/20 flex items-center justify-center text-[9px] font-mono text-purple-300">
                M3
              </div>
              <div className="absolute -top-8 -left-8 w-12 h-12 rounded-full border-2 border-purple-400/40 bg-purple-900/20 flex items-center justify-center text-[9px] font-mono text-purple-300">
                M4
              </div>
            </div>
          </div>

          {/* Sampling Overlay Progress Bar */}
          {isSampling && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 z-20 font-mono">
              <div className="w-full max-w-md p-6 rounded-xl border border-emerald-500/80 text-center shadow-2xl" style={{ backgroundColor: 'var(--bg-panel)' }}>
                <h4 className="text-base font-bold text-emerald-400 mb-2 flex items-center justify-center gap-2">
                  <Activity className="w-5 h-5 animate-spin" />
                  SAMPLING ACCELEROMETER... DO NOT MOVE!
                </h4>
                <p className="text-xs mb-4 font-sans" style={{ color: 'var(--text-secondary)' }}>
                  Hold drone perfectly STILL for 2 seconds while gyro/accel gravity vector is recorded.
                </p>
                <div className="w-full h-4 rounded-full overflow-hidden border p-0.5 mb-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-100"
                    style={{ width: `${sampleProgress}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-400 font-bold">{sampleProgress}%</div>
              </div>
            </div>
          )}

          {/* Failure Alert Overlay */}
          {accelState.failMessage && !isSampling && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-500 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{accelState.failMessage}</span>
            </div>
          )}
        </div>

        {/* 6 Position List & Action Controls (1 Col) */}
        <div className="gcs-panel p-5 rounded-xl border flex flex-col justify-between font-mono" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              6-Axis Cardinal Positions
            </h3>

            <div className="space-y-2 mb-6">
              {steps.map((s, idx) => {
                const isCurrent = idx === accelState.currentStepIndex;
                const isDone = accelState.completedSteps[idx];
                return (
                  <div
                    key={s.name}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                          : isCurrent
                          ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                          : 'border'
                      }`}
                      style={(!isDone && !isCurrent) ? { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-subtle)' } : {}}
                  >
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${isCurrent ? 'bg-purple-500 text-slate-950' : 'text-slate-500'}`}
                              style={!isCurrent ? { backgroundColor: 'var(--bg-badge)' } : {}}>
                          {idx + 1}
                        </span>
                      )}
                      <span>{s.name}</span>
                    </div>
                    {isDone && <span className="text-[10px] text-emerald-400 font-bold">DONE</span>}
                  </div>
                );
              })}
            </div>

            {/* Computed Offsets Table */}
            <div className="p-3 rounded-lg border text-xs mb-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="text-[10px] uppercase mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>Calculated Offsets:</div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <div className="p-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>X: <span className="text-cyan-400 font-bold">{accelState.offsets.x}</span></div>
                <div className="p-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>Y: <span className="text-cyan-400 font-bold">{accelState.offsets.y}</span></div>
                <div className="p-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>Z: <span className="text-cyan-400 font-bold">{accelState.offsets.z}</span></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartSampling}
            disabled={accelState.completed || isSampling}
            className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              accelState.completed
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
            }`}
          >
            <Play className="w-4 h-4" />
            {accelState.completed ? 'ALL 6 POSITIONS CALIBRATED!' : `CLICK WHEN DONE (${currentTarget?.name})`}
          </button>
        </div>
      </div>
    </div>
  );
};
