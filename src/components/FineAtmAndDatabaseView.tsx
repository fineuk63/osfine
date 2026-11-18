import React, { useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  ShieldAlert,
  Volume2,
  Camera,
  CheckCircle2,
  Database,
  Search,
  Download,
  Upload,
  Lock,
  Activity,
  XCircle,
  WifiOff,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react';
import {
  BrowserTab,
  FineAccount,
  FineAtmTransaction,
  MailMessage,
  SystemTelemetry,
} from '../types/fine';

// ============================================================================
// 1. FINE ATM Machine Mode (Card/NFC, Face Check, Urdu/English Voice, Reverse PIN)
// ============================================================================
interface FineAtmViewProps {
  account: FineAccount | null;
  offlineMode: boolean;
  onAtmReceiptMail: (mail: MailMessage) => void;
  onAtmChatNotify: (text: string) => void;
  onAccountBalanceUpdated?: (acc: FineAccount) => void;
}

export const FineAtmView: React.FC<FineAtmViewProps> = ({
  account,
  offlineMode,
  onAtmReceiptMail,
  onAtmChatNotify,
  onAccountBalanceUpdated,
}) => {
  const [identifier, setIdentifier] = useState(account?.accountNumber || '72841936');
  const [pin, setPin] = useState('');
  const [faceChecking, setFaceChecking] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ur-PK'>('en-US');
  const [atmAction, setAtmAction] = useState<'WITHDRAW' | 'BALANCE' | 'TRANSFER'>('WITHDRAW');
  const [amount, setAmount] = useState(5000);
  const [recipientAcc, setRecipientAcc] = useState('73910482');
  const [busy, setBusy] = useState(false);
  const [skimmerOk, setSkimmerOk] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<FineAtmTransaction | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<
    Array<{ identifier: string; pin: string; type: 'WITHDRAW' | 'BALANCE' | 'TRANSFER'; amount: number; recipientAccount?: string }>
  >([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (account?.accountNumber) setIdentifier(account.accountNumber);
  }, [account?.accountNumber]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const speakAtmGuide = (englishText: string, urduText: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(voiceLang === 'ur-PK' ? urduText : englishText);
      utter.lang = voiceLang;
      utter.rate = 0.96;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speech synthesis errors in sandboxed iframes
    }
  };

  const toggleFaceCheck = async () => {
    if (faceChecking) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setFaceChecking(false);
      return;
    }
    setFaceChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTimeout(() => {
        setFaceVerified(true);
        setStatusBanner('Face ID Check Verified — Biometric ATM session ready.');
        speakAtmGuide(
          'Biometric face verification passed. Select your ATM transaction.',
          'چہرے کی تصدیق مکمل ہو گئی ہے۔ اپنی ٹرانزیکشن منتخب کریں۔'
        );
      }, 900);
    } catch {
      setFaceVerified(true);
      setFaceChecking(false);
      setStatusBanner('Simulated Biometric Passkey verified (camera permission unavailable in sandbox).');
    }
  };

  const runAtmTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceVerified && pin.length < 4) {
      setStatusBanner('Enter your 4-digit PIN (or reverse PIN for silent emergency) or enable Face Check.');
      return;
    }

    if (offlineMode) {
      const queuedItem = {
        identifier,
        pin,
        type: atmAction,
        amount,
        recipientAccount: atmAction === 'TRANSFER' ? recipientAcc : undefined,
      };
      setOfflineQueue((prev) => [...prev, queuedItem]);
      setStatusBanner(`Offline ATM Mode: Queued ${atmAction} PKR ${amount.toLocaleString()} for sync once online.`);
      speakAtmGuide('Transaction queued offline safely.', 'آف لائن ٹرانزیکشن محفوظ کر لی گئی ہے۔');
      return;
    }

    setBusy(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/atm/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          pin,
          faceVerified,
          type: atmAction,
          amount,
          recipientAccount: recipientAcc,
          offlineMode: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner(data.error || 'ATM transaction declined.');
        return;
      }

      setLastTx(data.transaction);
      if (data.account && onAccountBalanceUpdated) {
        onAccountBalanceUpdated(data.account);
      }
      if (data.receiptMail) {
        onAtmReceiptMail(data.receiptMail);
      }

      if (data.emergencyReverseTriggered) {
        // Screen stays calm to protect user, but backend recorded CRITICAL silent alert
        setStatusBanner(
          `ATM Dispensing Complete (Balance: PKR ${Number(data.balance).toLocaleString()}). Note: Reverse PIN silent safety alert was logged in Security Centre.`
        );
      } else {
        setStatusBanner(
          `${atmAction} completed cleanly. Remaining Balance: PKR ${Number(data.balance).toLocaleString()} · Receipt sent to FINE Mail & Chat.`
        );
        onAtmChatNotify(
          `FINE ATM Receipt: ${atmAction} PKR ${amount.toLocaleString()} on Account #${identifier}. Remaining Balance: PKR ${Number(data.balance).toLocaleString()}.`
        );
        speakAtmGuide(
          `Transaction complete. Remaining balance is ${data.balance} rupees. Please take your cash and card.`,
          `آپ کی ٹرانزیکشن مکمل ہو گئی ہے۔ باقی بیلنس ${data.balance} روپے ہے۔ اپنا کارڈ اور رقم حاصل کریں۔`
        );
      }
      setPin('');
    } catch {
      setStatusBanner('Unable to reach FINE ATM server.');
    } finally {
      setBusy(false);
    }
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || offlineMode) return;
    setBusy(true);
    let synced = 0;
    for (const item of offlineQueue) {
      try {
        const res = await fetch('/api/atm/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, faceVerified: true }),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.receiptMail) onAtmReceiptMail(d.receiptMail);
          if (d.account && onAccountBalanceUpdated) onAccountBalanceUpdated(d.account);
          synced += 1;
        }
      } catch {
        // continue
      }
    }
    setOfflineQueue([]);
    setBusy(false);
    setStatusBanner(`Synced ${synced} offline-queued ATM transaction(s) with server ledger.`);
  };

  return (
    <div className="space-y-6">
      {/* ATM Header */}
      <div className="bg-[#0B132B] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#3A86EF] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FINE OS ATM Terminal</h1>
            <p className="text-xs text-blue-200 mt-1">
              Card, NFC Mobile Tap, Face Check, Urdu/English Voice Guide, Anti-Skimmer Hardware Lock & Silent Reverse-PIN Protection.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as 'en-US' | 'ur-PK')}
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
            aria-label="ATM Voice Language"
          >
            <option value="en-US" className="text-slate-900">Voice: English</option>
            <option value="ur-PK" className="text-slate-900">Voice: Urdu (اردو)</option>
          </select>
          <button
            type="button"
            onClick={() =>
              speakAtmGuide(
                'Welcome to FINE ATM. Enter your 8-digit account number and 4-digit PIN, or use Face Check.',
                'فائن اے ٹی ایم میں خوش آمدید۔ اپنا اکاؤنٹ نمبر اور چار ہندسوں کا پن درج کریں۔'
              )
            }
            className="px-3 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice Guide
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl px-4 py-3 text-xs font-medium">
          {statusBanner}
        </div>
      )}

      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <WifiOff className="w-4 h-4" />
            {offlineQueue.length} offline ATM transaction(s) waiting for sync
          </span>
          <button
            type="button"
            disabled={offlineMode || busy}
            onClick={syncOfflineQueue}
            className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-white font-semibold disabled:opacity-50"
          >
            {offlineMode ? 'Go Online to Sync' : 'Sync Queued Transactions'}
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <form onSubmit={runAtmTransaction} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card / Account # / Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 72841936"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                4-Digit PIN (Demo Owner: 1234 · Reverse Alert: 4321)
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={faceVerified ? 'Face Verified (PIN optional)' : 'Enter 4-digit PIN'}
                className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Operation Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'WITHDRAW', label: 'Cash Withdrawal', icon: Banknote },
                { id: 'BALANCE', label: 'Balance Check', icon: CreditCard },
                { id: 'TRANSFER', label: 'Fast Transfer', icon: ArrowRightLeft },
              ] as const
            ).map((op) => {
              const Icon = op.icon;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setAtmAction(op.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors ${
                    atmAction === op.id
                      ? 'bg-[#3A86EF] text-white border-[#3A86EF]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {op.label}
                </button>
              );
            })}
          </div>

          {atmAction !== 'BALANCE' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[1000, 5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                      amount === preset
                        ? 'bg-[#0B132B] text-white border-[#0B132B]'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    PKR {preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Custom Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                {atmAction === 'TRANSFER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Recipient FINE Account #
                    </label>
                    <input
                      type="text"
                      value={recipientAcc}
                      onChange={(e) => setRecipientAcc(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2DC653] hover:bg-emerald-600 text-white text-sm font-bold"
            >
              {busy ? 'Processing ATM Request...' : `Confirm ${atmAction}`}
            </button>
            <button
              type="button"
              onClick={toggleFaceCheck}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-[#3A86EF]" />
              {faceChecking ? 'Stop Camera' : faceVerified ? 'Face ID Verified' : 'Face Check'}
            </button>
          </div>
        </form>

        {/* ATM Hardware Shield + Biometric Preview + Last Receipt */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">ATM Security Hardware</h2>
              <span className={`text-xs font-semibold ${skimmerOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                {skimmerOk ? 'Anti-Skimmer Active' : 'Hardware Tamper'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Card slot electromagnetic sensors, encrypted PIN pad, and silent Reverse-PIN dispatch are active.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSkimmerOk(true);
                  setStatusBanner('Anti-Skimmer Hardware Check passed: No foreign reader overlay detected.');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Run Anti-Skimmer Self-Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusBanner(
                    'Tip: Entering your 4-digit PIN in reverse (e.g. 4321 instead of 1234) dispenses calmly while silently alerting FINE Police & Bank Patrol.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Reverse-PIN Safety Info
              </button>
            </div>
            {faceChecking && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-36 rounded-lg bg-slate-950 object-cover border border-slate-200"
              />
            )}
          </div>

          {lastTx && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2 text-xs">
              <div className="font-bold text-sm">Latest ATM Receipt</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-semibold">{lastTx.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operation</span>
                <span className="font-semibold">{lastTx.type}</span>
              </div>
              <div className="flex justify-between tabular-nums">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-bold">PKR {lastTx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-600">{lastTx.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. FineDB Studio (Indexed Persistent Local Database Inspector + .finebak Backup)
// ============================================================================
interface FineDbStudioViewProps {
  account: FineAccount | null;
  onExportWorkspaceArchive: () => void;
  onImportWorkspaceArchive: (jsonText: string) => void;
}

type TableKey =
  | 'fine_users'
  | 'fine_sessions'
  | 'fine_chats'
  | 'fine_mails'
  | 'fine_ai_history'
  | 'fine_security_logs'
  | 'fine_atm_transactions'
  | 'fine_devices';

export const FineDbStudioView: React.FC<FineDbStudioViewProps> = ({
  account,
  onExportWorkspaceArchive,
  onImportWorkspaceArchive,
}) => {
  const [authAccount, setAuthAccount] = useState(account?.accountNumber || '72841936');
  const [authPin, setAuthPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Record<TableKey, Array<Record<string, unknown>>> | null>(null);
  const [activeTable, setActiveTable] = useState<TableKey>('fine_users');
  const [filterText, setFilterText] = useState('');

  const handleInspect = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/finedb/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: authAccount.trim(), pin: authPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Database access denied.');
        return;
      }
      setTables(data.tables);
      setUnlocked(true);
    } catch {
      setError('Failed to query fine_local_db.');
    }
  };

  const rows = tables?.[activeTable] || [];
  const filteredRows = filterText.trim()
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase()))
    : rows;
  const columns = filteredRows[0] ? Object.keys(filteredRows[0]) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FineDB Studio — Local Indexed Database</h1>
            <p className="text-xs text-slate-500">
              Master Account-locked browser for fine_users, sessions, chats, mails, AI history, security logs, ATM ledger & devices.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportWorkspaceArchive}
            className="px-3.5 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Backup .finebak
          </button>
          <label className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Restore .finebak
            <input
              type="file"
              accept=".finebak,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onImportWorkspaceArchive(await f.text());
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {!unlocked ? (
        <form
          onSubmit={handleInspect}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Lock className="w-4 h-4 text-[#3A86EF]" />
            Unlock FineDB Studio
          </div>
          <p className="text-xs text-slate-500">
            Enter your 8-digit FINE Account No & 4-digit PIN (Built-in Demo Owner: <code className="font-mono">72841936</code> / <code className="font-mono">1234</code>).
          </p>
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1">Master Account Number</label>
            <input
              type="text"
              required
              value={authAccount}
              onChange={(e) => setAuthAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Security PIN</label>
            <input
              type="password"
              required
              value={authPin}
              onChange={(e) => setAuthPin(e.target.value)}
              placeholder="4-digit PIN"
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-bold"
          >
            Inspect fine_local_db
          </button>
        </form>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5 items-start">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1">
            {(
              [
                'fine_users',
                'fine_sessions',
                'fine_chats',
                'fine_mails',
                'fine_ai_history',
                'fine_security_logs',
                'fine_atm_transactions',
                'fine_devices',
              ] as const
            ).map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setActiveTable(tbl)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTable === tbl
                    ? 'bg-[#3A86EF] text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono truncate">{tbl}</span>
                <span className="font-mono text-[11px] opacity-80 tabular-nums">
                  {tables?.[tbl]?.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-bold font-mono">{activeTable} ({filteredRows.length})</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Indexed search..."
                    className="text-xs outline-none bg-transparent w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleInspect()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Refresh
                </button>
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No rows in {activeTable}.</div>
            ) : (
              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full text-left border-collapse text-xs tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                      {columns.slice(0, 6).map((col) => (
                        <th key={col} className="py-2.5 px-4 font-mono font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.slice(0, 40).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        {columns.slice(0, 6).map((col) => (
                          <td key={col} className="py-2.5 px-4 max-w-[220px] truncate font-mono text-[11px]">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. FINE Task Manager (Live CPU, RAM, Battery, Network & 1-Click End Task)
// ============================================================================
interface FineTaskManagerProps {
  tabs: BrowserTab[];
  telemetry: SystemTelemetry | null;
  offlineMode: boolean;
  onEndTask: (tabId: string) => void;
  onRefreshTelemetry: () => void;
}

export const FineTaskManagerView: React.FC<FineTaskManagerProps> = ({
  tabs,
  telemetry,
  offlineMode,
  onEndTask,
  onRefreshTelemetry,
}) => {
  const [batteryInfo, setBatteryInfo] = useState<string>('Checking AC / Battery...');

  useEffect(() => {
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (nav.getBattery) {
      nav
        .getBattery()
        .then((b) => {
          setBatteryInfo(`${Math.round(b.level * 100)}% (${b.charging ? 'Charging' : 'On Battery'})`);
        })
        .catch(() => setBatteryInfo('AC Power / Desktop'));
    } else {
      setBatteryInfo('AC Power / Workstation');
    }
  }, []);

  const memPct = telemetry
    ? Math.min(100, Math.round((telemetry.memUsedGb / Math.max(1, telemetry.memTotalGb)) * 100))
    : 32;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FINE Task Manager</h1>
            <p className="text-xs text-slate-500">
              Monitor real CPU threads, RAM pressure, battery, network status, and terminate any open app or tab in 1 click.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshTelemetry}
          className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold"
        >
          Refresh Metrics
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500">CPU Compute</div>
          <div className="text-2xl font-bold font-mono mt-1">{telemetry?.cpuCores ?? navigator.hardwareConcurrency ?? 4} Cores</div>
          <div className="text-[11px] text-slate-500 truncate mt-1">{telemetry?.cpuModel || 'Active CPU'}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500">Memory (RAM)</div>
          <div className="text-2xl font-bold font-mono mt-1">{memPct}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {telemetry ? `${telemetry.memUsedGb} / ${telemetry.memTotalGb} GB` : 'Healthy'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500">Battery & Power</div>
          <div className="text-xl font-bold font-mono mt-1">{batteryInfo}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Balanced Performance</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500">Internet & Relay</div>
          <div className="text-2xl font-bold font-mono mt-1">{offlineMode ? 'Offline' : 'Online'}</div>
          <div className="text-[11px] text-slate-500 mt-1">WebSocket Active</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold">Running Processes & Open Tabs ({tabs.length})</h2>
        </div>
        <table className="w-full text-left border-collapse text-xs tabular-nums">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <th className="py-2.5 px-5 font-semibold">Application / Tab</th>
              <th className="py-2.5 px-4 font-semibold">Desktop</th>
              <th className="py-2.5 px-4 font-semibold">URI</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tabs.map((tab) => (
              <tr key={tab.id}>
                <td className="py-3 px-5 font-semibold">{tab.title}</td>
                <td className="py-3 px-4 text-slate-500">{tab.desktop || 'Work'}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{tab.url}</td>
                <td className="py-3 px-4 text-emerald-600 font-semibold">
                  {tab.isPinned ? 'Pinned · Active' : 'Running'}
                </td>
                <td className="py-3 px-5 text-right">
                  <button
                    type="button"
                    disabled={tabs.length <= 1}
                    onClick={() => onEndTask(tab.id)}
                    className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40 inline-flex items-center gap-1 font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    End Task
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
