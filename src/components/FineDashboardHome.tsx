import React, { useState } from 'react';
import {
  Search,
  Globe,
  Sparkles,
  FileText,
  Table2,
  Presentation,
  Printer,
  ShieldCheck,
  HardDrive,
  Crosshair,
  MessageSquare,
  Download,
  Mic,
  Calendar as CalendarIcon,
  CreditCard,
  Database,
  Activity,
  CloudSun,
  Clock,
  Trophy,
  ArrowRightLeft,
} from 'lucide-react';
import {
  ChatMessage,
  ConnectedBrowser,
  DownloadItem,
  FileNode,
  FineAccount,
  FineEdition,
  FineModuleId,
  SystemTelemetry,
  VirtualDesktopId,
} from '../types/fine';

interface FineDashboardHomeProps {
  account: FineAccount | null;
  edition?: FineEdition;
  virtualDesktop?: VirtualDesktopId;
  connectedBrowsers: ConnectedBrowser[];
  recentFiles: FileNode[];
  downloads: DownloadItem[];
  recentMessages: ChatMessage[];
  securityActiveCount: number;
  offlineMode: boolean;
  telemetry: SystemTelemetry | null;
  onSearchSubmit: (query: string) => void;
  onNavigateModule: (module: FineModuleId, subHint?: string) => void;
}

const FREQUENT_APPS: Array<{
  id: FineModuleId;
  subHint?: string;
  label: string;
  caption: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'browser', label: 'FINE Browser', caption: 'Split tab, Vault & search', icon: Globe },
  { id: 'ai', label: 'FINE AI (4 Brains)', caption: 'Fast, Think, Creative & Pro', icon: Sparkles },
  { id: 'office', subHint: 'writer', label: 'FINE Office', caption: 'Writer, Notes, Sheets & PDF', icon: FileText },
  { id: 'files', label: 'FINE Explorer', caption: 'Folders, Bin & PIN Vault', icon: HardDrive },
  { id: 'atm', label: 'FINE ATM Mode', caption: 'Face Check, Voice & Reverse PIN', icon: CreditCard },
  { id: 'finedb', label: 'FineDB Studio', caption: 'Indexed DB & .finebak backup', icon: Database },
  { id: 'taskmgr', label: 'Task Manager', caption: 'CPU, RAM, Battery & End Task', icon: Activity },
  { id: 'print', label: 'FINE Print', caption: 'Queue, duplex & PDF preview', icon: Printer },
  { id: 'security', label: 'Security & IP Shield', caption: '10 layers & IP blocklist', icon: ShieldCheck },
  { id: 'office', subHint: 'sheets', label: 'FINE Sheets', caption: 'Formulas, tables & charts', icon: Table2 },
  { id: 'office', subHint: 'slides', label: 'FINE Slides', caption: 'Presentations & decks', icon: Presentation },
  { id: 'arena', label: 'Laser Tag Arena', caption: 'Multiplayer 3D arena', icon: Crosshair },
];

const WEATHER_CITIES: Record<string, { temp: string; condition: string; wind: string }> = {
  Islamabad: { temp: '22°C', condition: 'Clear Sky', wind: '11 km/h NW' },
  Lahore: { temp: '26°C', condition: 'Sunny Breeze', wind: '14 km/h W' },
  Karachi: { temp: '29°C', condition: 'Coastal Fair', wind: '21 km/h SW' },
  London: { temp: '11°C', condition: 'Partly Cloudy', wind: '16 km/h W' },
};

const FX_RATES: Record<string, number> = {
  USD: 278.5,
  GBP: 353.2,
  EUR: 296.4,
  SAR: 74.2,
  AED: 75.8,
};

export const FineDashboardHome: React.FC<FineDashboardHomeProps> = ({
  account,
  edition = 'Pro',
  virtualDesktop = 'Work',
  connectedBrowsers,
  recentFiles,
  downloads,
  recentMessages,
  securityActiveCount,
  offlineMode,
  telemetry,
  onSearchSubmit,
  onNavigateModule,
}) => {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [city, setCity] = useState<keyof typeof WEATHER_CITIES>('Islamabad');
  const [fxAmount, setFxAmount] = useState(100);
  const [fxCurrency, setFxCurrency] = useState<keyof typeof FX_RATES>('USD');

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const monthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const todayDate = now.getDate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearchSubmit(query.trim());
  };

  const handleVoice = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      onSearchSubmit('Hey Fine: summarize today tasks and system status');
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      setListening(true);
      rec.onresult = (ev) => {
        const text = ev.results?.[0]?.[0]?.transcript || '';
        if (text) {
          setQuery(text);
          onSearchSubmit(text);
        }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const w = WEATHER_CITIES[city];

  return (
    <div className="grid xl:grid-cols-[1fr_310px] gap-6 items-start">
      <div className="space-y-6">
        {/* Welcome + Intelligent Search Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-[#0B132B] text-white border border-slate-800/30">
          <img
            src="/src/assets/images/fine_hero_vista_1794990396864.jpg"
            alt="FINE OS Unified Workspace"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(125deg, rgba(11,19,43,0.96) 0%, rgba(20,38,84,0.90) 60%, rgba(58,134,239,0.80) 100%)',
            }}
          />

          <div className="relative z-10 p-6 md:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-blue-200">
              <span>
                {account
                  ? `FINE OS ${edition} · ${account.name} (#${account.accountNumber})`
                  : `FINE OS ${edition} · Desktop: ${virtualDesktop}`}
              </span>
              <span className="tabular-nums">
                {offlineMode ? 'Offline Local Environment' : `${connectedBrowsers.length} Connected Device(s) · Desktop: ${virtualDesktop}`}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-balance">
                One OS. One Account. Every Machine.
              </h1>
              <p className="text-sm text-blue-100/90 mt-2 max-w-2xl">
                Browse with Split Tab & Vault, ask 4 FINE AI Brains in Urdu or English, edit local Office & Notes, use ATM Terminal, and inspect FineDB Studio.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-white rounded-xl p-1.5 pl-4 max-w-2xl shadow-lg"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search web, say 'Hey Fine...', or open fine://atm, fine://finedb, fine://writer..."
                className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm py-2 outline-none"
                aria-label="Intelligent search"
              />
              <button
                type="button"
                onClick={handleVoice}
                aria-label="Hey Fine voice command"
                className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1 text-xs font-semibold ${
                  listening ? 'text-blue-600 bg-blue-50' : ''
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Hey Fine</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-sm font-semibold whitespace-nowrap shrink-0"
              >
                Go
              </button>
            </form>
          </div>
        </section>

        {/* FINE OS Live Widgets Strip */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weather Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-[#3A86EF]" />
                Weather
              </span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as keyof typeof WEATHER_CITIES)}
                className="text-[11px] bg-transparent font-semibold text-[#3A86EF] outline-none"
                aria-label="Select weather city"
              >
                {Object.keys(WEATHER_CITIES).map((c) => (
                  <option key={c} value={c} className="text-slate-900">{c}</option>
                ))}
              </select>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums">{w.temp}</div>
            <div className="text-xs text-slate-500">{w.condition} · Wind {w.wind}</div>
          </div>

          {/* Prayer Times Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#2DC653]" />
              Prayer Times ({city})
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] tabular-nums">
              <span className="text-slate-500">Fajr</span><span className="font-mono font-semibold text-right">05:14</span>
              <span className="text-slate-500">Dhuhr</span><span className="font-mono font-semibold text-right">12:18</span>
              <span className="text-slate-500">Asr</span><span className="font-mono font-semibold text-right">15:42</span>
              <span className="text-slate-500">Maghrib</span><span className="font-mono font-semibold text-right">17:28</span>
              <span className="text-slate-500">Isha</span><span className="font-mono font-semibold text-right">18:54</span>
            </div>
          </div>

          {/* Cricket & Headlines Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Sports & Briefing
            </div>
            <div className="text-xs font-bold">PAK 248/4 (42.3 ov)</div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Live Cricket Score & FINE Tech Digest — click Search above for live web news grounding.
            </p>
          </div>

          {/* Currency Converter Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#3A86EF]" />
              Currency to PKR
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={fxAmount}
                onChange={(e) => setFxAmount(Number(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                aria-label="Currency amount"
              />
              <select
                value={fxCurrency}
                onChange={(e) => setFxCurrency(e.target.value as keyof typeof FX_RATES)}
                className="px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-transparent font-semibold"
                aria-label="Currency code"
              >
                {Object.keys(FX_RATES).map((cur) => (
                  <option key={cur} value={cur} className="text-slate-900">{cur}</option>
                ))}
              </select>
            </div>
            <div className="text-sm font-mono font-bold text-[#3A86EF] tabular-nums">
              = PKR {Math.round(fxAmount * FX_RATES[fxCurrency]).toLocaleString()}
            </div>
          </div>
        </section>

        {/* Frequently Used Applications */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">All FINE OS Applications</h2>
            <span className="text-xs text-slate-500">1-Click Launch · Local & Cloud</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FREQUENT_APPS.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={`${app.id}-${app.label}`}
                  type="button"
                  onClick={() => onNavigateModule(app.id, app.subHint)}
                  className="text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{app.label}</div>
                    <div className="text-xs text-slate-500 truncate">{app.caption}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Documents + Recent Downloads */}
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold">Recent Files & Folders</h2>
              <button
                type="button"
                onClick={() => onNavigateModule('files')}
                className="text-xs font-semibold text-[#3A86EF] hover:underline"
              >
                Open Explorer
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {recentFiles.filter((f) => !f.deleted).slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onNavigateModule(f.kind === 'folder' ? 'files' : 'office')}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded"
                >
                  <span className="font-semibold truncate">{f.name}</span>
                  <span className="text-slate-500 font-mono shrink-0 tabular-nums">{f.size}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#3A86EF]" />
                Recent Downloads
              </h2>
              <button
                type="button"
                onClick={() => onNavigateModule('browser')}
                className="text-xs font-semibold text-[#3A86EF] hover:underline"
              >
                Download Manager
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {downloads.slice(0, 4).map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{d.fileName}</div>
                    <div className="text-slate-500">{d.source} · {d.size}</div>
                  </div>
                  <span className="font-semibold text-emerald-600 shrink-0">{d.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Quick Access to Messages & AI Recommendations */}
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#3A86EF]" />
                Recent FINE Chats
              </h2>
              <button
                type="button"
                onClick={() => onNavigateModule('messages')}
                className="text-xs font-semibold text-[#3A86EF] hover:underline"
              >
                Open Chat
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              {recentMessages.slice(-3).map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-slate-500 mb-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{m.senderName}</span>
                    <span>{m.channel}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{m.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#3A86EF]" />
                FINE AI Suggestions
              </h2>
              <button
                type="button"
                onClick={() => onNavigateModule('ai')}
                className="text-xs font-semibold text-[#3A86EF] hover:underline"
              >
                Open 4 Brains
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateModule('office', 'notes')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
              >
                <div className="font-semibold">Open FINE Notes & 5-Sec AutoSave Writer</div>
                <div className="text-slate-500">To-do checklists, version history & 1-click PDF</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateModule('atm')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
              >
                <div className="font-semibold">Launch FINE ATM Terminal</div>
                <div className="text-slate-500">Test Face Check, Urdu Voice & Reverse-PIN Alert</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateModule('finedb')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
              >
                <div className="font-semibold">Inspect fine_local_db in FineDB Studio</div>
                <div className="text-slate-500">8 indexed local database tables & .finebak backup</div>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* D. Right-Side Information Panel */}
      <aside className="space-y-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-[#3A86EF]" />
              {monthLabel}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1.5">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs tabular-nums">
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <span key={`empty-${idx}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isToday = day === todayDate;
              return (
                <span
                  key={day}
                  className={`py-1 rounded-md ${
                    isToday ? 'bg-[#3A86EF] text-white font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold mb-3">System Status</h2>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">OS Edition</dt>
              <dd className="font-semibold">FINE OS {edition}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500 shrink-0">OS Kernel</dt>
              <dd className="font-semibold truncate text-right">
                {telemetry ? `${telemetry.platform} (${telemetry.arch})` : 'Loading...'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">CPU Threads</dt>
              <dd className="font-mono font-semibold tabular-nums">
                {telemetry ? `${telemetry.cpuCores} cores` : 'Detecting...'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Memory Usage</dt>
              <dd className="font-mono font-semibold tabular-nums">
                {telemetry ? `${telemetry.memUsedGb} / ${telemetry.memTotalGb} GB` : 'Detecting...'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Connected Devices</dt>
              <dd className="font-mono font-semibold tabular-nums">{connectedBrowsers.length}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold mb-2">Storage Information</h2>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
            <span>Host Volume</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {telemetry && telemetry.diskUsedGb !== null && telemetry.diskTotalGb !== null
                ? `${telemetry.diskUsedGb} / ${telemetry.diskTotalGb} GB`
                : 'Checking...'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#3A86EF] rounded-full transition-all"
              style={{
                width:
                  telemetry && telemetry.diskUsedGb !== null && telemetry.diskTotalGb
                    ? `${Math.min(100, Math.max(2, Math.round((telemetry.diskUsedGb / telemetry.diskTotalGb) * 100)))}%`
                    : '15%',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-3 tabular-nums">
            <span>System Uptime</span>
            <span className="font-mono font-semibold text-emerald-600">
              {telemetry
                ? `${Math.floor(telemetry.uptimeSeconds / 3600)}h ${Math.floor((telemetry.uptimeSeconds % 3600) / 60)}m`
                : 'Active'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">Security Shield</h2>
            <span className="text-xs font-semibold text-emerald-600">Protected</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3 tabular-nums">
            {securityActiveCount} of 10 layers + IP brute-force blocklist active.
          </p>
          <button
            type="button"
            onClick={() => onNavigateModule('security')}
            className="w-full py-2 rounded-lg bg-[#edf3ff] hover:bg-[#dce8ff] text-[#1d4f9c] text-xs font-semibold"
          >
            Security & IP Admin
          </button>
        </div>
      </aside>
    </div>
  );
};
