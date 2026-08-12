import React, { useRef, useEffect } from 'react';
import { useSimulator } from '../../context/SimulatorContext';
import { Terminal, ShieldAlert, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const MavlinkConsole = () => {
  const { logs } = useSimulator();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
      case 'WARN':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'INFO':
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  const getTextColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-300 bg-red-950/30 border-l-2 border-red-500';
      case 'WARN':
        return 'text-amber-300 bg-amber-950/20 border-l-2 border-amber-500';
      case 'SUCCESS':
        return 'text-emerald-300 bg-emerald-950/20 border-l-2 border-emerald-500';
      case 'INFO':
      default:
        return 'text-slate-300 border-l-2 border-slate-700';
    }
  };

  return (
    <div className="gcs-panel rounded-lg overflow-hidden border border-slate-800 shadow-xl font-mono text-xs">
      <div className="gcs-header px-4 py-2 flex items-center justify-between border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 tracking-wider">MAVLink<span className="hidden sm:inline"> Telemetry &amp; Log</span> Console</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">915MHz Telemetry Active</span>
          <span className="sm:hidden">LIVE</span>
        </div>
      </div>
      <div className="p-3 max-h-36 overflow-y-auto space-y-1.5 bg-slate-950/80">
        {logs.map((log) => (
          <div key={log.id} className={`px-2.5 py-1 rounded flex items-start gap-2 ${getTextColor(log.level)}`}>
            {getIcon(log.level)}
            <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>
            <span className="leading-relaxed break-all min-w-0">{log.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
