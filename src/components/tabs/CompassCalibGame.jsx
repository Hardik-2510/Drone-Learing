import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Compass, CheckCircle2, RotateCw, Sparkles, RefreshCw, Play, Square, Zap } from 'lucide-react';

// 120 Fibonacci sphere points — easier to fill to 100%
function buildSpherePoints() {
  const pts = [];
  const N = 120;
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pts.push({ id: i, nx: Math.cos(theta) * r, ny: y, nz: Math.sin(theta) * r, green: false });
  }
  return pts;
}

const TOTAL_PTS = 120;

export const CompassCalibGame = () => {
  const { compassState, sampleCompassPoints, addLog } = useSimulator();

  const canvasRef = useRef(null);
  const rotXRef = useRef(0.4);
  const rotYRef = useRef(0.3);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const autoRef = useRef(false);
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  // Points + green count live in refs for stale-closure-free rAF access
  const ptsRef = useRef(buildSpherePoints());
  const greenCountRef = useRef(0);
  const sentProgressRef = useRef(0); // how many % we've already sent to context

  const [autoRotate, setAutoRotate] = useState(false);
  const [displayGreen, setDisplayGreen] = useState(0);

  // Sync completed flag from context into ref
  useEffect(() => {
    completedRef.current = compassState.completed;
    if (compassState.completed) {
      // Mark all points green visually
      ptsRef.current.forEach((p) => { p.green = true; });
      greenCountRef.current = TOTAL_PTS;
    }
  }, [compassState.completed]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    ptsRef.current = buildSpherePoints();
    greenCountRef.current = 0;
    sentProgressRef.current = 0;
    setDisplayGreen(0);
    // Reset context progress by sending a huge negative — but context has no reset,
    // so just reload the page as workaround (or we can re-use a local-only visual reset)
  }, []);

  // ── Quick Calibrate ──
  const handleQuickCalib = useCallback(() => {
    if (completedRef.current) return;
    // Mark all green instantly
    ptsRef.current.forEach((p) => { p.green = true; });
    greenCountRef.current = TOTAL_PTS;
    const remaining = 100 - sentProgressRef.current;
    if (remaining > 0) {
      sentProgressRef.current = 100;
      setDisplayGreen(TOTAL_PTS);
      sampleCompassPoints(remaining);
    }
    addLog('INFO', 'Compass: Quick calibration applied. All 120 sphere vectors captured.');
  }, [sampleCompassPoints, addLog]);

  const toggleAuto = () => {
    const next = !autoRef.current;
    autoRef.current = next;
    setAutoRotate(next);
  };

  // ── Main canvas render loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const R = Math.min(CX, CY) - 28;

    const render = () => {
      // Auto-orbit: Lissajous pattern — faster to ensure full coverage
      if (autoRef.current && !completedRef.current) {
        rotYRef.current += 0.032;
        rotXRef.current += 0.019;
      }

      const cx = Math.cos(rotXRef.current), sx = Math.sin(rotXRef.current);
      const cy = Math.cos(rotYRef.current), sy = Math.sin(rotYRef.current);

      let newGreen = 0;
      const projected = ptsRef.current.map((p) => {
        // Rotate around Y axis then X axis
        const x1 = p.nx * cy + p.nz * sy;
        const z1 = -p.nx * sy + p.nz * cy;
        const y2 = p.ny * cx - z1 * sx;
        const z2 = p.ny * sx + z1 * cx;

        // ✅ FIXED: threshold lowered to -0.1 so ~57% of sphere turns green per view
        // Combined with Lissajous orbit, all 120 points get hit quickly
        if (!p.green && z2 > -0.1) {
          p.green = true;
        }
        if (p.green) newGreen++;

        return { id: p.id, sx: CX + x1 * R, sy: CY + y2 * R, sz: z2, green: p.green };
      });

      greenCountRef.current = newGreen;

      // Push progress to context incrementally
      const pct = Math.min(100, Math.round((newGreen / TOTAL_PTS) * 100));
      if (pct > sentProgressRef.current && !completedRef.current) {
        const delta = pct - sentProgressRef.current;
        sentProgressRef.current = pct;
        setDisplayGreen(newGreen);
        sampleCompassPoints(delta);
      }

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Sphere wireframe ring
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(51,65,85,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Latitude / equator ellipse
      ctx.beginPath();
      ctx.ellipse(CX, CY, R, Math.abs(R * cx), 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99,102,241,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sort back-to-front for correct depth rendering
      projected.sort((a, b) => a.sz - b.sz);

      // Draw points
      projected.forEach((p) => {
        const depth = (p.sz + 1) / 2;
        const size = p.green ? 3.5 + depth * 2 : 1.8 + depth * 0.8;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        if (p.green) {
          ctx.fillStyle = `rgba(16,185,129,${0.55 + depth * 0.45})`;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 7;
        } else {
          ctx.fillStyle = `rgba(148,163,184,${0.1 + depth * 0.35})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Drone crosshair at center
      ctx.save();
      ctx.translate(CX, CY);
      ctx.strokeStyle = completedRef.current ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -14); ctx.lineTo(14, 14);
      ctx.moveTo(14, -14); ctx.lineTo(-14, 14);
      ctx.stroke();
      ctx.fillStyle = completedRef.current ? '#10b981' : '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Progress bar at bottom
      const barW = W - 60;
      const barX = 30;
      const barY = H - 22;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, 10, 5);
      ctx.fill();
      const fillColor = completedRef.current ? '#10b981' : `hsl(${sentProgressRef.current * 1.2}, 80%, 55%)`;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * (sentProgressRef.current / 100), 10, 5);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        completedRef.current
          ? '✓ 100% — COMPASS SPHERE COMPLETE'
          : `${sentProgressRef.current}% — Drag canvas or click Auto-Orbit`,
        CX, barY - 6
      );

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // runs once — all mutable state in refs

  // ── Pointer handlers ──
  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    rotYRef.current += dx * 0.012;
    rotXRef.current += dy * 0.012;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onTouchStart = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    rotYRef.current += dx * 0.012;
    rotXRef.current += dy * 0.012;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const pct = Math.min(100, Math.round((displayGreen / TOTAL_PTS) * 100));

  return (
    <div
      className="space-y-6 select-none"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Header */}
      <div className="gcs-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wider">
              COMPASS 3D SPHERE POINT CLOUD CALIBRATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Slowly rotate the drone in a figure-8 pattern across all axes to fill the magnetic field sphere.
          </p>
        </div>
        <div className="font-mono text-right">
          <div className="text-[10px] text-slate-400 uppercase">Points Green</div>
          <div className="text-base font-bold text-emerald-400">{displayGreen} / {TOTAL_PTS}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2 gcs-panel p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
          <div className="absolute top-4 left-4 text-xs font-mono flex items-center gap-2 z-10">
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin text-emerald-400' : 'text-cyan-400'}`} />
            {compassState.completed
              ? <span className="text-emerald-400 font-bold">✓ SPHERE 100% COMPLETE!</span>
              : <span className="text-cyan-300">DRAG TO ROTATE DRONE</span>}
          </div>
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            className="cursor-grab active:cursor-grabbing rounded-xl border border-slate-900 shadow-2xl"
          />
        </div>

        {/* Side Panel */}
        <div className="gcs-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between font-mono">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              Calibration Controls
            </h3>

            {/* Auto-Orbit Toggle */}
            <button
              onClick={toggleAuto}
              disabled={compassState.completed}
              className={`w-full py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                compassState.completed
                  ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                  : autoRotate
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-500'
              }`}
            >
              {autoRotate ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRotate ? 'STOP AUTO-ORBIT' : 'START 360° AUTO-ORBIT'}
            </button>

            {/* Quick Calibrate */}
            <button
              onClick={handleQuickCalib}
              disabled={compassState.completed}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                compassState.completed
                  ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-950/60 border-purple-700 text-purple-300 hover:bg-purple-900/60 hover:border-purple-500'
              }`}
            >
              <Zap className="w-4 h-4" />
              QUICK CALIBRATE (SKIP)
            </button>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans space-y-1.5">
              <div className="font-mono font-bold text-purple-300 mb-1">How it works:</div>
              <div>• White dots = unsampled field vectors</div>
              <div>• Green dots = magnetic field captured</div>
              <div>• Rotate in figure-8 for best coverage</div>
              <div>• Keep away from iron / steel objects</div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={compassState.completed ? '#10b981' : '#38bdf8'}
                    strokeWidth="3"
                    strokeDasharray={`${pct}, 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-slate-100">{pct}%</span>
                  <span className="text-[9px] text-slate-500 uppercase">filled</span>
                </div>
              </div>
            </div>

            {compassState.completed && (
              <div className="p-3 bg-emerald-950/70 border-2 border-emerald-500 rounded-xl text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  COMPASS_OFS saved to EEPROM!
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => compassState.completed && addLog('SUCCESS', 'Autopilot Rebooted. New COMPASS_OFS parameters active.')}
            disabled={!compassState.completed}
            className={`w-full py-3 mt-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              compassState.completed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${compassState.completed ? 'animate-spin' : ''}`} />
            {compassState.completed ? 'REBOOT AUTOPILOT NOW' : `FILL SPHERE TO COMPLETE (${pct}%)`}
          </button>
        </div>
      </div>
    </div>
  );
};
