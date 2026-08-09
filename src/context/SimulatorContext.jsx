import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { soundFx } from '../audio/audioSynthesizer';
import confetti from 'canvas-confetti';

const SimulatorContext = createContext(null);

// Monotonic counter so log keys are ALWAYS unique
let _logId = 100;
const nextLogId = () => ++_logId;

export const SimulatorProvider = ({ children }) => {
  // Virtual Bench State
  const [propsInstalled, setPropsInstalled] = useState(true);
  const [usbConnected, setUsbConnected] = useState(false);
  const [lipoConnected, setLipoConnected] = useState(false);
  const [safetySwitchPressed, setSafetySwitchPressed] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // MAVLink / GCS State
  const [comPort, setComPort] = useState('COM3 - Radiolink Crossflight V2');
  const [baudRate, setBaudRate] = useState(115200);
  const [mavlinkConnected, setMavlinkConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('bench');

  // Firmware Flashing State
  const [flashStage, setFlashStage] = useState('IDLE');
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashStatusText, setFlashStatusText] = useState('');
  const [firmwareInstalled, setFirmwareInstalled] = useState(false);

  // Safety Warning Modal State
  const [safetyAlert, setSafetyAlert] = useState(null);

  // Calibration States
  const [accelState, setAccelState] = useState({
    completed: false,
    currentStepIndex: 0,
    completedSteps: [false, false, false, false, false, false],
    offsets: { x: 0, y: 0, z: 0 },
    failMessage: null,
  });

  const [compassState, setCompassState] = useState({
    completed: false,
    progress: 0,
  });

  const [radioState, setRadioState] = useState({
    completed: false,
    joysticks: {
      roll: 1500,
      pitch: 1500,
      throttle: 1100,
      yaw: 1500,
    },
    ch2Reversed: false,
    reverseError: false,
    calibratedLimits: false,
  });

  const [escState, setEscState] = useState({
    completed: false,
    step: 1,
    beepsPlayed: false,
  });

  // System Logs
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), level: 'INFO', text: 'ArduPilot Commissioning Simulator Initialized.' },
    { id: 2, time: new Date().toLocaleTimeString(), level: 'WARN', text: 'PreArm: 3D Accel calibration & Compass calibration needed.' },
  ]);

  const addLog = (level, text) => {
    soundFx.playClick();
    setLogs((prev) => [
      ...prev,
      { id: nextLogId(), time: new Date().toLocaleTimeString(), level, text },
    ]);
  };

  // Toggle Sound Mute
  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundFx.setMuted(next);
  };

  // Physical FC Power State
  const fcPower = usbConnected || lipoConnected;

  // ✅ Derived: ALL Calibrations Complete Gate for SITL
  const allCalibrationsDone = useMemo(() =>
    firmwareInstalled &&
    accelState.completed &&
    compassState.completed &&
    radioState.completed &&
    escState.completed,
    [firmwareInstalled, accelState.completed, compassState.completed, radioState.completed, escState.completed]
  );

  // Trigger Explosive Propeller Safety Warning
  const triggerSafetyViolation = (actionName) => {
    soundFx.playExplosionAlarm();
    setSafetyAlert({
      action: actionName,
      title: '🚨 HIGH-RISK EXPLOSION & PROPELLER HAZARD ALERT!',
      message: `You attempted to ${actionName} while PROPELLERS ARE STILL INSTALLED! In a real drone setup, motor accidental spin or full throttle escalation can cause severe lacerations or explosive propeller disintegration!`,
    });
    addLog('ERROR', `CRITICAL HAZARD: Attempted ${actionName} with propellers installed!`);
  };

  // Bench Toggles
  const toggleProps = () => {
    soundFx.playClick();
    setPropsInstalled((prev) => !prev);
    addLog('INFO', propsInstalled ? 'Propellers removed from motor shafts.' : 'WARNING: Propellers installed on motors.');
  };

  const toggleUsb = () => {
    soundFx.playClick();
    const next = !usbConnected;
    setUsbConnected(next);
    if (!next && flashStage === 'WAITING_BOOTLOADER') {
      addLog('INFO', 'USB Unplugged (Bootloader reset step 1/2).');
    } else if (next && flashStage === 'WAITING_BOOTLOADER') {
      addLog('SUCCESS', 'USB Re-plugged! Bootloader detected. Starting flash sequence...');
      startFlashingExecution();
    } else {
      addLog('INFO', next ? 'Micro-USB Cable Connected to Laptop.' : 'Micro-USB Cable Disconnected.');
    }
  };

  const toggleLipo = () => {
    soundFx.playClick();
    const next = !lipoConnected;
    if (next && propsInstalled && (activeTab === 'esc' || escState.step > 1)) {
      triggerSafetyViolation('CONNECT LIPO BATTERY DURING ESC CALIBRATION');
      return;
    }
    setLipoConnected(next);
    addLog('INFO', next ? 'LiPo 4S Battery Connected (Main Power ON).' : 'LiPo Battery Disconnected.');
    if (activeTab === 'esc') {
      if (next && escState.step === 2) {
        addLog('INFO', 'LiPo Plugged in at MAX throttle. Unplug and replug LiPo to trigger ESC calibration mode.');
        setEscState((prev) => ({ ...prev, step: 3 }));
      } else if (next && escState.step === 3) {
        soundFx.playEscInitBeeps();
        addLog('SUCCESS', 'LiPo Re-plugged! ESC musical beep initialization heard!');
        setEscState((prev) => ({ ...prev, step: 4, beepsPlayed: true }));
      }
    }
  };

  const toggleSafetySwitch = () => {
    soundFx.playClick();
    const next = !safetySwitchPressed;
    setSafetySwitchPressed(next);
    addLog('INFO', next ? 'FC Safety Switch Pressed (ARMING SAFE / READY).' : 'FC Safety Switch Released (DISARMED / LOCK).');
    if (activeTab === 'esc' && escState.step === 4 && next) {
      addLog('SUCCESS', 'Safety switch pressed! Now pull RC Throttle to MINIMUM.');
      setEscState((prev) => ({ ...prev, step: 5 }));
    }
  };

  // MAVLink Connection Toggle
  const toggleMavlinkConnect = () => {
    if (!fcPower) {
      soundFx.playWarningBeep();
      addLog('ERROR', 'Cannot connect MAVLink: Flight Controller is not powered! Plug USB or connect LiPo.');
      return;
    }
    if (flashStage === 'FLASHING') {
      soundFx.playWarningBeep();
      addLog('ERROR', 'Cannot alter connection while firmware flashing is active!');
      return;
    }
    const next = !mavlinkConnected;
    setMavlinkConnected(next);
    if (next) {
      soundFx.playArduPilotBoot();
      addLog('SUCCESS', `MAVLink Connected via ${comPort} @ ${baudRate} baud.`);
    } else {
      soundFx.playClick();
      addLog('INFO', 'MAVLink Disconnected.');
    }
  };

  // Flashing State Machine
  const initiateFlashing = () => {
    if (propsInstalled) { triggerSafetyViolation('FLASH FIRMWARE'); return; }
    if (mavlinkConnected) {
      soundFx.playWarningBeep();
      addLog('WARN', 'ACTIVE CONNECTION LOCK: MAVLink connection must be DISCONNECTED before flashing firmware!');
      setFlashStage('WARN_CONNECTED');
      return;
    }
    setFlashStage('CONFIRM');
  };

  const confirmUpload = () => {
    soundFx.playClick();
    setFlashStage('WAITING_BOOTLOADER');
    addLog('WARN', 'BOOTLOADER TRIGGER: Please reset board by unplugging USB and plugging back in on Virtual Bench.');
  };

  const startFlashingExecution = () => {
    setFlashStage('FLASHING');
    setFlashProgress(0);
    setFlashStatusText('Erasing sectors (0-30%)...');
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      setFlashProgress(current);
      if (current <= 30) setFlashStatusText(`Erasing flash sectors... (${current}%)`);
      else if (current <= 80) setFlashStatusText(`Programming binary blocks... (${current}%)`);
      else if (current < 100) setFlashStatusText(`Verifying checksum... (${current}%)`);
      else {
        clearInterval(interval);
        setFlashStage('COMPLETE');
        setFirmwareInstalled(true);
        soundFx.playArduPilotBoot();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        addLog('SUCCESS', 'Upload Done! ArduCopter V4.5.1 firmware successfully flashed to Radiolink Crossflight V2.');
      }
    }, 100);
  };

  // Accel Calibration Logic
  const completeAccelStep = (isStill) => {
    if (!isStill) {
      soundFx.playWarningBeep();
      setAccelState((prev) => ({
        ...prev,
        failMessage: 'MOVEMENT DETECTED! Drone must remain perfectly STILL for 2 seconds during accelerometer sampling.',
      }));
      addLog('ERROR', 'Accel Calib Failed: Movement detected during sampling!');
      return;
    }
    const current = accelState.currentStepIndex;
    const nextSteps = [...accelState.completedSteps];
    nextSteps[current] = true;
    const nextIndex = current + 1;
    const isAllDone = nextIndex >= 6;
    soundFx.playSuccessTone();
    setAccelState((prev) => ({
      ...prev,
      completedSteps: nextSteps,
      currentStepIndex: isAllDone ? current : nextIndex,
      completed: isAllDone,
      failMessage: null,
      offsets: {
        x: parseFloat(((Math.random() - 0.5) * 0.15).toFixed(3)),
        y: parseFloat(((Math.random() - 0.5) * 0.15).toFixed(3)),
        z: parseFloat((9.81 + (Math.random() - 0.5) * 0.1).toFixed(3)),
      },
    }));
    if (isAllDone) {
      confetti({ particleCount: 100, spread: 80 });
      addLog('SUCCESS', '3D Accelerometer 6-Axis Calibration Complete! Offsets saved to parameter table.');
    } else {
      addLog('INFO', `Accel Position ${current + 1}/6 calibrated successfully.`);
    }
  };

  // Compass Sample Logic
  const sampleCompassPoints = (amount) => {
    setCompassState((prev) => {
      const newProgress = Math.min(100, prev.progress + amount);
      const isDone = newProgress >= 100;
      if (isDone && !prev.completed) {
        soundFx.playSuccessTone();
        setTimeout(() => soundFx.playSuccessTone(), 300);
        setTimeout(() => soundFx.playSuccessTone(), 600);
        confetti({ particleCount: 100, spread: 80 });
        addLog('SUCCESS', 'Compass 3D Sphere Calibration Complete! Please Reboot Autopilot.');
      }
      return { ...prev, progress: newProgress, completed: isDone };
    });
  };

  // Radio Calibration
  const updateJoystick = (axis, value) => {
    setRadioState((prev) => {
      const updated = { ...prev, joysticks: { ...prev.joysticks, [axis]: value } };
      if (axis === 'pitch') {
        const isReversedCorrectly = updated.ch2Reversed ? value > 1500 : value < 1500;
        updated.reverseError = !isReversedCorrectly;
      }
      return updated;
    });
  };

  const togglePitchReversal = () => {
    soundFx.playClick();
    setRadioState((prev) => ({ ...prev, ch2Reversed: !prev.ch2Reversed, reverseError: false }));
    addLog('INFO', 'Channel 2 (Pitch) reversal parameter toggled.');
  };

  const finishRadioCalib = () => {
    soundFx.playSuccessTone();
    setRadioState((prev) => ({ ...prev, completed: true, calibratedLimits: true }));
    confetti({ particleCount: 80, spread: 60 });
    addLog('SUCCESS', 'Radio Control Calibration Complete! PWM ranges [1100us - 1900us] stored.');
  };

  // ESC Calibration
  const setEscThrottleMax = () => {
    soundFx.playClick();
    setRadioState((prev) => ({ ...prev, joysticks: { ...prev.joysticks, throttle: 1900 } }));
    setEscState((prev) => ({ ...prev, step: 2 }));
    addLog('INFO', 'ESC Calib Step 1: Virtual Transmitter Throttle set to MAX (1900us).');
  };

  const setEscThrottleMin = () => {
    if (escState.step !== 5) return;
    soundFx.playEscConfirmBeep();
    setRadioState((prev) => ({ ...prev, joysticks: { ...prev.joysticks, throttle: 1100 } }));
    setEscState((prev) => ({ ...prev, step: 5, completed: true }));
    confetti({ particleCount: 120, spread: 90 });
    addLog('SUCCESS', 'ESC Throttle Calibration Complete! Endpoints stored across all ESCs.');
  };

  const bypassAllCalibrations = () => {
    setFirmwareInstalled(true);
    setFlashStage('COMPLETE');
    setAccelState((prev) => ({
      ...prev,
      completed: true,
      completedSteps: [true, true, true, true, true, true],
      offsets: { x: 0.042, y: -0.031, z: 9.812 },
    }));
    setCompassState({ completed: true, progress: 100 });
    setRadioState((prev) => ({
      ...prev,
      completed: true,
      calibratedLimits: true,
      joysticks: { roll: 1500, pitch: 1500, throttle: 1100, yaw: 1500 },
    }));
    setEscState({ completed: true, step: 5, beepsPlayed: true });
    setUsbConnected(true);
    setMavlinkConnected(true);
    soundFx.playSuccessTone();
    setTimeout(() => soundFx.playSuccessTone(), 250);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
    addLog('SUCCESS', '🚀 DEV BYPASS: All calibration steps completed. SITL Arena unlocked!');
    setTimeout(() => setActiveTab('sitl'), 400);
  };

  // ✅ SECRET DEV CHEAT — Expose to console
  useEffect(() => {
    // Allows typing `window["Hackyboy is Active"]` in console
    Object.defineProperty(window, 'Hackyboy is Active', {
      get: () => {
        bypassAllCalibrations();
        return "🔥 HACKYBOY IS ACTIVE: All calibrations bypassed! Launching SITL...";
      },
      configurable: true
    });

    // Also just a simple function they can call: Hackyboy()
    window.Hackyboy = () => {
      bypassAllCalibrations();
      return "🔥 HACKYBOY IS ACTIVE: All calibrations bypassed! Launching SITL...";
    };

    console.log("%c🤫 Pssst... Dev Mode:", "color: #a855f7; font-weight: bold; font-size: 14px;");
    console.log("%cType %cHackyboy()%c in this console (or %cwindow['Hackyboy is Active']%c) and press Enter to instantly bypass all calibrations!", "color: #94a3b8", "color: #10b981; font-family: monospace; font-size: 14px;", "color: #94a3b8", "color: #10b981; font-family: monospace; font-size: 14px;", "color: #94a3b8");
  }, [/* run once on mount */]);


  return (
    <SimulatorContext.Provider
      value={{
        propsInstalled,
        usbConnected,
        lipoConnected,
        safetySwitchPressed,
        soundMuted,
        comPort,
        baudRate,
        mavlinkConnected,
        activeTab,
        flashStage,
        flashProgress,
        flashStatusText,
        firmwareInstalled,
        safetyAlert,
        accelState,
        compassState,
        radioState,
        escState,
        logs,
        fcPower,
        allCalibrationsDone,
        setComPort,
        setBaudRate,
        setActiveTab,
        setFlashStage,
        setSafetyAlert,
        toggleProps,
        toggleUsb,
        toggleLipo,
        toggleSafetySwitch,
        toggleSound,
        toggleMavlinkConnect,
        initiateFlashing,
        confirmUpload,
        completeAccelStep,
        sampleCompassPoints,
        updateJoystick,
        togglePitchReversal,
        finishRadioCalib,
        setEscThrottleMax,
        setEscThrottleMin,
        triggerSafetyViolation,
        bypassAllCalibrations,
        addLog,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext);
