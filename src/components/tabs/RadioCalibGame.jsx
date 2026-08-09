import React, { useState, useRef, useEffect } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Radio, AlertTriangle, CheckCircle2, ShieldAlert, Sliders, RotateCcw } from 'lucide-react';

export const RadioCalibGame = () => {
  const { radioState, updateJoystick, togglePitchReversal, finishRadioCalib, addLog } = useSimulator();

  // Active joystick drag tracking
  const [activeStick, setActiveStick] = useState(null); // 'left' (Throttle/Yaw), 'right' (Roll/Pitch)
  const leftStickRef = useRef(null);
  const rightStickRef = useRef(null);

  // Handle Joystick drag logic
  const handleStickMove = (e, stickType) => {
    const container = stickType === 'left' ? leftStickRef.current : rightStickRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Calculate normalized -1 to +1 from box center
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    let x = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
    let y = (clientY - rect.top - rect.height / 2) / (rect.height / 2);

    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));

    if (stickType === 'left') {
      // Left stick: X = Yaw (CH4), Y = Throttle (CH3 - inverted y: top is max)
      const yawPwm = Math.round(1500 + x * 400);
      const throttlePwm = Math.round(1500 - y * 400);
      updateJoystick('yaw', yawPwm);
      updateJoystick('throttle', throttlePwm);
    } else if (stickType === 'right') {
      // Right stick: X = Roll (CH1), Y = Pitch (CH2)
      const rollPwm = Math.round(1500 + x * 400);
      const pitchPwm = Math.round(1500 + y * 400);
      updateJoystick('roll', rollPwm);
      updateJoystick('pitch', pitchPwm);
    }
  };

  const handlePointerDown = (e, stickType) => {
    setActiveStick(stickType);
    handleStickMove(e, stickType);
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (activeStick) {
        handleStickMove(e, activeStick);
      }
    };
    const handlePointerUp = () => {
      setActiveStick(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [activeStick]);

  const channels = [
    { id: 'ch1', name: 'CH1: Roll', pwm: radioState.joysticks.roll, rev: false },
    { id: 'ch2', name: 'CH2: Pitch', pwm: radioState.ch2Reversed ? 3000 - radioState.joysticks.pitch : radioState.joysticks.pitch, rev: radioState.ch2Reversed, isPitch: true },
    { id: 'ch3', name: 'CH3: Throttle', pwm: radioState.joysticks.throttle, rev: false },
    { id: 'ch4', name: 'CH4: Yaw', pwm: radioState.joysticks.yaw, rev: false },
    { id: 'ch5', name: 'CH5: Flight Mode', pwm: 1500, rev: false },
    { id: 'ch6', name: 'CH6: Aux Switch', pwm: 1100, rev: false },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="gcs-panel p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wider">
              RADIO CONTROL (RC) TRANSMITTER CALIBRATION
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Drag virtual joysticks to test PWM limits [1100us - 1900us] & verify channel reversal direction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Radio Status:</span>
          <span
            className={`px-3 py-1 rounded text-xs font-mono font-bold ${
              radioState.completed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                : 'bg-purple-950 text-purple-300 border border-purple-500'
            }`}
          >
            {radioState.completed ? 'CALIBRATED & VERIFIED' : 'CALIBRATION IN PROGRESS'}
          </span>
        </div>
      </div>

      {/* Pitch Channel Reversal Check Warning */}
      {radioState.reverseError && (
        <div className="p-4 bg-amber-950/70 border-2 border-amber-500 rounded-xl flex items-center justify-between gap-4 font-mono text-xs text-amber-300 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-amber-200">CHANNEL REVERSAL REQUIRED!</h4>
              <p className="text-[11px] text-slate-300 font-sans">
                Pitch joystick UP is moving Pitch bar UP! In ArduPilot, pushing Pitch stick UP must decrease PWM / move bar DOWN.
              </p>
            </div>
          </div>
          <button
            onClick={togglePitchReversal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0"
          >
            TOGGLE REVERSE CH2
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virtual RC Transmitter Graphic (Left Column) */}
        <div className="gcs-panel p-6 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] relative">
          <div className="text-xs font-mono font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Radio className="w-4 h-4" />
            VIRTUAL RC TRANSMITTER (MODE 2)
          </div>

          {/* Dual Joystick Box */}
          <div className="flex items-center justify-around w-full gap-6">
            {/* Left Joystick: Throttle / Yaw */}
            <div className="flex flex-col items-center">
              <div
                ref={leftStickRef}
                onMouseDown={(e) => handlePointerDown(e, 'left')}
                onTouchStart={(e) => handlePointerDown(e, 'left')}
                className="w-40 h-40 bg-slate-900 border-2 border-slate-700 rounded-2xl relative flex items-center justify-center cursor-crosshair shadow-inner"
              >
                {/* Crosshair guide lines */}
                <div className="absolute w-full h-[1px] bg-slate-800" />
                <div className="absolute h-full w-[1px] bg-slate-800" />

                {/* Joystick Knob */}
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-b from-purple-500 to-purple-800 border-2 border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] absolute pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `translate(${((radioState.joysticks.yaw - 1500) / 400) * 60}px, ${
                      -((radioState.joysticks.throttle - 1500) / 400) * 60
                    }px)`,
                  }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-2 font-bold">
                Left: Throttle / Yaw
              </span>
            </div>

            {/* Right Joystick: Roll / Pitch */}
            <div className="flex flex-col items-center">
              <div
                ref={rightStickRef}
                onMouseDown={(e) => handlePointerDown(e, 'right')}
                onTouchStart={(e) => handlePointerDown(e, 'right')}
                className="w-40 h-40 bg-slate-900 border-2 border-slate-700 rounded-2xl relative flex items-center justify-center cursor-crosshair shadow-inner"
              >
                {/* Crosshair guide lines */}
                <div className="absolute w-full h-[1px] bg-slate-800" />
                <div className="absolute h-full w-[1px] bg-slate-800" />

                {/* Joystick Knob */}
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-800 border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] absolute pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `translate(${((radioState.joysticks.roll - 1500) / 400) * 60}px, ${
                      ((radioState.joysticks.pitch - 1500) / 400) * 60
                    }px)`,
                  }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-2 font-bold">
                Right: Roll / Pitch
              </span>
            </div>
          </div>
        </div>

        {/* GCS Live Channel PWM Monitor Bars (Right Column) */}
        <div className="gcs-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                GCS Radio Channel PWM Monitor
              </h3>
              <button
                onClick={togglePitchReversal}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline font-bold"
              >
                {radioState.ch2Reversed ? 'CH2 Reversed (Normal)' : 'Normal CH2 (Reverse)'}
              </button>
            </div>

            <div className="space-y-3">
              {channels.map((ch) => {
                const percent = Math.max(0, Math.min(100, ((ch.pwm - 1100) / 800) * 100));
                return (
                  <div key={ch.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-bold">{ch.name}</span>
                      <span className="text-emerald-400 font-bold">{ch.pwm} µs</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className="bg-emerald-500 h-full rounded transition-all duration-100"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={finishRadioCalib}
            className="w-full py-3 mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            COMPLETE RADIO CALIBRATION (SAVE LIMITS)
          </button>
        </div>
      </div>
    </div>
  );
};
