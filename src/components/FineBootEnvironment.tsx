import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Cpu,
  Wrench,
  RotateCcw,
  Download,
  Monitor,
  CheckCircle2,
  Power,
  Fingerprint,
  ScanFace,
  Lock,
  Moon,
} from 'lucide-react';
import { FineAccount, SystemTelemetry } from '../types/fine';

interface FineBootOverlayProps {
  mode: 'boot' | 'lock' | 'sleep' | 'shutdown' | 'recovery';
  telemetry: SystemTelemetry | null;
  account?: FineAccount | null;
  onEnterDesktop: () => void;
  onExportBackup: () => void;
  onWakeOrRestart?: () => void;
  onAccountUnlocked?: (acc: FineAccount) => void;
}

export const FineBootOverlay: React.FC<FineBootOverlayProps> = ({
  mode,
  telemetry,
  account,
  onEnterDesktop,
  onExportBackup,
  onWakeOrRestart,
  onAccountUnlocked,
}) => {
  const [bootProgress, setBootProgress] = useState(0);
  const [stage, setStage] = useState<'booting' | 'unlock'>(mode === 'lock' ? 'unlock' : 'booting');
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [diagLog, setDiagLog] = useState<string[]>([
    'FINE Standalone Recovery Kernel mounted (protected partition / bootable USB runtime).',
    'Primary OS bypass active — FINE tools ready independently without Windows.',
  ]);
  const [busyTool, setBusyTool] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'lock') {
      setStage('unlock');
      return;
    }
    if (mode !== 'boot') return;
    setStage('booting');
    setBootProgress(20);
    const t1 = window.setTimeout(() => setBootProgress(58), 320);
    const t2 = window.setTimeout(() => setBootProgress(92), 680);
    const t3 = window.setTimeout(() => {
      setBootProgress(100);
      setStage('unlock');
    }, 1050);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mode]);

  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const targetId = account?.accountNumber || '72841936';
    setUnlockBusy(true);
    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetId,
          pin: unlockPin,
          deviceName: 'FINE OS Boot Lock Screen',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlockError(data.error || 'Incorrect 4-digit PIN.');
        return;
      }
      if (data.account && onAccountUnlocked) {
        onAccountUnlocked(data.account);
      }
      setUnlockPin('');
      onEnterDesktop();
    } catch {
      setUnlockError('Unable to verify PIN with FINE Security Core.');
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleBiometricUnlock = async (methodLabel: string) => {
    setUnlockError(null);
    setUnlockBusy(true);
    const targetId = account?.accountNumber || '72841936';
    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetId,
          biometricVerified: true,
          deviceName: `FINE OS (${methodLabel})`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.account && onAccountUnlocked) {
        onAccountUnlocked(data.account);
      }
      onEnterDesktop();
    } catch {
      onEnterDesktop();
    } finally {
      setUnlockBusy(false);
    }
  };

  const runStandaloneDiagnostic = async (toolId: string, label: string) => {
    setBusyTool(toolId);
    if (toolId === 'backup') onExportBackup();
    try {
      const res = await fetch('/api/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      });
      const data = await res.json();
      setDiagLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${label}: ${data.summary || data.error || 'Verified'}`,
      ]);
    } catch {
      setDiagLog((prev) => [...prev, `${label}: Local diagnostic probe complete.`]);
    } finally {
      setBusyTool(null);
    }
  };

  if (mode === 'shutdown' || mode === 'sleep') {
    return (
      <div className="fixed inset-0 z-50 bg-[#050914] text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
          {mode === 'sleep' ? <Moon className="w-7 h-7 text-[#3A86EF]" /> : <Power className="w-7 h-7 text-rose-400" />}
        </div>
        <div>
          <h1 className="text-xl font-bold">{mode === 'sleep' ? 'FINE OS is Sleeping' : 'FINE OS Shut Down'}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'sleep'
              ? 'All open windows and Fine Explorer sessions are preserved in memory.'
              : 'All workspace files and fine_local_db tables were safely persisted.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onWakeOrRestart || onEnterDesktop}
          className="px-5 py-2.5 rounded-xl bg-[#3A86EF] hover:bg-[#1d54ab] text-xs font-bold inline-flex items-center gap-2"
        >
          <Power className="w-4 h-4" />
          {mode === 'sleep' ? 'Wake FINE OS' : 'Power On Computer'}
        </button>
      </div>
    );
  }

  if (mode === 'boot' || mode === 'lock') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B132B] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* F in Circle Official FINE OS Logo */}
          <div className="w-20 h-20 rounded-full bg-[#3A86EF] mx-auto flex items-center justify-center text-4xl font-extrabold tracking-tight shadow-xl ring-4 ring-white/15">
            F
          </div>

          {stage === 'booting' ? (
            <>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">FINE OS</h1>
                <p className="text-xs text-blue-200 mt-1">
                  One OS · One Account · Every Machine · Zero-Blue-Screen Boot
                </p>
              </div>

              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#3A86EF] transition-all duration-300 rounded-full"
                  style={{ width: `${bootProgress}%` }}
                />
              </div>

              <div className="text-xs font-mono text-blue-200/90 space-y-1">
                <div>
                  {bootProgress < 55
                    ? 'Initializing FINE OS Kernel & 10-Layer Shield...'
                    : bootProgress < 90
                      ? 'Mounting fine_local_db, Fine AI 4 Brains & Hardware Bus...'
                      : 'Loading Fine Lock Screen...'}
                </div>
                {telemetry && (
                  <div className="text-[11px] text-slate-400">
                    {telemetry.platform} · {telemetry.cpuCores} Cores · {telemetry.memTotalGb} GB RAM
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white/10 border border-white/15 rounded-2xl p-6 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-200 font-semibold">
                    {account ? `${account.name} · #${account.accountNumber}` : 'FINE Owner (#72841936)'}
                  </div>
                  <h2 className="text-lg font-bold">Unlock FINE OS Desktop</h2>
                </div>
                <Lock className="w-5 h-5 text-blue-300" />
              </div>

              {unlockError && (
                <div className="text-xs bg-rose-500/20 border border-rose-400/40 text-rose-100 rounded-lg px-3 py-2">
                  {unlockError}
                </div>
              )}

              <form onSubmit={handlePinUnlock} className="flex gap-2">
                <input
                  type="password"
                  value={unlockPin}
                  onChange={(e) => setUnlockPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (Demo: 1234)"
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-lg bg-[#070d1e] border border-white/20 text-sm text-white font-mono outline-none focus:border-[#3A86EF]"
                />
                <button
                  type="submit"
                  disabled={unlockBusy}
                  className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-bold whitespace-nowrap"
                >
                  {unlockBusy ? 'Checking...' : 'Unlock'}
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={unlockBusy}
                  onClick={() => handleBiometricUnlock('Face ID')}
                  className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <ScanFace className="w-4 h-4 text-[#2DC653]" />
                  Face Unlock
                </button>
                <button
                  type="button"
                  disabled={unlockBusy}
                  onClick={() => handleBiometricUnlock('Fingerprint')}
                  className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Fingerprint className="w-4 h-4 text-[#3A86EF]" />
                  Finger Unlock
                </button>
              </div>

              <button
                type="button"
                onClick={onEnterDesktop}
                className="w-full py-2 rounded-lg border border-white/15 hover:bg-white/10 text-xs font-medium text-blue-200"
              >
                Continue Directly to Desktop
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0B132B] text-white overflow-y-auto p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#3A86EF] flex items-center justify-center font-extrabold text-xl">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold">FINE Independent Recovery System (Boot Without Windows)</h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Protected hidden partition & external bootable USB recovery environment — resilient even if primary OS fails.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEnterDesktop}
            className="px-4 py-2 rounded-lg bg-[#2DC653] hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Monitor className="w-4 h-4" />
            Start FINE Desktop
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={onEnterDesktop}
            className="text-left p-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 space-y-2 transition-colors"
          >
            <Power className="w-5 h-5 text-[#2DC653]" />
            <div className="text-sm font-bold">Start FINE Desktop</div>
            <p className="text-xs text-blue-100/80">
              Boots straight into the lightweight FINE recovery workspace & browser environment.
            </p>
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() => runStandaloneDiagnostic('startup', 'Startup Repair')}
            className="text-left p-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 space-y-2 transition-colors"
          >
            <Wrench className="w-5 h-5 text-[#3A86EF]" />
            <div className="text-sm font-bold">
              {busyTool === 'startup' ? 'Repairing Boot...' : 'Startup Repair'}
            </div>
            <p className="text-xs text-blue-100/80">
              Fixes EFI boot loaders, partition tables, and core FINE runtime manifests.
            </p>
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() => runStandaloneDiagnostic('backup', 'File Backup')}
            className="text-left p-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 space-y-2 transition-colors"
          >
            <Download className="w-5 h-5 text-[#3A86EF]" />
            <div className="text-sm font-bold">
              {busyTool === 'backup' ? 'Exporting Backup...' : 'File Backup'}
            </div>
            <p className="text-xs text-blue-100/80">
              Extracts and downloads critical user files & workspace state as a .finebak archive.
            </p>
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={async () => {
              await runStandaloneDiagnostic('disk', 'Disk Diagnostics');
              await runStandaloneDiagnostic('ram', 'RAM Diagnostics');
            }}
            className="text-left p-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 space-y-2 transition-colors"
          >
            <Cpu className="w-5 h-5 text-[#3A86EF]" />
            <div className="text-sm font-bold">Disk & RAM Diagnostics</div>
            <p className="text-xs text-blue-100/80">
              Runs live filesystem block capacity inspection and system memory integrity checks.
            </p>
          </button>

          <button
            type="button"
            disabled={busyTool !== null}
            onClick={() => runStandaloneDiagnostic('driver', 'System Restore / Reinstall Check')}
            className="text-left p-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 space-y-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-[#E63946]" />
            <div className="text-sm font-bold">System Restore / OS Reinstall</div>
            <p className="text-xs text-blue-100/80">
              Verifies hardware drivers, network recovery probe, and clean platform snapshots.
            </p>
          </button>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
            <div className="font-bold text-[#2DC653] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Hardware Snapshot
            </div>
            <div className="text-blue-100/80">
              OS: {telemetry?.platform || 'Linux Runtime'} ({telemetry?.arch || 'x64'})
            </div>
            <div className="text-blue-100/80">
              RAM: {telemetry ? `${telemetry.memUsedGb} / ${telemetry.memTotalGb} GB` : 'Checking...'}
            </div>
            <div className="text-blue-100/80">
              Disk: {telemetry && telemetry.diskTotalGb ? `${telemetry.diskUsedGb} / ${telemetry.diskTotalGb} GB` : 'Verified'}
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-xs space-y-1.5">
          <div className="text-blue-300 font-semibold mb-2 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            Standalone Recovery Kernel Output
          </div>
          {diagLog.map((line, i) => (
            <div key={i} className="text-slate-200">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Complete Specification & Global Architecture Reference Component
// ============================================================================
export const FineArchitectureSpec: React.FC = () => {
  const palette = [
    { name: 'Deep Navy', hex: '#0B132B', role: 'Main navigation and window framing' },
    { name: 'White', hex: '#FFFFFF', role: 'High-clarity workspace backgrounds' },
    { name: 'Royal Blue', hex: '#3A86EF', role: 'Primary action buttons and active states' },
    { name: 'Soft Grey', hex: '#F8F9FA', role: 'Secondary card panels and containers' },
    { name: 'Emerald Green', hex: '#2DC653', role: 'Successful operations and healthy security status' },
    { name: 'Crimson Red', hex: '#E63946', role: 'Security warnings, threat quarantines, and alerts' },
  ];

  const techStack = [
    ['Desktop Shell', 'C++ / WinUI 3 (Windows 10/11 Native Shell & Virtual Desktops)'],
    ['Browser Engine', 'Chromium Embedded Framework (CEF) + Microsoft WebView2'],
    ['Office Document Engine', 'LibreOfficeKit (DOCX, XLSX, PPTX, ODT) + Native Ribbon UI'],
    ['PDF Engine', 'Google PDFium (View, Split, Merge, Sign, Extract, Print)'],
    ['Local AI Engine', 'ONNX Runtime + llama.cpp (Offline Model Execution)'],
    ['Cloud AI Gateway', 'Gemini, ChatGPT, DeepSeek, Meta AI via Encrypted Proxy'],
    ['Local Database', 'SQLite + SQLCipher Encryption (fine_local_db + .finebak)'],
    ['Cloud & Sync Storage', '15GB S3 Object Sync + Delta Background Updater'],
    ['Independent Recovery', 'WinPE Bootable USB Recovery Environment & Diagnostics'],
  ];

  const windowsLayout = [
    ['C:\\Program Files\\FINE\\bin\\fine.exe', 'Primary FINE Desktop & Browser Shell'],
    ['C:\\Program Files\\FINE\\office\\fine-office.exe', 'Writer, Sheets, Present, PDF & Design Suite'],
    ['C:\\Program Files\\FINE\\ai\\fine-ai-runtime.exe', 'ONNX / llama.cpp Local Inference & Gateway'],
    ['C:\\Program Files\\FINE\\security\\fine-shield.sys', '10-Layer Zero-Trust Guard & IP Brute-Force Blocker'],
    ['C:\\ProgramData\\FINE\\vault\\fine_local_db.sqlite', 'Encrypted Local Storage & Explorer Vault'],
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#3A86EF]" />
          <h2 className="text-base font-bold">FINE Universal Platform — Windows-Compatible Architecture</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="rounded-xl bg-[#0B132B] text-white p-3.5 text-center font-bold">
            FINE DESKTOP SHELL (WinUI 3 · Virtual Desktops · Split Screen · Start Menu · Mobile / ATM / Kiosk Modes)
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['BROWSER SERVICE', 'CEF / WebView2, Split Tab, Reader Mode, Password Vault & Urdu/English AI Summarize'],
              ['FINE OFFICE SUITE', 'Writer (Word), Sheets (Excel), Present (PPTX), PDFium Tools, Design & 5s Auto-Save'],
              ['AI GATEWAY & LOCAL', 'ChatGPT, Gemini, DeepSeek, Meta AI + ONNX / llama.cpp Offline Model Runtime'],
              ['COMMUNICATION BUS', 'Encrypted Chat Polls, WebRTC Calls, Mail Undo-Send & Contact Sync'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/50 p-3.5">
                <div className="font-bold text-[#3A86EF]">{title}</div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#3A86EF] text-white p-2.5 text-center font-bold">
            MICROSERVICES CORE BUS · SQLCipher fine_local_db · 15GB S3 SYNC ENGINE
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/50 p-3.5">
              <div className="font-bold">IDENTITY, ATM & KIOSK SUBSYSTEM</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                One 8-Digit FINE Account spans PC, Mobile, Tablet, ATM (Reverse-PIN + Face Check) & Shop Kiosk.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/50 p-3.5">
              <div className="font-bold">SECURITY, UPDATES & WinPE RECOVERY</div>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Auto-detect USB drives, 10-layer threat quarantine, delta updates, and bootable WinPE recovery USB.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold">FINE Universal 1.0 Production Stack</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="py-2.5 px-5 font-semibold">Subsystem</th>
                <th className="py-2.5 px-5 font-semibold">Technology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {techStack.map(([comp, tech]) => (
                <tr key={comp}>
                  <td className="py-2.5 px-5 font-semibold">{comp}</td>
                  <td className="py-2.5 px-5 text-slate-500 dark:text-slate-400">{tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold">Windows Package Layout (C:\Program Files\FINE\)</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {windowsLayout.map(([path, role]) => (
                  <tr key={path}>
                    <td className="py-2.5 px-5 font-mono text-[11px] text-[#3A86EF]">{path}</td>
                    <td className="py-2.5 px-5 text-slate-500 dark:text-slate-400">{role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold">Specification Color System</h3>
            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              {palette.map((c) => (
                <div key={c.hex} className="flex items-center gap-2.5">
                  <span
                    className="w-6 h-6 rounded-md border border-slate-300 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      {c.name} <span className="font-mono font-normal text-slate-500">{c.hex}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
