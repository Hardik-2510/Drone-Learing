import React, { useState } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { soundFx } from '../../audio/audioSynthesizer';
import {
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  Zap,
  Terminal
} from 'lucide-react';

export const QuizArenaTab = () => {
  const { quizScore, setQuizScore, quizAnsweredCount, setQuizAnsweredCount } = useSimulator();

  const quizQuestions = [
    {
      id: 1,
      alert: 'PreArm: 3D Accel calibration needed',
      code: 'PREARM_ACCEL_NEEDED',
      options: [
        {
          id: 'A',
          text: 'Cause: New firmware installed or parameter table reset. Fix: Perform 6-Axis Accelerometer Calibration.',
          correct: true,
          explanation: 'When fresh ArduPilot firmware is loaded, factory accelerometer offsets are cleared. A 6-axis position calibration is mandatory before arming.',
        },
        {
          id: 'B',
          text: 'Cause: Propellers are loose on motor shafts. Fix: Tighten prop nuts with M5 wrench.',
          correct: false,
          explanation: 'Loose props affect thrust dynamics but do not trigger initial accelerometer pre-arm errors.',
        },
        {
          id: 'C',
          text: 'Cause: GPS lock satellite count is low. Fix: Wait 5 minutes for HDOP < 1.4.',
          correct: false,
          explanation: 'GPS satellite lock affects EKF navigation pre-arm checks, not 3D Accel calibration.',
        },
      ],
    },
    {
      id: 2,
      alert: 'PreArm: Accels inconsistent',
      code: 'PREARM_ACCEL_INCONSISTENT',
      options: [
        {
          id: 'A',
          text: 'Cause: Battery voltage is below 11.1V. Fix: Recharge LiPo battery.',
          correct: false,
          explanation: 'Low battery triggers battery failsafe, not IMU accelerometer divergence.',
        },
        {
          id: 'B',
          text: 'Cause: Accel divergence > 0.75 m/s² due to temperature drift or movement during boot. Fix: Allow FC to warm up, recalibrate on still surface.',
          correct: true,
          explanation: 'ArduPilot compares dual IMUs. Temperature gradients or bench vibration causes sensor divergence > 0.75 m/s².',
        },
        {
          id: 'C',
          text: 'Cause: Micro-USB cable is unplugged. Fix: Re-plug USB cable.',
          correct: false,
          explanation: 'USB connection state has no bearing on internal accelerometer consistency.',
        },
      ],
    },
    {
      id: 3,
      alert: 'PreArm: Check Mag Field',
      code: 'PREARM_MAG_FIELD',
      options: [
        {
          id: 'A',
          text: 'Cause: Magnetic field exceeds World Magnetic Model (WMM) bounds due to rebar/concrete. Fix: Move outdoors away from steel structures.',
          correct: true,
          explanation: 'Steel rebar inside indoor floors distorts earth magnetic vectors, exceeding 350-600 mGauss expected limits.',
        },
        {
          id: 'B',
          text: 'Cause: RC Transmitter is powered off. Fix: Turn on RC Transmitter.',
          correct: false,
          explanation: 'Radio failsafe triggers Radio pre-arm check, not magnetic field magnitude error.',
        },
        {
          id: 'C',
          text: 'Cause: ESC throttle range is uncalibrated. Fix: Perform ESC throttle calibration.',
          correct: false,
          explanation: 'ESC calibration sets motor endpoints, unrelated to magnetometer field intensity.',
        },
      ],
    },
    {
      id: 4,
      alert: 'PreArm: Compasses inconsistent',
      code: 'PREARM_COMPASS_INCONSISTENT',
      options: [
        {
          id: 'A',
          text: 'Cause: Internal and external compass alignment divergence. Fix: Check COMPASS_ORIENT parameter.',
          correct: true,
          explanation: 'If the external GPS/compass puck orientation (e.g. ROTATION_YAW_270) does not match parameter settings, internal and external compass vectors conflict.',
        },
        {
          id: 'B',
          text: 'Cause: Telemetry baud rate is wrong. Fix: Change baud rate to 57600.',
          correct: false,
          explanation: 'Baud rate affects serial telemetry baud link speed, not compass vector alignment.',
        },
        {
          id: 'C',
          text: 'Cause: Flight controller SD card missing. Fix: Insert 32GB MicroSD card.',
          correct: false,
          explanation: 'Missing SD card disables data logging, not compass alignment.',
        },
      ],
    },
    {
      id: 5,
      alert: 'PreArm: Board (Xv) out of range',
      code: 'PREARM_BOARD_VOLTAGE',
      options: [
        {
          id: 'A',
          text: 'Cause: Input bus voltage outside safe 4.3V - 5.8V window. Fix: Check BEC regulator & power module with multimeter.',
          correct: true,
          explanation: 'ArduPilot monitors Vcc power rail. Voltage drops below 4.3V or spikes above 5.8V can cause in-flight autopilot resets.',
        },
        {
          id: 'B',
          text: 'Cause: Wind speed is above 20 knots. Fix: Wait for calm weather.',
          correct: false,
          explanation: 'Wind speed affects flight stability, but has no relation to FC bus voltage rails.',
        },
        {
          id: 'C',
          text: 'Cause: Propellers installed backwards. Fix: Swap CW and CCW props.',
          correct: false,
          explanation: 'Propeller orientation affects thrust direction, not board logic voltage.',
        },
      ],
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQ = quizQuestions[currentIdx];

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt.correct) {
      soundFx.playSuccessTone();
      setQuizScore((prev) => prev + 20);
    } else {
      soundFx.playWarningBeep();
    }
    setQuizAnsweredCount((prev) => prev + 1);
  };

  const handleNext = () => {
    soundFx.playClick();
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    soundFx.playClick();
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizScore(0);
    setQuizAnsweredCount(0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="gcs-panel p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-wider">
              <span className="hidden sm:inline">TROUBLESHOOTING </span>QUIZ ARENA<span className="hidden sm:inline"> (PRE-ARM FAULTS)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Diagnose real GCS MAVLink pre-arm error messages and identify root causes & field fixes.
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Score:</span>
            <span className="text-sm font-bold text-purple-300">{quizScore} / 100 PTS</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="gcs-panel p-4 sm:p-6 rounded-xl border border-slate-800 bg-slate-950/90 font-mono max-w-3xl mx-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <span className="text-xs text-purple-400 font-bold">
            QUESTION {currentIdx + 1} OF {quizQuestions.length}
          </span>
          <span className="text-xs text-slate-500">Fault Code: {currentQ.code}</span>
        </div>

        {/* GCS Alert Box */}
        <div className="p-4 bg-red-950/50 border-2 border-red-500/80 rounded-xl mb-6 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase text-red-400 font-bold tracking-wider">
              Simulated MAVLink Pre-Arm Error Message:
            </div>
            <div className="text-base font-bold text-red-200 mt-0.5">"{currentQ.alert}"</div>
          </div>
        </div>

        {/* Question Prompt */}
        <h3 className="text-sm font-bold text-slate-200 font-sans mb-4">
          Select the correct root cause and corrective field action:
        </h3>

        {/* Option Cards */}
        <div className="space-y-3 mb-6 font-sans">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOption?.id === opt.id;
            let cardStyle = 'border-slate-800 bg-slate-900/80 hover:border-purple-500/60 text-slate-200';

            if (isAnswered) {
              if (opt.correct) {
                cardStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
              } else if (isSelected && !opt.correct) {
                cardStyle = 'border-red-500 bg-red-950/40 text-red-200';
              } else {
                cardStyle = 'border-slate-800/40 bg-slate-950/40 text-slate-500 opacity-50';
              }
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${cardStyle}`}
              >
                <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {opt.id}
                </span>
                <div className="flex-1 text-xs leading-relaxed">
                  <p className="font-medium">{opt.text}</p>

                  {isAnswered && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                      <span className="font-bold text-purple-300">Explanation: </span>
                      {opt.explanation}
                    </div>
                  )}
                </div>

                {isAnswered && opt.correct && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isAnswered && isSelected && !opt.correct && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Footer Next Button */}
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Quiz
          </button>

          {currentIdx < quizQuestions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                isAnswered
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg"
            >
              Complete Quiz! Score: {quizScore}/100
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
