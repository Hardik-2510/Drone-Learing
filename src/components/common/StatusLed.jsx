import React from 'react';

export const StatusLed = ({ color = 'red', state = 'solid', label = '' }) => {
  const getColorClass = () => {
    switch (color) {
      case 'red':
        return 'bg-red-500 shadow-[0_0_12px_#ef4444]';
      case 'blue':
        return 'bg-blue-500 shadow-[0_0_12px_#3b82f6]';
      case 'yellow':
        return 'bg-yellow-400 shadow-[0_0_12px_#facc15]';
      case 'green':
        return 'bg-emerald-500 shadow-[0_0_12px_#10b981]';
      case 'off':
      default:
        return 'bg-slate-700 shadow-none opacity-40';
    }
  };

  const getAnimationClass = () => {
    if (state === 'fast') return 'animate-led-fast';
    if (state === 'slow') return 'animate-led-slow';
    return '';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-3.5 h-3.5 rounded-full ${getColorClass()} ${getAnimationClass()} transition-all duration-200`} />
      {label && <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{label}</span>}
    </div>
  );
};
