import React from 'react';
import { SimulatorProvider, useSimulator } from './context/SimulatorContext';
import { Navbar } from './components/Navbar';
import { VirtualBench } from './components/VirtualBench';
import { GcsFlashingTab } from './components/tabs/GcsFlashingTab';
import { AccelCalibGame } from './components/tabs/AccelCalibGame';
import { CompassCalibGame } from './components/tabs/CompassCalibGame';
import { RadioCalibGame } from './components/tabs/RadioCalibGame';
import { EscCalibGame } from './components/tabs/EscCalibGame';

import { SitlArenaTab } from './components/tabs/SitlArenaTab';
import { MavlinkConsole } from './components/common/MavlinkConsole';
import { SafetyModal } from './components/SafetyModal';


const MainContent = () => {
  const { activeTab } = useSimulator();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bench':
        return <VirtualBench />;
      case 'flashing':
        return <GcsFlashingTab />;
      case 'accel':
        return <AccelCalibGame />;
      case 'compass':
        return <CompassCalibGame />;
      case 'radio':
        return <RadioCalibGame />;
      case 'esc':
        return <EscCalibGame />;

      case 'sitl':
        return <SitlArenaTab />;
      default:
        return <VirtualBench />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Area */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-6">
        {renderTabContent()}

        {/* Global MAVLink Telemetry Console */}
        <MavlinkConsole />
      </main>

      {/* Explosive Safety Warning Modal */}
      <SafetyModal />

      {/* Footer */}
      <footer className="gcs-header py-3 sm:py-4 border-t border-slate-800/80 text-center font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">ArduPilot Commissioning Simulator v2.4 • Mission Planner Interactive GCS</span>
            <span className="sm:hidden">ArduPilot GCS Simulator v2.4</span>
          </div>
          <div className="hidden sm:block">Target Hardware: Radiolink Crossflight V2 Autopilot</div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SimulatorProvider>
      <MainContent />
    </SimulatorProvider>
  );
}
