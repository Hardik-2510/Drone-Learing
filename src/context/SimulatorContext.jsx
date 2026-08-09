import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundFx } from '../audio/audioSynthesizer';
import confetti from 'canvas-confetti';

const SimulatorContext = createContext(null);

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
  const [activeTab, setActiveTab] = useState('bench'); // bench, flashing, accel, compass, radio, esc, quiz

  // Firmware Flashing State
  const [flashStage, setFlashStage] = useState('IDLE'); // IDLE, CONFIRM, WAITING_BOOTLOADER, FLASHING, COMPLETE
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashStatusText, setFlashStatusText] = useState('');
  const [firmwareInstalled, setFirmwareInstalled] = useState(false);

  // Safety Warning Modal State
  const [safetyAlert, setSafetyAlert] = useState(null);

  // Calibration States
  const [accelState, setAccelState] = useState({
    completed: false,
    currentStepIndex: 0, // 0: Level, 1: Left, 2: Right, 3: Nose Down, 4: Nose Up, 5: Back
    completedSteps: [false, false, false, false, false, false],
    offsets: { x: 0, y: 0, z: 0 },
    sampling: false,
    samplingProgress: 0,
    failMessage: null,
  });

  const [compassState, setCompassState] = useState({
    completed: false,
    progress: 0,
    points: Array.from({ length: 140 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2,
      sampled: false,
    })),
  });

  const [radioState, setRadioState] = useState({
    completed: false,
    joysticks: {
      roll: 1500,     // CH1 (1100 - 1900)
      pitch: 1500,    // CH2 (1100 - 1900)
      throttle: 1100, // CH3 (1100 - 1900)
      yaw: 1500,      // CH4 (1100 - 1900)
    },
    ch2Reversed: false, // Pitch joystick check
    reverseError: false,
    calibratedLimits: false,
  });

  const [escState, setEscState] = useState({
    completed: false,
    step: 1, // 1: Throttle MAX, 2: Connect LiPo, 3: Re-plug LiPo, 4: Safety Switch, 5: Throttle MIN
    beepsPlayed: false,
  });

  // Troubleshooting Quiz Score State
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);

  // System Logs
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), level: 'INFO', text: 'ArduPilot Commissioning Simulator Initialized.' },
    { id: 2, time: new Date().toLocaleTimeString(), level: 'WARN', text: 'PreArm: 3D Accel calibration & Compass calibration needed.' },
  ]);

  const addLog = (level, text) => {
    soundFx.playClick();
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString(), level, text },
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

  // Bench Toggles with Safety Checks
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

    // Safety check: ESC Calibration or motor test with props on!
    if (next && propsInstalled && (activeTab === 'esc' || escState.step > 1)) {
      triggerSafetyViolation('CONNECT LIPO BATTERY DURING ESC CALIBRATION');
      return;
    }

    setLipoConnected(next);
    addLog('INFO', next ? 'LiPo 4S Battery Connected (Main Power ON).' : 'LiPo Battery Disconnected.');

    // ESC Step 2 & 3 handling
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
    if (propsInstalled) {
      triggerSafetyViolation('FLASH FIRMWARE');
      return;
    }

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

      if (current <= 30) {
        setFlashStatusText(`Erasing flash sectors... (${current}%)`);
      } else if (current <= 80) {
        setFlashStatusText(`Programming binary blocks... (${current}%)`);
      } else if (current < 100) {
        setFlashStatusText(`Verifying checksum... (${current}%)`);
      } else {
        clearInterval(interval);
        setFlashStage('COMPLETE');
        setFirmwareInstalled(true);
        soundFx.playArduPilotBoot();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        addLog('SUCCESS', 'Upload Done! ArduCopter V4.5.1 firmware successfully flashed to Radiolink Crossflight V2.');
      }
    }, 100);
  };

  // Accel Calibration Logic (6-position + stillness check)
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
  const sampleCompassPoints = (pointsCount) => {
    setCompassState((prev) => {
      const newProgress = Math.min(100, prev.progress + pointsCount);
      const isDone = newProgress >= 100;
      if (isDone && !prev.completed) {
        soundFx.playSuccessTone();
        confetti({ particleCount: 100, spread: 80 });
        addLog('SUCCESS', 'Compass 3D Sphere Calibration Complete! Please Reboot Autopilot.');
      }
      return {
        ...prev,
        progress: newProgress,
        completed: isDone,
      };
    });
  };

  // Radio Calibration Joystick Movement & Reversal Check
  const updateJoystick = (axis, value) => {
    setRadioState((prev) => {
      const updated = {
        ...prev,
        joysticks: { ...prev.joysticks, [axis]: value },
      };

      // Pitch Reversal Check: Pitch UP (1900) should move pitch channel DOWN (1100).
      if (axis === 'pitch') {
        const isReversedCorrectly = updated.ch2Reversed ? value > 1500 : value < 1500;
        updated.reverseError = !isReversedCorrectly;
      }
      return updated;
    });
  };

  const togglePitchReversal = () => {
    soundFx.playClick();
    setRadioState((prev) => ({
      ...prev,
      ch2Reversed: !prev.ch2Reversed,
      reverseError: false,
    }));
    addLog('INFO', 'Channel 2 (Pitch) reversal parameter toggled.');
  };

  const finishRadioCalib = () => {
    soundFx.playSuccessTone();
    setRadioState((prev) => ({ ...prev, completed: true, calibratedLimits: true }));
    confetti({ particleCount: 80, spread: 60 });
    addLog('SUCCESS', 'Radio Control Calibration Complete! PWM ranges [1100us - 1900us] stored.');
  };

  // ESC Calibration Actions
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
        quizScore,
        quizAnsweredCount,
        logs,
        fcPower,
        setComPort,
        setBaudRate,
        setActiveTab,
        setFlashStage,
        setSafetyAlert,
        setQuizScore,
        setQuizAnsweredCount,
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
        addLog,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext);
