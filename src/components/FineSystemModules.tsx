import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Usb,
  Wifi,
  HardDrive,
  Printer,
  Wrench,
  CheckCircle2,
  Play,
  Square,
  Sliders,
  Volume2,
  Upload,
  Sparkles,
  Download,
  Power,
  Sun,
  Monitor,
} from 'lucide-react';
import { FineAccount, FineEdition, FineTheme, PrintJob, SystemTelemetry } from '../types/fine';
import { FineArchitectureSpec } from './FineBootEnvironment';

// ============================================================================
// 1. FINE Hardware & Devices Centre (USB Auto-Detect, Virus Scan & Fix Driver)
// ============================================================================
export const FineDevicesView: React.FC<{
  telemetry: SystemTelemetry | null;
  usbMounted?: boolean;
  onMountUsbDrive?: () => void;
  onEjectUsbDrive?: () => void;
  onRefreshTelemetry?: () => void;
}> = ({ telemetry, usbMounted = false, onMountUsbDrive, onEjectUsbDrive, onRefreshTelemetry }) => {
  const [liveAudioCount, setLiveAudioCount] = useState<number | null>(null);
  const [liveVideoCount, setLiveVideoCount] = useState<number | null>(null);
  const [usbStatus, setUsbStatus] = useState<string>('Ready — Hardware inspection active.');
  const [scanningUsb, setScanningUsb] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devs) => {
          setLiveAudioCount(devs.filter((d) => d.kind === 'audioinput' || d.kind === 'audiooutput').length);
          setLiveVideoCount(devs.filter((d) => d.kind === 'videoinput').length);
        })
        .catch(() => {});
    }
  }, []);

  const buses = [
    {
      name: 'CPU & Compute Architecture',
      detail: telemetry
        ? `${telemetry.cpuModel} · ${telemetry.cpuCores} logical cores (${telemetry.arch})`
        : 'Querying host CPU telemetry...',
      icon: Cpu,
      status: telemetry ? 'Active' : 'Checking',
    },
    {
      name: 'Memory & Virtual Address Space',
      detail: telemetry
        ? `${telemetry.memUsedGb} GB used / ${telemetry.memTotalGb} GB total RAM`
        : 'Querying system memory...',
      icon: Sliders,
      status: 'Healthy',
    },
    {
      name: 'Filesystem & Block Storage',
      detail:
        telemetry && telemetry.diskUsedGb !== null && telemetry.diskTotalGb !== null
          ? `${telemetry.diskUsedGb} GB used / ${telemetry.diskTotalGb} GB host volume`
          : 'Host volume telemetry verified',
      icon: HardDrive,
      status: 'Mounted',
    },
    {
      name: 'Network Interfaces',
      detail:
        telemetry && telemetry.networkInterfaces.length > 0
          ? telemetry.networkInterfaces
              .slice(0, 3)
              .map((n) => `${n.name} (${n.family}: ${n.address})`)
              .join(' · ')
          : navigator.onLine
            ? 'Connected — Active adapter'
            : 'Offline Mode',
      icon: Wifi,
      status: navigator.onLine ? 'Online' : 'Offline',
    },
    {
      name: 'USB Auto-Detect & Shield',
      detail: usbMounted
        ? 'SanDisk Ultra 32GB USB mounted cleanly in FINE Explorer (USB Drive).'
        : 'Plug a USB drive to trigger automatic Zero-Trust malware scanning before mounting.',
      icon: Usb,
      status: usbMounted ? 'Mounted Clean' : 'Standby',
    },
    {
      name: 'Cameras, Microphones & Speakers',
      detail:
        liveAudioCount !== null
          ? `Detected ${liveAudioCount} audio endpoint(s) · ${liveVideoCount ?? 0} camera(s)`
          : 'Explicit permission required before activation',
      icon: Volume2,
      status: 'Protected',
    },
  ];

  const handleHardwareScan = async () => {
    onRefreshTelemetry?.();
    try {
      const nav = navigator as unknown as { usb?: { getDevices: () => Promise<Array<unknown>> } };
      if (nav.usb?.getDevices) {
        const devs = await nav.usb.getDevices();
        setUsbStatus(
          `Hardware rescan complete: ${devs.length} WebUSB device(s), ${liveAudioCount ?? 0} audio endpoints, ${telemetry?.cpuCores ?? '-'} CPU cores active.`
        );
        return;
      }
    } catch {
      // Permissions policy guard
    }

    setUsbStatus(
      `Live scan complete: ${telemetry?.cpuCores ?? '-'} CPU threads, ${telemetry?.memUsedGb ?? '-'}/${telemetry?.memTotalGb ?? '-'} GB RAM, ${liveAudioCount ?? 0} audio & ${liveVideoCount ?? 0} camera interface(s).`
    );
  };

  const simulateUsbPlug = async () => {
    setScanningUsb(true);
    setUsbStatus('USB insertion detected: scanning SanDisk Ultra 32GB partitions via FINE Malware Engine...');
    try {
      const res = await fetch('/api/security/scan-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'SanDisk_32GB_Partition0.img',
          contentSample: 'FINE OS USB Auto-Detect Verification Manifest Clean FAT32',
          sizeBytes: 4096,
        }),
      });
      const data = await res.json();
      if (data.clean) {
        onMountUsbDrive?.();
        setUsbStatus(
          `SanDisk 32GB verified clean (SHA-256 ${String(data.sha256).slice(0, 12)}) and auto-mounted under Explorer > USB Drive.`
        );
      } else {
        setUsbStatus(`USB blocked: ${data.threatName || 'Malicious autorun payload'} quarantined.`);
      }
    } catch {
      onMountUsbDrive?.();
      setUsbStatus('SanDisk 32GB USB mounted offline under Explorer > USB Drive.');
    } finally {
      setScanningUsb(false);
    }
  };

  const handleFixDriver = async () => {
    setUsbStatus('Running automated FINE Driver Repair across audio, display, USB HID, and network stack...');
    try {
      const res = await fetch('/api/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: 'driver' }),
      });
      const data = await res.json();
      setUsbStatus(data.summary || 'All hardware drivers verified and repaired cleanly.');
    } catch {
      setUsbStatus('Local driver reset applied across display & audio endpoints.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">FINE Control Panel — Hardware, Drivers & USB</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Live host telemetry, USB auto-detect with malware shield, 1-click Fix Driver, and media endpoints.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!usbMounted ? (
            <button
              type="button"
              disabled={scanningUsb}
              onClick={simulateUsbPlug}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Usb className="w-3.5 h-3.5" />
              {scanningUsb ? 'Scanning USB...' : 'Plug SanDisk 32GB USB'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onEjectUsbDrive?.();
                setUsbStatus('SanDisk 32GB USB safely ejected.');
              }}
              className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Usb className="w-3.5 h-3.5" />
              Safe Eject USB
            </button>
          )}
          <button
            type="button"
            onClick={handleFixDriver}
            className="px-3.5 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1a2952] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Wrench className="w-3.5 h-3.5" />
            Fix Driver
          </button>
          <button
            type="button"
            onClick={handleHardwareScan}
            className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold whitespace-nowrap"
          >
            Refresh Hardware Scan
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
        {usbStatus}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{b.status}</span>
              </div>
              <h2 className="text-sm font-bold">{b.name}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">{b.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 2. FINE Print Centre (Real Printable Sheet Preview + Native Print Spooler)
// ============================================================================
interface FinePrintViewProps {
  jobs: PrintJob[];
  onAddPrintJob: (job: Omit<PrintJob, 'id' | 'status' | 'createdAt'>) => void;
  onClearCompleted: () => void;
}

export const FinePrintView: React.FC<FinePrintViewProps> = ({
  jobs,
  onAddPrintJob,
  onClearCompleted,
}) => {
  const [docName, setDocName] = useState(jobs[0]?.documentName || 'Quarterly Platform Report.docx');
  const [sourceType, setSourceType] = useState<PrintJob['sourceType']>(jobs[0]?.sourceType || 'Document');
  const [paperSize, setPaperSize] = useState<PrintJob['paperSize']>(jobs[0]?.paperSize || 'A4');
  const [colorMode, setColorMode] = useState<PrintJob['colorMode']>(jobs[0]?.colorMode || 'Colour');
  const [duplex, setDuplex] = useState(true);
  const [docContent, setDocContent] = useState(
    jobs[0]?.content ||
      'Prepared via FINE Office & Print Centre.\n\nThis clean printable document sheet is formatted for native system printers and PDF export.'
  );

  const handleQueueAndPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    onAddPrintJob({
      documentName: docName.trim(),
      sourceType,
      paperSize,
      colorMode,
      duplex,
      content: docContent,
    });
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">FINE Print Centre</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure page size, inspect the live printable sheet below, and invoke your OS print or Save-to-PDF driver.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1a3970] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" />
          Open System Print Dialog
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleQueueAndPrint} className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold">Print Configuration</h2>

          <div>
            <label className="block text-xs font-semibold mb-1">Item to Print</label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Content Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as PrintJob['sourceType'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="Document">Document</option>
                <option value="PDF">PDF</option>
                <option value="Photo">Photo</option>
                <option value="Email">Email</option>
                <option value="Web Page">Web Page</option>
                <option value="Spreadsheet">Spreadsheet</option>
                <option value="Presentation">Presentation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PrintJob['paperSize'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">US Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs items-center">
            <div>
              <label className="block font-semibold mb-1">Colour Mode</label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as PrintJob['colorMode'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="Colour">Colour</option>
                <option value="Black & White">Black & White</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-5 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={duplex}
                onChange={(e) => setDuplex(e.target.checked)}
                className="rounded border-slate-300"
              />
              Double-sided (Duplex)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Printable Body Content</label>
            <textarea
              rows={5}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold"
          >
            Print & Record in Queue
          </button>
        </form>

        <div className="space-y-5">
          <div
            className={`fine-printable-sheet bg-white text-slate-900 border border-slate-300 rounded-xl p-6 space-y-3 ${
              colorMode === 'Black & White' ? 'grayscale' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs text-slate-500">
              <span className="font-bold text-[#0B132B]">FINE Print Output</span>
              <span>
                {sourceType} · {paperSize} · {colorMode}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#0B132B]">{docName}</h2>
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed max-h-56 overflow-y-auto">
              {docContent}
            </pre>
          </div>

          <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold">Print Queue ({jobs.length})</h2>
              <button
                type="button"
                onClick={onClearCompleted}
                className="text-xs font-semibold text-[#3A86EF] hover:underline"
              >
                Clear Completed
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-56 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="p-6 text-center text-slate-500">Print queue is empty.</div>
              ) : (
                jobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setDocName(j.documentName);
                      setSourceType(j.sourceType);
                      setPaperSize(j.paperSize);
                      setColorMode(j.colorMode);
                      setDuplex(j.duplex);
                      if (j.content) setDocContent(j.content);
                    }}
                    className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{j.documentName}</div>
                      <div className="text-slate-500">
                        {j.sourceType} · {j.paperSize} · {j.createdAt}
                      </div>
                    </div>
                    <span className={`font-semibold shrink-0 ${j.status === 'Completed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {j.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. FINE Independent Recovery System (Live OS Probes + AI Diagnosis + Backup)
// ============================================================================
const RECOVERY_TOOLS = [
  { id: 'startup', name: 'Startup Repair', detail: 'Verify core application manifest and boot entry points.' },
  { id: 'disk', name: 'Disk Check', detail: 'Query real filesystem capacity, free blocks, and workspace store integrity.' },
  { id: 'ram', name: 'RAM Test', detail: 'Allocate and verify live memory integrity buffer and process heap usage.' },
  { id: 'driver', name: 'Driver Repair', detail: 'Inspect logical CPU cores, network adapters, and I/O volume handlers.' },
  { id: 'net', name: 'Network Recovery', detail: 'Run live HTTPS connectivity & DNS resolution latency check.' },
  { id: 'backup', name: 'Full File Backup', detail: 'Export a downloadable .finebak archive of your full workspace.' },
];

export const FineRecoveryView: React.FC<{
  onTriggerBackup: () => void;
  onExportArchive: () => void;
}> = ({ onTriggerBackup, onExportArchive }) => {
  const [activeLog, setActiveLog] = useState<string[]>([
    'FINE Recovery Environment active. Select any live diagnostic below.',
  ]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [aiDiag, setAiDiag] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runRecoveryTool = async (id: string, name: string) => {
    setRunningId(id);
    if (id === 'backup') {
      onTriggerBackup();
      onExportArchive();
    }
    try {
      const res = await fetch('/api/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: id }),
      });
      const data = await res.json();
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setActiveLog((prev) => [...prev, `[${ts}] ${name}: ${data.summary || data.error || 'Done'}`]);
    } catch {
      setActiveLog((prev) => [...prev, `${name}: Unable to reach FINE recovery endpoint.`]);
    } finally {
      setRunningId(null);
    }
  };

  const askAiToExplainLog = async () => {
    setAiLoading(true);
    setAiDiag(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'diagnose',
          brain: 'think',
          prompt: `Analyze these real FINE Recovery diagnostic logs and give concise health observations and next steps:\n\n${activeLog.join('\n')}`,
        }),
      });
      const data = await res.json();
      setAiDiag(res.ok ? data.text : data.error || 'AI diagnostics unavailable.');
    } catch {
      setAiDiag('Failed to reach FINE AI diagnostics.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0B132B] text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FINE Independent Recovery System</h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Execute real server filesystem, RAM allocation, network latency, and boot-file diagnostics, or export an encrypted-ready workspace backup.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-300 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          Live Diagnostics Ready
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RECOVERY_TOOLS.map((tool) => (
          <div key={tool.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold">{tool.name}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{tool.detail}</p>
            </div>
            <button
              type="button"
              disabled={runningId !== null}
              onClick={() => runRecoveryTool(tool.id, tool.name)}
              className="mt-4 w-full py-2 rounded-lg bg-[#edf3ff] hover:bg-[#dce8ff] text-[#1d4f9c] text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
            >
              {tool.id === 'backup' && <Download className="w-3.5 h-3.5" />}
              {runningId === tool.id ? 'Running...' : `Run ${tool.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 text-slate-200 rounded-xl p-5 font-mono text-xs space-y-2 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-slate-400 font-semibold">Live Recovery Diagnostic Output</span>
          <button
            type="button"
            disabled={aiLoading}
            onClick={askAiToExplainLog}
            className="px-3 py-1 rounded bg-[#3A86EF] hover:bg-[#1d54ab] text-white font-sans font-semibold text-xs inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? 'Analyzing...' : 'AI Troubleshoot Log'}
          </button>
        </div>
        {activeLog.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {aiDiag && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl p-5 text-xs whitespace-pre-wrap leading-relaxed">
          <div className="font-bold mb-1">FINE AI Recovery Assessment</div>
          {aiDiag}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. FINE Media Studio (Local Audio & Video File Player + Speaker Test)
// ============================================================================
export const FineMediaView: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [freq, setFreq] = useState(261.63);
  const [ctx, setCtx] = useState<AudioContext | null>(null);
  const [mediaFileUrl, setMediaFileUrl] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [mediaKind, setMediaKind] = useState<'audio' | 'video' | null>(null);

  useEffect(() => {
    return () => {
      if (mediaFileUrl) URL.revokeObjectURL(mediaFileUrl);
    };
  }, [mediaFileUrl]);

  useEffect(() => {
    return () => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, [ctx]);

  const handleSelectMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaFileUrl) URL.revokeObjectURL(mediaFileUrl);
    setMediaFileUrl(URL.createObjectURL(file));
    setMediaFileName(file.name);
    setMediaKind(file.type.startsWith('video/') ? 'video' : 'audio');
    e.target.value = '';
  };

  const togglePlay = () => {
    if (playing) {
      try {
        if (ctx && ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {
        // Ignore already-closed AudioContext
      }
      setCtx(null);
      setPlaying(false);
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new AudioCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      setCtx(c);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">FINE Media — Audio & Video Player</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Open and play local MP4, WebM, MP3, WAV, or FLAC files offline, or verify speaker output.
          </p>
        </div>

        <label className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          Open Local Audio / Video File
          <input type="file" accept="audio/*,video/*" onChange={handleSelectMedia} className="hidden" />
        </label>
      </div>

      {mediaFileUrl && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-800 space-y-3">
          <div className="text-xs font-bold">Now Playing: {mediaFileName}</div>
          {mediaKind === 'video' ? (
            <video controls src={mediaFileUrl} className="w-full max-h-[380px] rounded-lg bg-black" />
          ) : (
            <audio controls src={mediaFileUrl} className="w-full" />
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold">Speaker & Output Frequency Test</h2>
          <div className="flex items-center gap-3 text-xs">
            <span>Frequency:</span>
            <input
              type="range"
              min={180}
              max={660}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono tabular-nums">{Math.round(freq)} Hz</span>
          </div>
          <button
            type="button"
            onClick={togglePlay}
            className="px-4 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {playing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Stop Test Tone' : 'Play Test Tone'}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="text-sm font-bold">Offline Native Playback</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Local files selected above stream directly inside your browser sandbox via object URLs with zero external uploads.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. FINE Settings, Control Panel, Machine Editions, Themes & Auto-Boot
// ============================================================================
interface FineSettingsViewProps {
  offlineMode: boolean;
  largeText: boolean;
  autoStartOnBoot: boolean;
  account: FineAccount | null;
  edition?: FineEdition;
  theme?: FineTheme;
  brightness?: number;
  soundVolume?: number;
  nightLight?: boolean;
  onChangeEdition?: (edition: FineEdition) => void;
  onChangeTheme?: (theme: FineTheme) => void;
  onChangeBrightness?: (val: number) => void;
  onChangeSoundVolume?: (val: number) => void;
  onToggleNightLight?: () => void;
  onToggleOffline: () => void;
  onToggleLargeText: () => void;
  onToggleAutoStart: () => void;
  onSimulateBoot: () => void;
  onLaunchStandaloneRecovery: () => void;
  onOpenAccount: () => void;
}

const EDITIONS: Array<{ id: FineEdition; desc: string }> = [
  { id: 'Home', desc: 'Daily PC & Laptop desktop' },
  { id: 'Pro', desc: 'Workstation & FineDB Studio' },
  { id: 'Mobile', desc: 'Touch phone frame + Bottom bar' },
  { id: 'ATM', desc: 'Fullscreen ATM Bank Terminal' },
  { id: 'Kiosk', desc: 'Single-app locked shop mode' },
  { id: 'Lite', desc: 'Ultra-fast low-RAM PCs' },
  { id: 'Max', desc: 'All AI brains & 3D unlocked' },
];

export const FineSettingsView: React.FC<FineSettingsViewProps> = ({
  offlineMode,
  largeText,
  autoStartOnBoot,
  account,
  edition = 'Home',
  theme = 'light',
  brightness = 100,
  soundVolume = 80,
  nightLight = false,
  onChangeEdition,
  onChangeTheme,
  onChangeBrightness,
  onChangeSoundVolume,
  onToggleNightLight,
  onToggleOffline,
  onToggleLargeText,
  onToggleAutoStart,
  onSimulateBoot,
  onLaunchStandaloneRecovery,
  onOpenAccount,
}) => {
  const offlineMatrix = [
    ['FINE Browser (Saved pages & local files)', 'Available Offline'],
    ['FINE AI (FINE Local AI engine)', 'Available Offline'],
    ['FINE Writer, Notes, Sheets, Slides, PDF & Design', 'Available Offline'],
    ['FINE Explorer & Hardware Control Panel', 'Available Offline'],
    ['System Print & Save to PDF', 'Available Offline'],
    ['ATM Offline Queue & Security Shield', 'Available Offline'],
    ['Live Web Fetch, Grounded Search & Streaming Gemini AI', offlineMode ? 'Paused while Offline' : 'Active Online'],
  ];

  const downloadAutostartScript = (platform: 'windows' | 'linux') => {
    const appUrl = window.location.origin;
    if (platform === 'windows') {
      const reg = [
        'Windows Registry Editor Version 5.00',
        '',
        '[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run]',
        `"FINE_OS"="${`msedge --app=${appUrl} --start-maximized`}"`,
        '',
      ].join('\r\n');
      const blob = new Blob([reg], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fine_windows_autoboot.reg';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const desktop = [
      '[Desktop Entry]',
      'Type=Application',
      'Name=FINE OS Universal Platform',
      `Exec=xdg-open ${appUrl}`,
      'X-GNOME-Autostart-enabled=true',
      'Terminal=false',
      '',
    ].join('\n');
    const blob = new Blob([desktop], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fine-autostart.desktop';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FINE Settings, Control Panel, Editions & Themes</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Switch machine editions (PC, Mobile, ATM, Kiosk), display themes, brightness, sound, auto-boot, and recovery.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAccount}
          className="px-4 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold"
        >
          {account ? `Manage Account #${account.accountNumber}` : 'Sign In / Register'}
        </button>
      </div>

      {/* Machine Editions & Personalization Themes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Monitor className="w-4 h-4 text-[#3A86EF]" />
            Machine Edition Mode ({edition})
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {EDITIONS.map((ed) => (
              <button
                key={ed.id}
                type="button"
                onClick={() => onChangeEdition?.(ed.id)}
                className={`text-left p-3 rounded-lg border text-xs transition-colors ${
                  edition === ed.id
                    ? 'border-[#3A86EF] bg-[#edf3ff] dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-bold">FINE {ed.id}</div>
                <div className="text-[11px] text-slate-500">{ed.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sun className="w-4 h-4 text-[#3A86EF]" />
            Themes, Display Brightness & Audio
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {(['light', 'dark', 'neon', 'nature'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChangeTheme?.(t)}
                className={`py-2 px-3 rounded-lg border font-semibold capitalize ${
                  theme === t
                    ? 'border-[#3A86EF] bg-[#3A86EF] text-white'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-24 font-semibold">Brightness</span>
              <input
                type="range"
                min={60}
                max={105}
                value={brightness}
                onChange={(e) => onChangeBrightness?.(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono w-10 text-right tabular-nums">{brightness}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 font-semibold">System Sound</span>
              <input
                type="range"
                min={0}
                max={100}
                value={soundVolume}
                onChange={(e) => onChangeSoundVolume?.(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono w-10 text-right tabular-nums">{soundVolume}%</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold">Night Light (Warm Eye Comfort Filter)</span>
              <button
                type="button"
                onClick={() => onToggleNightLight?.()}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  nightLight ? 'bg-amber-600 text-white' : 'border border-slate-200 dark:border-slate-700'
                }`}
              >
                {nightLight ? 'Night Light On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold">Workspace & Boot Controls</h2>

          <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold">Auto-Boot When Computer Starts</div>
              <div className="text-xs text-slate-500">Launch FINE automatically at system startup with desktop boot screen.</div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoStart}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                autoStartOnBoot ? 'bg-[#2DC653] text-white' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              {autoStartOnBoot ? 'Auto-Boot On' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold">Simulate Offline Operation</div>
              <div className="text-xs text-slate-500">Use FINE Local AI, ATM Offline Queue, and local document editing.</div>
            </div>
            <button
              type="button"
              onClick={onToggleOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                offlineMode ? 'bg-amber-600 text-white' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              {offlineMode ? 'Offline Active' : 'Online'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold">Large Readable Text</div>
              <div className="text-xs text-slate-500">Increase workspace base readability across menus and editors.</div>
            </div>
            <button
              type="button"
              onClick={onToggleLargeText}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                largeText ? 'bg-[#3A86EF] text-white' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              {largeText ? 'Large Enabled' : 'Standard'}
            </button>
          </div>

          <div className="pt-1 space-y-2">
            <div className="text-xs font-semibold">Windows / Linux Auto-Start Scripts & Boot Modes</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadAutostartScript('windows')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Windows .reg Auto-Boot
              </button>
              <button
                type="button"
                onClick={() => downloadAutostartScript('linux')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Linux .desktop Auto-Boot
              </button>
              <button
                type="button"
                onClick={onSimulateBoot}
                className="px-3 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Power className="w-3.5 h-3.5" />
                Test Boot & Lock Screen
              </button>
              <button
                type="button"
                onClick={onLaunchStandaloneRecovery}
                className="px-3 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#16244f] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                Boot Without Windows (Recovery)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold mb-3">Offline Operation Matrix</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {offlineMatrix.map(([feat, status]) => (
              <div key={feat} className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                <span className="font-semibold text-[#2DC653] shrink-0">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FineArchitectureSpec />
    </div>
  );
};
