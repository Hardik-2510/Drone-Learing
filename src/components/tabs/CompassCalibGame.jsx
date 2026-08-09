import React, { useState, useRef, useEffect } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Compass, CheckCircle2, RotateCw, Sparkles, RefreshCw } from 'lucide-react';

export const CompassCalibGame = () => {
  const { compassState, sampleCompassPoints, addLog } = useSimulator();
  const [rotation, setRotation] = useState({ x: 20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Generate 120 points on a 3D sphere surface using Fibonacci sphere algorithm
  const [spherePoints, setSpherePoints] = useState(() => {
    const points = [];
    const numPoints = 120;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      points.push({ id: i, x, y, z, green: false });
    }
    return points;
  });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || compassState.completed) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const newX = rotation.x + dy * 0.5;
    const newY = rotation.y + dx * 0.5;

    setRotation({ x: newX, y: newY });
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Turn nearby white points to green based on angle coverage
    let newlyGreened = 0;
    setSpherePoints((prev) =>
      prev.map((pt) => {
        if (pt.green) return pt;
        // Project point with rotation
        const radX = (newX * Math.PI) / 180;
        const radY = (newY * Math.PI) / 180;
        const projZ = pt.x * Math.sin(radY) + pt.z * Math.cos(radY);

        if (projZ > 0.65) {
          newlyGreened++;
          return { ...pt, green: true };
        }
        return pt;
      })
    );

    if (newlyGreened > 0) {
      sampleCompassPoints(newlyGreened * 0.85);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6 select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="gcs-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wider">
              COMPASS 3D SPHERE ROTATION CALIBRATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Click & drag to rotate the drone in a 360-degree orbit to sample magnetic field points across all axes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Coverage</div>
            <div className="text-base font-bold text-cyan-400">{Math.round(compassState.progress)}%</div>
          </div>
        </div>
      </div>

      {/* Main 3D Sphere Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className={`lg:col-span-2 gcs-panel p-6 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden cursor-grab active:cursor-grabbing ${
            compassState.completed ? 'border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : ''
          }`}
        >
          {/* Top Instruction */}
          <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400 flex items-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin" />
            {compassState.completed ? (
              <span className="text-emerald-400 font-bold">COMPASS SPHERE COMPLETE!</span>
            ) : (
              <span>DRAG MOUSE TO ORBIT DRONE & TURN WHITE POINTS GREEN</span>
            )}
          </div>

          {/* 3D Sphere Points Scatter Graphic */}
          <div
            className="w-72 h-72 relative flex items-center justify-center transition-transform duration-75"
            style={{
              transformStyle: 'preserve-3d',
              transform: `perspective(600px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            {/* Center Drone Model */}
            <div className="w-24 h-24 bg-slate-900 border-2 border-cyan-400 rounded-xl flex items-center justify-center shadow-2xl z-10">
              <Compass className={`w-10 h-10 ${compassState.completed ? 'text-emerald-400 animate-spin' : 'text-cyan-400'}`} />
            </div>

            {/* Render 120 scatter points on 3D sphere surface */}
            {spherePoints.map((pt) => {
              const radius = 130;
              const px = pt.x * radius;
              const py = pt.y * radius;
              const pz = pt.z * radius;

              return (
                <div
                  key={pt.id}
                  className={`absolute w-3 h-3 rounded-full transition-all duration-300 shadow-md ${
                    pt.green
                      ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] scale-125'
                      : 'bg-slate-500/60 border border-slate-400/40'
                  }`}
                  style={{
                    transform: `translate3d(${px}px, ${py}px, ${pz}px)`,
                  }}
                />
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mt-6 px-4">
            <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
              <span>Points Sampled: {spherePoints.filter((p) => p.green).length} / 120</span>
              <span className="font-bold text-cyan-400">{Math.round(compassState.progress)}%</span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${compassState.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Side Panel Guidance & Autopilot Reboot Banner */}
        <div className="gcs-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between font-mono">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Compass Calibration Rules
            </h3>

            <div className="space-y-3 text-xs text-slate-300 font-sans">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-mono font-bold text-cyan-300 mb-1">1. Full 360° Sphere Orbit</div>
                <p>Rotate the drone along pitch, roll, and yaw axes to cover all white scatter nodes.</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-mono font-bold text-cyan-300 mb-1">2. Environmental Interference</div>
                <p>Ensure calibration is performed outdoors away from reinforced concrete (rebar) & magnetic metals.</p>
              </div>

              {compassState.completed && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs space-y-2 animate-bounce">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    CALIBRATION SUCCESSFUL!
                  </div>
                  <p className="font-sans text-slate-200">
                    Magnetic offsets computed & saved. <span className="font-bold text-emerald-300">Reboot Autopilot</span> to apply new COMPASS_OFS parameters.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (compassState.completed) {
                addLog('SUCCESS', 'Autopilot Rebooted. Compass parameters active.');
              }
            }}
            disabled={!compassState.completed}
            className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all font-mono ${
              compassState.completed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${compassState.completed ? 'animate-spin' : ''}`} />
            {compassState.completed ? 'REBOOT AUTOPILOT NOW' : 'WAITING FOR 100% SPHERE...'}
          </button>
        </div>
      </div>
    </div>
  );
};
