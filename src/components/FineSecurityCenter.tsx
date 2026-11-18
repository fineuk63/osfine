import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Globe,
  RefreshCw,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Ban,
  Eye,
  Siren,
} from 'lucide-react';
import {
  BlockedIpEntry,
  FineSecurityLog,
  QuarantineItem,
  SecurityLayerStatus,
} from '../types/fine';

interface FineSecurityCenterProps {
  layers: SecurityLayerStatus[];
  quarantine: QuarantineItem[];
  securityEvents: Array<{ timestamp: string; event: string }>;
  lastScanTime: string;
  onToggleLayer: (id: string) => void;
  onRunFullScan: () => void;
  onAddQuarantine: (item: QuarantineItem) => void;
  onRestoreQuarantine: (id: string) => void;
  onDeleteQuarantine: (id: string) => void;
  onSecurityEventsUpdated?: (events: Array<{ timestamp: string; event: string }>) => void;
}

export const FineSecurityCenter: React.FC<FineSecurityCenterProps> = ({
  layers,
  quarantine,
  securityEvents,
  lastScanTime,
  onToggleLayer,
  onRunFullScan,
  onAddQuarantine,
  onRestoreQuarantine,
  onDeleteQuarantine,
  onSecurityEventsUpdated,
}) => {
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [urlResult, setUrlResult] = useState<{
    url: string;
    verdict: 'Safe' | 'Caution' | 'Blocked';
    findings: string[];
  } | null>(null);
  const [scanningUrl, setScanningUrl] = useState(false);

  const [fileResult, setFileResult] = useState<{
    fileName: string;
    sha256: string;
    clean: boolean;
    threatName: string | null;
    detectionMethod: string;
  } | null>(null);
  const [scanningFile, setScanningFile] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [threatAdvice, setThreatAdvice] = useState<{ title: string; text: string } | null>(null);
  const [explainingThreatId, setExplainingThreatId] = useState<string | null>(null);

  // Admin IP Blocklist & Hacker Detection Logs
  const [securityLogs, setSecurityLogs] = useState<FineSecurityLog[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [manualBlockIp, setManualBlockIp] = useState('');
  const [manualBlockReason, setManualBlockReason] = useState('Suspicious brute-force attempt');

  // Health & Safety Tools
  const [eyeRestOn, setEyeRestOn] = useState(false);
  const [eyeSecondsLeft, setEyeSecondsLeft] = useState(1200);
  const [sosNotice, setSosNotice] = useState<string | null>(null);

  const loadAdminSecurity = () => {
    fetch('/api/security/admin-logs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (Array.isArray(d.securityLogs)) setSecurityLogs(d.securityLogs);
        if (Array.isArray(d.blockedIps)) setBlockedIps(d.blockedIps);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAdminSecurity();
  }, []);

  useEffect(() => {
    if (!eyeRestOn) return;
    const id = window.setInterval(() => {
      setEyeSecondsLeft((s) => (s <= 1 ? 1200 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [eyeRestOn]);

  const activeLayerCount = layers.filter((l) => l.enabled).length;
  const activeQuarantined = quarantine.filter((q) => q.status === 'Quarantined');

  const explainThreat = async (item: QuarantineItem) => {
    setExplainingThreatId(item.id);
    setThreatAdvice(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'diagnose',
          brain: 'think',
          prompt: `Explain concisely what "${item.threatName}" detected on file "${item.fileName}" via ${item.detectionMethod} means, whether it is safe to restore or best to delete, and recommended next action.`,
        }),
      });
      const data = await res.json();
      setThreatAdvice({
        title: `${item.fileName} — ${item.threatName}`,
        text: res.ok ? data.text : data.error || 'AI threat analysis unavailable.',
      });
    } catch {
      setThreatAdvice({
        title: item.fileName,
        text: 'Unable to reach FINE AI threat analyzer.',
      });
    } finally {
      setExplainingThreatId(null);
    }
  };

  const handleScanUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setScanningUrl(true);
    try {
      const res = await fetch('/api/security/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) setUrlResult(data);
    } finally {
      setScanningUrl(false);
    }
  };

  const runFileScanPayload = async (fileName: string, contentSample: string, sizeBytes: number) => {
    setScanningFile(true);
    try {
      const res = await fetch('/api/security/scan-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, contentSample, sizeBytes }),
      });
      const data = await res.json();
      if (res.ok) {
        setFileResult(data);
        if (!data.clean && data.threatName) {
          onAddQuarantine({
            id: `q-${Date.now()}`,
            fileName: data.fileName,
            threatName: data.threatName,
            detectionMethod: data.detectionMethod,
            severity: data.severity || 'High',
            detectedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            sha256: data.sha256,
            status: 'Quarantined',
          });
        }
      }
    } finally {
      setScanningFile(false);
    }
  };

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slice = await file.slice(0, 8192).text();
    await runFileScanPayload(file.name, slice, file.size);
    e.target.value = '';
  };

  const blockIpAddress = async (ip: string, forever = true) => {
    if (!ip.trim()) return;
    const res = await fetch('/api/security/block-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: ip.trim(), forever, reason: manualBlockReason }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.blockedIps)) {
      setBlockedIps(data.blockedIps);
      setManualBlockIp('');
      loadAdminSecurity();
    }
  };

  const unblockIpAddress = async (ip: string) => {
    const res = await fetch('/api/security/unblock-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.blockedIps)) {
      setBlockedIps(data.blockedIps);
      loadAdminSecurity();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Security Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FINE Security Centre & IP Hacker Shield</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              10-layer malware shield, live brute-force IP blocklist, Reverse-PIN detection, Eye-Rest guard & SOS alert.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 tabular-nums">
              <span>{activeLayerCount} of {layers.length} layers active</span>
              <span aria-hidden="true">·</span>
              <span>Last scan: {lastScanTime}</span>
              <span aria-hidden="true">·</span>
              <span>Blocked IPs: {blockedIps.length}</span>
              <span aria-hidden="true">·</span>
              <span>Quarantined files: {activeQuarantined.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={checkingUpdates}
            onClick={async () => {
              setCheckingUpdates(true);
              try {
                const res = await fetch('/api/security/check-updates', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  setUpdateMessage(
                    `Signature database synchronized to v${data.version} (all ${data.layersVerified} layers verified).`
                  );
                  if (Array.isArray(data.securityEvents)) {
                    onSecurityEventsUpdated?.(data.securityEvents);
                  }
                } else {
                  setUpdateMessage(data.error || 'Unable to verify signature updates.');
                }
              } catch {
                setUpdateMessage('Network error reaching FINE security update service.');
              } finally {
                setCheckingUpdates(false);
              }
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
            {checkingUpdates ? 'Updating...' : 'Check Updates'}
          </button>
          <button
            type="button"
            onClick={() => {
              onRunFullScan();
              loadAdminSecurity();
            }}
            className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-white text-xs font-semibold whitespace-nowrap"
          >
            Run Security Scan
          </button>
        </div>
      </div>

      {updateMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl px-4 py-3 text-xs font-medium">
          {updateMessage}
        </div>
      )}

      {/* Health & Safety Tools: Eye-Rest 20-20-20 + Family SOS */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-[#3A86EF] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold">Eye-Rest 20-20-20 Guard</h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {eyeRestOn
                  ? `Next break reminder in ${Math.floor(eyeSecondsLeft / 60)}m ${String(eyeSecondsLeft % 60).padStart(2, '0')}s`
                  : 'Reminds you every 20 minutes to look 20ft away for 20 seconds.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEyeRestOn((v) => !v);
              setEyeSecondsLeft(1200);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 ${
              eyeRestOn ? 'bg-emerald-600 text-white' : 'bg-[#edf3ff] text-[#1d4f9c]'
            }`}
          >
            {eyeRestOn ? 'Guard Active' : 'Enable Eye Guard'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Siren className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold">Family Emergency SOS</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {sosNotice || 'Broadcast urgent safety alert to trusted FINE contacts & security audit log.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const ts = new Date().toISOString();
              setSosNotice(`SOS Dispatch recorded at ${new Date().toLocaleTimeString()}`);
              onSecurityEventsUpdated?.([
                { timestamp: ts, event: 'EMERGENCY SOS dispatched to trusted FINE Family Contacts.' },
                ...securityEvents,
              ]);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#E63946] hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
          >
            Trigger SOS
          </button>
        </div>
      </div>

      {/* Hacker Detection & Admin IP Blocklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              Hacker Detection & Admin IP Blocklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              5 failed PIN attempts from an IP within 5 minutes automatically blocks that IP for 1 hour. Admins can permanently block or unblock any IP below.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAdminSecurity}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            Refresh Logs
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            blockIpAddress(manualBlockIp, true);
          }}
          className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2 text-xs"
        >
          <input
            type="text"
            value={manualBlockIp}
            onChange={(e) => setManualBlockIp(e.target.value)}
            placeholder="IP Address (e.g. 203.0.113.45)"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
          />
          <input
            type="text"
            value={manualBlockReason}
            onChange={(e) => setManualBlockReason(e.target.value)}
            placeholder="Reason..."
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#E63946] hover:bg-rose-700 text-white font-semibold whitespace-nowrap"
          >
            Block IP Forever
          </button>
        </form>

        {blockedIps.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blocked IP Addresses</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {blockedIps.map((b) => (
                <div
                  key={b.ip}
                  className="border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 rounded-lg p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-rose-700 dark:text-rose-400">{b.ip}</div>
                    <div className="text-[11px] text-slate-500 truncate">{b.reason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => unblockIpAddress(b.ip)}
                    className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] shrink-0"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-60 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs tabular-nums">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-2 px-4 font-semibold">Timestamp</th>
                <th className="py-2 px-4 font-semibold">Account</th>
                <th className="py-2 px-4 font-semibold">IP</th>
                <th className="py-2 px-4 font-semibold">Action</th>
                <th className="py-2 px-4 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {securityLogs.slice(0, 20).map((log) => (
                <tr key={log.log_id}>
                  <td className="py-2 px-4 font-mono text-[11px] text-slate-500">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2 px-4 font-mono">{log.account_no}</td>
                  <td className="py-2 px-4 font-mono">{log.ip}</td>
                  <td className="py-2 px-4">{log.action}</td>
                  <td className="py-2 px-4 font-bold">
                    <span
                      className={
                        log.risk_level === 'CRITICAL' || log.risk_level === 'HIGH'
                          ? 'text-rose-600'
                          : log.risk_level === 'MEDIUM'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }
                    >
                      {log.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Scanners: Web Protection + Download/File Scanner */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[#3A86EF]" />
            <h2 className="text-sm font-bold">Web Protection & URL Inspector</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Verify any website address for phishing patterns, unencrypted HTTP transport, or deceptive domains before visiting.
          </p>
          <form onSubmit={handleScanUrl} className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL to check (e.g. https://example.com)"
              className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={scanningUrl}
              className="px-4 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1a3970] text-white text-xs font-semibold whitespace-nowrap"
            >
              {scanningUrl ? 'Scanning...' : 'Inspect URL'}
            </button>
          </form>

          {urlResult && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono truncate max-w-[75%]">{urlResult.url}</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    urlResult.verdict === 'Safe'
                      ? 'text-emerald-600'
                      : urlResult.verdict === 'Caution'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                  }`}
                >
                  {urlResult.verdict === 'Safe' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {urlResult.verdict}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{urlResult.findings.join(' ')}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-[#3A86EF]" />
            <h2 className="text-sm font-bold">Download & File Threat Scanner</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Inspect a local file via SHA-256 and heuristic rules, or run an EICAR antivirus verification test.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold cursor-pointer whitespace-nowrap">
              {scanningFile ? 'Scanning...' : 'Scan Local File'}
              <input type="file" onChange={handleRealFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() =>
                runFileScanPayload(
                  'eicar_verification.txt',
                  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
                  68
                )
              }
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold whitespace-nowrap"
            >
              Test EICAR Signature
            </button>
          </div>

          {fileResult && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{fileResult.fileName}</span>
                <span className={`font-semibold ${fileResult.clean ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fileResult.clean ? 'Clean — No Threat Found' : `Quarantined: ${fileResult.threatName}`}
                </span>
              </div>
              <div className="text-slate-500 font-mono truncate">SHA-256: {fileResult.sha256}</div>
            </div>
          )}
        </div>
      </div>

      {/* 10 Protection Layers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">FINE Security Shield — 10 Protection Layers</h2>
            <p className="text-xs text-slate-500">
              Independent security layers designed so no single failure compromises your system.
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="font-mono text-xs text-blue-600">{layer.number}.</span>
                  <span>{layer.name}</span>
                  <span className="text-xs font-normal text-slate-400">· {layer.engine}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{layer.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${layer.enabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {layer.enabled ? layer.lastChecked : 'Paused'}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleLayer(layer.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                    layer.enabled
                      ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {layer.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarantine Centre */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold">Quarantine Centre</h2>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">{quarantine.length} record(s)</span>
        </div>

        {quarantine.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No suspected files in Quarantine. Clean system state verified.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50/70 dark:bg-slate-800">
                  <th className="py-2.5 px-5 font-semibold">File Name</th>
                  <th className="py-2.5 px-4 font-semibold">Detection</th>
                  <th className="py-2.5 px-4 font-semibold">Detected</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quarantine.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-5 font-medium">{item.fileName}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.threatName} · {item.detectionMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">{item.detectedAt}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={item.status === 'Quarantined' ? 'text-rose-600' : 'text-emerald-600'}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={explainingThreatId === item.id}
                          onClick={() => explainThreat(item)}
                          className="px-2.5 py-1 rounded border border-blue-200 bg-[#edf3ff] hover:bg-[#dce8ff] text-[#1d4f9c] font-medium inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {explainingThreatId === item.id ? 'Analyzing...' : 'AI Explain'}
                        </button>
                        {item.status === 'Quarantined' && (
                          <button
                            type="button"
                            onClick={() => onRestoreQuarantine(item.id)}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-medium inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteQuarantine(item.id)}
                          className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 font-medium inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {threatAdvice && (
          <div className="m-5 p-4 rounded-xl bg-[#f5f8ff] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
            <div className="font-bold mb-1">FINE AI Security Analysis: {threatAdvice.title}</div>
            {threatAdvice.text}
          </div>
        )}
      </div>

      {/* Persistent Security Audit Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold">Security Audit Log</h2>
          <span className="text-xs text-slate-500 tabular-nums">{securityEvents.length} recent event(s)</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-60 overflow-y-auto">
          {securityEvents.map((ev, idx) => (
            <div key={idx} className="px-5 py-2.5 flex items-center justify-between gap-4">
              <span>{ev.event}</span>
              <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
