import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  Package,
  ShieldCheck,
  FolderOpen,
  FolderPlus,
  Check,
  AlertCircle,
  Download,
  EyeOff,
  Puzzle,
  Wrench,
  RefreshCw,
  Globe,
  Printer,
  Copy,
  Trash2,
  Upload,
  FileText,
  Bookmark,
  Columns,
  BookOpen,
  KeyRound,
  ZoomIn,
  ZoomOut,
  PictureInPicture2,
  Mic,
  Volume2,
  History,
  Folder,
  HardDrive,
  RotateCcw,
  Lock,
  Unlock,
  Scissors,
  ClipboardPaste,
  Edit3,
  Usb,
} from 'lucide-react';
import {
  AiProviderId,
  BookmarkItem,
  DownloadItem,
  ExplorerFolderLocation,
  FetchedWebPage,
  FileNode,
  FineAiBrain,
  FineAiHistoryEntry,
  FineVaultSecret,
  HistoryEntry,
  SoftwarePackage,
  SystemTelemetry,
} from '../types/fine';

// ============================================================================
// 1. FINE Intelligent Browser View (Split Tab, Reader Mode, Zoom, Find, Vault, PiP)
// ============================================================================
interface FineBrowserSearchProps {
  initialQuery: string;
  fetchedPage: FetchedWebPage | null;
  fetchingPage: boolean;
  fetchError: string | null;
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  downloads: DownloadItem[];
  vaultSecrets?: FineVaultSecret[];
  onSaveVaultSecret?: (secret: FineVaultSecret) => void;
  onRunSearch: (query: string) => void;
  onFetchUrl: (url: string) => void;
  onClearPage: () => void;
  onSaveOfflinePage: (page: FetchedWebPage) => void;
  onPrintPage: (page: FetchedWebPage) => void;
  onAddBookmark: (bookmark: Omit<BookmarkItem, 'id'>) => void;
  onRemoveBookmark: (id: string) => void;
  onOpenPdfViewer: () => void;
}

export const FineBrowserSearchView: React.FC<FineBrowserSearchProps> = ({
  initialQuery,
  fetchedPage,
  fetchingPage,
  fetchError,
  bookmarks,
  history,
  downloads,
  vaultSecrets = [],
  onSaveVaultSecret,
  onRunSearch,
  onFetchUrl,
  onClearPage,
  onSaveOfflinePage,
  onPrintPage,
  onAddBookmark,
  onRemoveBookmark,
  onOpenPdfViewer,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [privateMode, setPrivateMode] = useState(false);
  const [translateTarget, setTranslateTarget] = useState('Urdu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageAiOutput, setPageAiOutput] = useState<string | null>(null);
  const [pageAiLoading, setPageAiLoading] = useState(false);
  const [savedPages, setSavedPages] = useState<string[]>([]);

  // Enhanced Browser Controls
  const [readerMode, setReaderMode] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [findInPageOpen, setFindInPageOpen] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [splitTabOpen, setSplitTabOpen] = useState(false);
  const [splitUrl, setSplitUrl] = useState('https://example.com');
  const [splitPage, setSplitPage] = useState<FetchedWebPage | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [popOutVideo, setPopOutVideo] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPinInput, setVaultPinInput] = useState('');
  const [newVaultSite, setNewVaultSite] = useState('');
  const [newVaultUser, setNewVaultUser] = useState('');
  const [newVaultPass, setNewVaultPass] = useState('');

  const [extensions, setExtensions] = useState([
    { id: 'ext-1', name: 'FINE Tracker & Ad Blocker', enabled: true },
    { id: 'ext-2', name: 'FINE Password Vault Bridge', enabled: true },
    { id: 'ext-3', name: 'FINE Urdu & English Page Translator', enabled: true },
  ]);
  const [aiResult, setAiResult] = useState<{
    query: string;
    summary: string;
    results: Array<{ title: string; url: string; snippet: string }>;
  } | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setPageAiOutput(null);
  }, [fetchedPage?.finalUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindInPageOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const performAiSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (/^https?:\/\//i.test(trimmed) || (trimmed.includes('.') && !trimmed.includes(' '))) {
      onFetchUrl(trimmed);
      return;
    }

    setLoading(true);
    setError(null);
    if (!privateMode) onRunSearch(trimmed);
    try {
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search AI service returned an error.');
      } else {
        setAiResult(data);
      }
    } catch {
      setError('Unable to reach FINE Search server.');
    } finally {
      setLoading(false);
    }
  };

  const loadSplitTabPage = async (urlStr: string) => {
    const target = /^https?:\/\//i.test(urlStr.trim()) ? urlStr.trim() : `https://${urlStr.trim()}`;
    setSplitLoading(true);
    try {
      const res = await fetch('/api/browser/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (res.ok) setSplitPage(data);
    } catch {
      // ignore
    } finally {
      setSplitLoading(false);
    }
  };

  const analyzeFetchedPage = async (task: 'summarize' | 'translate') => {
    if (!fetchedPage) return;
    setPageAiLoading(true);
    setPageAiOutput(null);
    try {
      const res = await fetch('/api/ai/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: fetchedPage.finalUrl,
          pageText: fetchedPage.textContent,
          task,
          targetLanguage: translateTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPageAiOutput(`AI Notice: ${data.error || 'Unable to analyze webpage.'}`);
      } else {
        setPageAiOutput(data.text || '(No output returned)');
      }
    } catch {
      setPageAiOutput('Network error contacting FINE AI webpage analyzer.');
    } finally {
      setPageAiLoading(false);
    }
  };

  const triggerDownloadSave = (d: DownloadItem) => {
    const body =
      d.content ||
      `FINE Download Verification Receipt\nFile: ${d.fileName}\nSource: ${d.source}\nSize: ${d.size}\nStatus: ${d.status}\nTimestamp: ${d.downloadedAt}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = d.content ? d.fileName : `${d.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const findMatchCount =
    findTerm.trim() && fetchedPage?.textContent
      ? (fetchedPage.textContent.toLowerCase().match(new RegExp(findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
      : 0;

  return (
    <div className="space-y-6">
      <div
        className={`border rounded-xl p-6 ${
          privateMode
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg font-bold">
              FINE Intelligent Browser {privateMode ? '(Private Browsing)' : ''}
            </h1>
            <p className={`text-xs ${privateMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Split Tab, Reader Mode, Ctrl+F Find, Password Vault, Video Pop-Out & Urdu/English AI Translate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={translateTarget}
              onChange={(e) => setTranslateTarget(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs"
              aria-label="Website translation language"
            >
              <option value="Urdu">Translate: Urdu (اردو)</option>
              <option value="English">Translate: English</option>
              <option value="Arabic">Translate: Arabic</option>
              <option value="Spanish">Translate: Spanish</option>
              <option value="French">Translate: French</option>
              <option value="Hindi">Translate: Hindi</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const next = !splitTabOpen;
                setSplitTabOpen(next);
                if (next && !splitPage) loadSplitTabPage(splitUrl);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                splitTabOpen
                  ? 'bg-[#3A86EF] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split Tab
            </button>

            <button
              type="button"
              onClick={() => setReaderMode((r) => !r)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                readerMode
                  ? 'bg-[#3A86EF] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Reader
            </button>

            <button
              type="button"
              onClick={() => setFindInPageOpen((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              title="Ctrl+F Find in Page"
            >
              Ctrl+F
            </button>

            <button
              type="button"
              onClick={() => setPopOutVideo((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                popOutVideo
                  ? 'bg-[#3A86EF] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
              Video Pop-Out
            </button>

            <button
              type="button"
              onClick={() => setVaultOpen((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                vaultOpen
                  ? 'bg-[#0B132B] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Vault
            </button>

            <button
              type="button"
              onClick={() =>
                setPrivateMode((v) => {
                  const next = !v;
                  if (!next) {
                    setAiResult(null);
                    setPageAiOutput(null);
                  }
                  return next;
                })
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                privateMode
                  ? 'bg-[#3A86EF] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              {privateMode ? 'Exit Private' : 'Private'}
            </button>

            <button
              type="button"
              onClick={onOpenPdfViewer}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              PDF Viewer
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            performAiSearch(query);
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter website URL (e.g. https://example.com) or search topic..."
              className="flex-1 min-w-0 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || fetchingPage}
            className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold whitespace-nowrap"
          >
            {loading || fetchingPage ? 'Loading...' : 'Browse / AI Search'}
          </button>
          <button
            type="button"
            disabled={fetchingPage || !query.trim()}
            onClick={() => onFetchUrl(query)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-[#0B132B] text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#3A86EF]" />
            Fetch Live Page
          </button>
          <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 px-1.5 text-xs tabular-nums">
            <button
              type="button"
              onClick={() => setZoomPct((z) => Math.max(70, z - 10))}
              className="p-1 text-slate-600 dark:text-slate-300"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px]">{zoomPct}%</span>
            <button
              type="button"
              onClick={() => setZoomPct((z) => Math.min(160, z + 10))}
              className="p-1 text-slate-600 dark:text-slate-300"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Find in Page Bar */}
        {findInPageOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs">
            <span className="font-semibold">Find in Page:</span>
            <input
              type="text"
              value={findTerm}
              onChange={(e) => setFindTerm(e.target.value)}
              placeholder="Type keyword..."
              className="flex-1 min-w-[160px] px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
            />
            <span className="font-mono text-slate-500 tabular-nums">{findMatchCount} match(es)</span>
            <button type="button" onClick={() => setFindInPageOpen(false)} className="text-slate-500 hover:text-slate-900">
              Close
            </button>
          </div>
        )}

        {/* Password Vault Drawer */}
        {vaultOpen && (
          <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/70 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#3A86EF]" />
                FINE Password Vault (PIN Protected)
              </div>
              {vaultUnlocked && (
                <button type="button" onClick={() => setVaultUnlocked(false)} className="text-rose-600 font-semibold">
                  Lock Vault
                </button>
              )}
            </div>
            {!vaultUnlocked ? (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={vaultPinInput}
                  onChange={(e) => setVaultPinInput(e.target.value)}
                  placeholder="Enter PIN to unlock (Demo: 1234)"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (vaultPinInput.trim().length >= 4) {
                      setVaultUnlocked(true);
                      setVaultPinInput('');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] text-white font-semibold"
                >
                  Unlock Vault
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newVaultSite}
                    onChange={(e) => setNewVaultSite(e.target.value)}
                    placeholder="Site (e.g. github.com)"
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <input
                    type="text"
                    value={newVaultUser}
                    onChange={(e) => setNewVaultUser(e.target.value)}
                    placeholder="Username / Email"
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <input
                    type="password"
                    value={newVaultPass}
                    onChange={(e) => setNewVaultPass(e.target.value)}
                    placeholder="Password"
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newVaultSite.trim() || !newVaultUser.trim()) return;
                      onSaveVaultSecret?.({
                        id: `vs-${Date.now()}`,
                        site: newVaultSite.trim(),
                        username: newVaultUser.trim(),
                        password: newVaultPass || '••••••••',
                        updatedAt: new Date().toISOString().slice(0, 10),
                      });
                      setNewVaultSite('');
                      setNewVaultUser('');
                      setNewVaultPass('');
                    }}
                    className="px-3 py-1.5 rounded bg-[#0B132B] text-white font-semibold"
                  >
                    Save Credential
                  </button>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {vaultSecrets.map((s) => (
                    <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">{s.site}</span> · <span className="text-slate-500">{s.username}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(s.password).catch(() => {})}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                      >
                        Copy Secret
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(error || fetchError) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError || error}</span>
          </div>
        )}

        {/* Live Fetched Webpage Reader (+ Optional Split Tab Side-by-Side) */}
        {(fetchedPage || splitTabOpen) && (
          <div className={`mt-6 grid gap-4 ${splitTabOpen ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {fetchedPage ? (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          fetchedPage.verdict === 'Safe'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fetchedPage.verdict} · HTTP {fetchedPage.statusCode}
                      </span>
                      <h2 className="text-sm font-bold truncate">{fetchedPage.title}</h2>
                    </div>
                    <div className="text-xs font-mono text-slate-500 truncate mt-0.5">{fetchedPage.finalUrl}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pageAiLoading}
                      onClick={() => analyzeFetchedPage('summarize')}
                      className="px-2.5 py-1 rounded-lg bg-[#edf3ff] text-[#1d4f9c] text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {pageAiLoading ? '...' : 'AI Summarize'}
                    </button>
                    <button
                      type="button"
                      disabled={pageAiLoading}
                      onClick={() => analyzeFetchedPage('translate')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Translate ({translateTarget})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAddBookmark({
                          title: fetchedPage.title || fetchedPage.finalUrl,
                          url: fetchedPage.finalUrl,
                          category: 'Saved Web',
                          module: 'browser',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#3A86EF]" />
                      Bookmark
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSaveOfflinePage(fetchedPage);
                        setSavedPages((prev) => [fetchedPage.title, ...prev.filter((t) => t !== fetchedPage.title)]);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Save Offline
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintPage(fetchedPage)}
                      className="px-2.5 py-1 rounded-lg bg-[#0B132B] text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Save PDF
                    </button>
                    <button
                      type="button"
                      onClick={onClearPage}
                      className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {pageAiOutput && (
                  <div className="p-4 bg-[#f5f8ff] dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 text-xs whitespace-pre-wrap leading-relaxed">
                    <div className="font-bold mb-1">FINE AI Webpage Insights</div>
                    {pageAiOutput}
                  </div>
                )}

                <div
                  className={`p-5 grid gap-5 ${readerMode ? 'grid-cols-1 max-w-2xl mx-auto' : 'lg:grid-cols-[1fr_240px]'}`}
                  style={{ fontSize: `${zoomPct}%` }}
                >
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {fetchedPage.description && (
                      <p className="text-xs font-medium text-slate-500 italic">{fetchedPage.description}</p>
                    )}
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {fetchedPage.textContent || 'No readable text content extracted from this resource.'}
                    </pre>
                  </div>

                  {!readerMode && (
                    <div className="border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-4 pt-3 lg:pt-0 space-y-2">
                      <div className="text-xs font-bold">Links on Page ({fetchedPage.links.length})</div>
                      {fetchedPage.links.length === 0 ? (
                        <div className="text-xs text-slate-400">No external links extracted.</div>
                      ) : (
                        <div className="space-y-1.5 max-h-80 overflow-y-auto">
                          {fetchedPage.links.map((lk, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onFetchUrl(lk.href)}
                              className="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs"
                            >
                              <div className="font-semibold text-[#3A86EF] truncate">{lk.text}</div>
                              <div className="text-[11px] font-mono text-slate-400 truncate">{lk.href}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              splitTabOpen && (
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-xs text-slate-500 flex flex-col justify-center">
                  Primary Tab: Enter any URL above and click Fetch Live Page to compare side-by-side with Split Tab.
                </div>
              )
            )}

            {/* Split Tab Secondary Pane */}
            {splitTabOpen && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#3A86EF]">SPLIT TAB</span>
                  <input
                    type="text"
                    value={splitUrl}
                    onChange={(e) => setSplitUrl(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    disabled={splitLoading}
                    onClick={() => loadSplitTabPage(splitUrl)}
                    className="px-3 py-1 rounded bg-[#3A86EF] text-white text-xs font-semibold"
                  >
                    {splitLoading ? '...' : 'Load'}
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto text-xs space-y-2">
                  {splitPage ? (
                    <>
                      <div className="font-bold text-sm">{splitPage.title}</div>
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-slate-600 dark:text-slate-300">
                        {splitPage.textContent}
                      </pre>
                    </>
                  ) : (
                    <div className="text-slate-500 py-8 text-center">Click Load to display second website side-by-side.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grounded Web Briefing */}
        {aiResult && (
          <div className="mt-6 space-y-4 border-t border-slate-200/20 pt-5">
            <div className="text-xs font-semibold text-blue-500">
              Google-Grounded Web Briefing · {aiResult.query}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResult.summary}</p>
            <div className="divide-y divide-slate-200/20">
              {aiResult.results?.map((item, idx) => (
                <div key={idx} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs font-mono text-emerald-500 truncate mt-0.5">{item.url}</div>
                    <p className="text-xs opacity-80 mt-0.5">{item.snippet}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onFetchUrl(item.url)}
                      className="px-3 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold"
                    >
                      Open in FINE
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600"
                      aria-label={`Open ${item.title} externally`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bookmarks, Downloads, Extensions & Offline Saved Pages */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-[#3A86EF]" />
            Bookmarks & History
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="py-2 flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={() => {
                    if (bm.url.startsWith('http')) onFetchUrl(bm.url);
                  }}
                  className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left hover:text-[#3A86EF]"
                >
                  <span className="font-semibold truncate">{bm.title}</span>
                  <span className="text-[#3A86EF] font-mono truncate max-w-[110px]">{bm.url}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveBookmark(bm.id)}
                  aria-label={`Remove bookmark ${bm.title}`}
                  className="text-slate-400 hover:text-[#E63946] shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {history.slice(0, 3).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  if (h.url.startsWith('http')) onFetchUrl(h.url);
                }}
                className="w-full py-2 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded"
              >
                <span className="text-slate-500 truncate">{h.title}</span>
                <span className="text-[#2DC653] font-semibold shrink-0">{h.verdict}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-[#3A86EF]" />
            Download Manager
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {downloads.map((d) => (
              <div key={d.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{d.fileName}</div>
                  <div className="text-slate-500">{d.size} · {d.status}</div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerDownloadSave(d)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold text-[#3A86EF] shrink-0"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
              <Puzzle className="w-4 h-4 text-[#3A86EF]" />
              Extensions & Offline Pages
            </h2>
            <div className="space-y-1.5 text-xs">
              {extensions.map((ext) => (
                <div key={ext.id} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{ext.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExtensions((prev) =>
                        prev.map((x) => (x.id === ext.id ? { ...x, enabled: !x.enabled } : x))
                      )
                    }
                    className={`font-semibold ${ext.enabled ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {ext.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-500 mb-1.5">Recently Saved Offline</div>
            {savedPages.length === 0 ? (
              <div className="text-xs text-slate-400">Open any page and click Save Offline to store a copy in FINE Explorer.</div>
            ) : (
              <ul className="text-xs space-y-1">
                {savedPages.slice(0, 4).map((pg, idx) => (
                  <li key={idx} className="truncate">• {pg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Floating Video Pop-Out Mini-Player */}
      {popOutVideo && (
        <div className="fixed bottom-16 right-5 z-40 w-80 bg-[#0B132B] text-white border border-blue-400/40 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-3.5 py-2 flex items-center justify-between bg-white/10 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5">
              <PictureInPicture2 className="w-3.5 h-3.5 text-[#3A86EF]" />
              FINE Floating Video Pop-Out
            </span>
            <button type="button" onClick={() => setPopOutVideo(false)} className="text-blue-200 hover:text-white">
              Close
            </button>
          </div>
          <div className="p-3 space-y-2 text-xs">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-[#122452] to-[#3A86EF] flex flex-col items-center justify-center p-3 text-center">
              <div className="font-bold">Picture-in-Picture Player Active</div>
              <div className="text-[11px] text-blue-100 mt-1">
                Remains docked while browsing tabs or editing FINE Office documents.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. FINE AI — 4 Brains Built Into OS (Fast, Think, Creative, Pro) + History + Urdu
// ============================================================================
interface ProviderInfo {
  id: AiProviderId;
  label: string;
  available: boolean;
  status: string;
}

interface AiChatTurn {
  role: 'user' | 'assistant';
  text: string;
  providerLabel?: string;
  sources?: Array<{ title: string; url: string }>;
}

interface FineAiViewProps {
  telemetry?: SystemTelemetry | null;
  accountNumber?: string;
  onOpenUrl?: (url: string) => void;
}

const DEFAULT_PROVIDERS: ProviderInfo[] = [
  { id: 'auto', label: 'FINE OS Unified', available: true, status: 'Connected (Gemini Core)' },
  { id: 'gemini', label: 'Google Gemini', available: true, status: 'Checking...' },
  { id: 'chatgpt', label: 'ChatGPT', available: false, status: 'Checking...' },
  { id: 'deepseek', label: 'DeepSeek', available: false, status: 'Checking...' },
  { id: 'meta', label: 'Meta AI', available: false, status: 'Checking...' },
  { id: 'local', label: 'FINE Local AI', available: true, status: 'Ready Offline' },
];

const FOUR_BRAINS: Array<{ id: FineAiBrain; name: string; badge: string; desc: string }> = [
  { id: 'fast', name: 'Fine Fast', badge: 'Quick · Meta AI', desc: 'Instant everyday Q&A' },
  { id: 'think', name: 'Fine Think', badge: 'DeepSeek Logic', desc: 'Code, math & debugging' },
  { id: 'creative', name: 'Fine Creative', badge: 'Gemini Studio', desc: 'Stories, design & scripts' },
  { id: 'pro', name: 'Fine Pro', badge: 'ChatGPT Pro', desc: 'Reports & business plans' },
];

export const FineAiView: React.FC<FineAiViewProps> = ({ telemetry, accountNumber = 'Guest', onOpenUrl }) => {
  const [providers, setProviders] = useState<ProviderInfo[]>(DEFAULT_PROVIDERS);
  const [provider, setProvider] = useState<AiProviderId>('auto');
  const [brain, setBrain] = useState<FineAiBrain>('fast');
  const [language, setLanguage] = useState<'Auto' | 'English' | 'Urdu'>('Auto');
  const [mode, setMode] = useState<'assistant' | 'research' | 'coding' | 'translate' | 'office' | 'diagnose'>('assistant');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiHistory, setAiHistory] = useState<FineAiHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [turns, setTurns] = useState<AiChatTurn[]>([
    {
      role: 'assistant',
      providerLabel: 'FINE AI (4 Brains Ready)',
      text: 'Assalam-o-Alaikum & Welcome to FINE AI. Choose any of the 4 OS Brains above (Fine Fast, Fine Think, Fine Creative, Fine Pro), speak in English or Urdu, or enable Research Mode for live Google Search grounding.',
    },
  ]);

  useEffect(() => {
    fetch('/api/ai/providers')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.providers)) setProviders(d.providers);
      })
      .catch(() => {});
  }, []);

  const loadAiHistory = () => {
    fetch('/api/ai/history')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history)) setAiHistory(d.history);
      })
      .catch(() => {});
  };

  const speakText = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.slice(0, 500));
      u.lang = /[\u0600-\u06FF]/.test(text) || language === 'Urdu' ? 'ur-PK' : 'en-US';
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  const triggerVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) return;
    try {
      const rec = new SpeechRec() as {
        lang: string;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
      };
      rec.lang = language === 'Urdu' ? 'ur-PK' : 'en-US';
      setListening(true);
      rec.onresult = (ev) => {
        const text = ev.results?.[0]?.[0]?.transcript || '';
        if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const submitPrompt = async (promptText: string, overrideMode?: typeof mode, overrideBrain?: FineAiBrain) => {
    const trimmed = promptText.trim();
    if (!trimmed || streaming) return;
    const activeMode = overrideMode || mode;
    const activeBrain = overrideBrain || brain;
    if (overrideMode) setMode(overrideMode);
    if (overrideBrain) setBrain(overrideBrain);

    let contextualPrompt = trimmed;
    if (activeMode === 'diagnose' && telemetry) {
      contextualPrompt += `\n\n[Live Computer Telemetry: OS=${telemetry.platform} ${telemetry.arch}, CPU=${telemetry.cpuModel} (${telemetry.cpuCores} cores), RAM=${telemetry.memUsedGb}/${telemetry.memTotalGb} GB, Disk=${telemetry.diskUsedGb ?? '?'}/${telemetry.diskTotalGb ?? '?'} GB]`;
    }

    const userVisibleTurn: AiChatTurn = { role: 'user', text: trimmed };
    const apiMessages = [...turns, { role: 'user', text: contextualPrompt }];

    setTurns((prev) => [
      ...prev,
      userVisibleTurn,
      { role: 'assistant', providerLabel: `FINE ${activeBrain.toUpperCase()} (Thinking...)`, text: '' },
    ]);
    setInput('');
    setStreaming(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: activeMode,
          provider,
          brain: activeBrain,
          language,
          accountNumber,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'AI provider returned an error.');
        setTurns((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.error) setError(payload.error);
            if (payload.chunk || payload.done) {
              setTurns((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    providerLabel: payload.providerUsed || updated[lastIdx].providerLabel,
                    text: updated[lastIdx].text + (payload.chunk || ''),
                    sources: Array.isArray(payload.sources) && payload.sources.length ? payload.sources : updated[lastIdx].sources,
                  };
                }
                return updated;
              });
            }
          } catch {
            // partial
          }
        }
      }
    } catch {
      setError('Network error communicating with FINE AI server.');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col min-h-[660px]">
      {/* Top 4 Brains + Provider Switcher */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3A86EF]" />
            <h1 className="text-sm font-bold">FINE AI — 4 OS Brains</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'Auto' | 'English' | 'Urdu')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
              aria-label="AI Reply Language"
            >
              <option value="Auto">Lang: Auto (Eng/Urdu)</option>
              <option value="English">Lang: English</option>
              <option value="Urdu">Lang: Urdu (اردو)</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const next = !showHistory;
                setShowHistory(next);
                if (next) loadAiHistory();
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5 text-[#3A86EF]" />
              {showHistory ? 'Back to Chat' : 'AI History'}
            </button>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
              aria-label="AI Engine Connector"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.available ? 'Ready' : 'Secret Needed'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Brains Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FOUR_BRAINS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBrain(b.id)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-colors ${
                brain === b.id
                  ? 'border-[#3A86EF] bg-[#edf3ff] dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                <span className="text-[10px] font-mono text-[#3A86EF]">{b.badge}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">{b.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            {(['assistant', 'research', 'office', 'coding', 'translate', 'diagnose'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md font-semibold capitalize ${
                  mode === m ? 'bg-[#0B132B] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m === 'research' ? 'Research (Web)' : m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTurns([turns[0]])}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 p-5 overflow-y-auto space-y-3">
          <h2 className="text-sm font-bold">Persisted fine_ai_history ({aiHistory.length})</h2>
          {aiHistory.length === 0 ? (
            <div className="text-xs text-slate-500 py-10 text-center">
              Ask any question in FINE AI to see your saved prompt & response history here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {aiHistory.map((item) => (
                <div key={item.history_id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-[#3A86EF] uppercase">{item.brain} · {item.model_used}</span>
                    <span className="font-mono tabular-nums">{item.timestamp.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <div className="font-semibold">{item.prompt}</div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3">{item.ai_answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {turns.length === 1 && (
            <div className="grid sm:grid-cols-2 gap-2 pb-2">
              {[
                { label: 'Explain FINE OS features in simple Urdu (اردو)', mode: 'translate' as const, b: 'fast' as FineAiBrain },
                { label: 'Solve a TypeScript async queue bug step by step', mode: 'coding' as const, b: 'think' as FineAiBrain },
                { label: 'Write an inspiring 4-slide keynote story & outline', mode: 'office' as const, b: 'creative' as FineAiBrain },
                { label: 'Diagnose my current computer hardware & RAM', mode: 'diagnose' as const, b: 'pro' as FineAiBrain },
              ].map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  onClick={() => submitPrompt(qp.label, qp.mode, qp.b)}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 text-xs"
                >
                  <div className="font-semibold">{qp.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    Brain: Fine {qp.b} · Mode: {qp.mode}
                  </div>
                </button>
              ))}
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
              {t.providerLabel && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">{t.providerLabel}</span>
                  {t.role === 'assistant' && t.text && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(t.text).catch(() => {});
                          setCopiedIdx(i);
                          setTimeout(() => setCopiedIdx(null), 1500);
                        }}
                        className="text-[11px] text-slate-400 hover:text-[#3A86EF] inline-flex items-center gap-0.5"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedIdx === i ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => speakText(t.text)}
                        className="text-[11px] text-slate-400 hover:text-[#3A86EF] inline-flex items-center gap-0.5"
                      >
                        <Volume2 className="w-3 h-3" />
                        Speak
                      </button>
                    </>
                  )}
                </div>
              )}
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  t.role === 'user'
                    ? 'bg-[#3A86EF] text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t.text || (streaming && i === turns.length - 1 ? 'Thinking...' : '')}
                {t.sources && t.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] font-bold">Live Web Sources:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.sources.map((src, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => onOpenUrl?.(src.url)}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-[#3A86EF] truncate max-w-[260px]"
                        >
                          {src.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">{error}</div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitPrompt(input);
        }}
        className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2"
      >
        <button
          type="button"
          onClick={triggerVoiceInput}
          title="Hey Fine Voice Input"
          className={`p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 ${
            listening ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Fine ${brain.toUpperCase()} (${language})...`}
          className="flex-1 min-w-0 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={streaming}
          className="px-4 py-2 rounded-lg bg-[#0B132B] hover:bg-[#1a3970] text-white text-xs font-semibold whitespace-nowrap"
        >
          {streaming ? 'Streaming...' : 'Send Prompt'}
        </button>
      </form>
    </div>
  );
};

// ============================================================================
// 3. FINE Software Centre View (Install, Update, Repair, Permissions, Backup)
// ============================================================================
interface FineSoftwareCenterProps {
  packages: SoftwarePackage[];
  onToggleInstall: (id: string) => void;
  onBackupInstaller: (pkg: SoftwarePackage) => void;
}

export const FineSoftwareCenterView: React.FC<FineSoftwareCenterProps> = ({
  packages,
  onToggleInstall,
  onBackupInstaller,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'All' | SoftwarePackage['platform']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmPkg, setConfirmPkg] = useState<SoftwarePackage | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filtered = packages.filter((p) => {
    const matchesPlatform = platformFilter === 'All' || p.platform === platformFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.format.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">FINE Software Store</h1>
            <p className="text-xs text-slate-500 mt-1">
              Install signed offline packages, verify digital signatures, repair installations, and backup installers.
            </p>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search software or format (MSI, DEB, APK)..."
            className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent outline-none w-64"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
          {(['All', 'Windows', 'Linux', 'Android', 'Web', 'Archive'] as const).map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setPlatformFilter(plat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                platformFilter === plat ? 'bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-xs font-medium">
          {actionNotice}
        </div>
      )}

      {confirmPkg && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Verify Signature & Permissions — {confirmPkg.name} ({confirmPkg.format})
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Publisher: {confirmPkg.publisher} · Permissions: {confirmPkg.permissions.join(', ')} · SHA-256: {confirmPkg.sha256Short}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmPkg(null)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleInstall(confirmPkg.id);
                setConfirmPkg(null);
              }}
              className="px-4 py-2 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold"
            >
              Approve & Install
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pkg) => (
          <div key={pkg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#edf3ff] text-[#3A86EF] flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {pkg.platform} · {pkg.format}
                </span>
              </div>

              <h2 className="text-sm font-bold mt-3">{pkg.name}</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                {pkg.publisher} · v{pkg.version} · {pkg.size}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{pkg.summary}</p>
              <div className="text-[11px] text-slate-400 mt-2">
                Permissions: {pkg.permissions.join(' · ')}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Signed
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onBackupInstaller(pkg);
                    setActionNotice(`Backed up installer "${pkg.name}" to Backup Vault.`);
                  }}
                  title="Backup installer"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {pkg.installed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionNotice(`Verified and repaired "${pkg.name}" manifest & permissions.`)}
                      title="Repair installation"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionNotice(`"${pkg.name}" verified at latest release v${pkg.version}.`)}
                      title="Check update"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleInstall(pkg.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmPkg(pkg)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#1a3970] text-white text-xs font-semibold"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. FINE Explorer (Windows 7 File System, Folders, Color Tags, Vault & Recycle Bin)
// ============================================================================
interface FineFilesViewProps {
  files: FileNode[];
  usbMounted?: boolean;
  onCreateBackup: () => void;
  onAddFile: (file: FileNode) => void;
  onUpdateFiles: (updater: (prev: FileNode[]) => FileNode[]) => void;
  onDeleteFile: (id: string) => void;
  onOpenOffice: (file?: FileNode) => void;
  onExportWorkspaceArchive: () => void;
  onImportWorkspaceArchive: (jsonText: string) => void;
}

const EXPLORER_TREE: Array<{ id: 'All' | ExplorerFolderLocation | 'Recycle Bin'; label: string }> = [
  { id: 'All', label: 'Quick Access (All)' },
  { id: 'Desktop', label: 'Desktop' },
  { id: 'Downloads', label: 'Downloads' },
  { id: 'Documents', label: 'Documents' },
  { id: 'Pictures', label: 'Pictures' },
  { id: 'Music', label: 'Music' },
  { id: 'Videos', label: 'Videos' },
  { id: 'Fine Drive', label: 'Fine Drive (Cloud)' },
  { id: 'Local Disk (C:)', label: 'Local Disk (C:)' },
  { id: 'Local Disk (D:)', label: 'Local Disk (D:)' },
  { id: 'USB Drive', label: 'USB Drive' },
  { id: 'Recycle Bin', label: 'Fine Bin (Recycle)' },
];

export const FineFilesView: React.FC<FineFilesViewProps> = ({
  files,
  usbMounted = false,
  onCreateBackup,
  onAddFile,
  onUpdateFiles,
  onOpenOffice,
  onExportWorkspaceArchive,
  onImportWorkspaceArchive,
}) => {
  const [treeLocation, setTreeLocation] = useState<'All' | ExplorerFolderLocation | 'Recycle Bin'>('All');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(files[0] ?? null);
  const [newFolderPrompt, setNewFolderPrompt] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [clipboard, setClipboard] = useState<{ mode: 'copy' | 'cut'; file: FileNode } | null>(null);
  const [unlockedVaultIds, setUnlockedVaultIds] = useState<Set<string>>(new Set());
  const [vaultPinChallenge, setVaultPinChallenge] = useState<{ fileId: string; pin: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null);

  const visibleFiles = files.filter((f) => {
    if (treeLocation === 'Recycle Bin') {
      return Boolean(f.deleted);
    }
    if (f.deleted) return false;
    if (currentFolder) {
      return f.parentFolder === currentFolder;
    }
    const matchesLoc = treeLocation === 'All' || f.location === treeLocation;
    const matchesQ = !searchText.trim() || f.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesLoc && matchesQ;
  });

  const handleUploadLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let content = '';
    if (file.type.startsWith('image/')) {
      content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
    } else {
      content = await file.text().catch(() => '');
    }

    const kind: FileNode['kind'] = file.name.endsWith('.pdf')
      ? 'pdf'
      : /\.(csv|xlsx)$/i.test(file.name)
        ? 'spreadsheet'
        : /\.(ppt|pptx)$/i.test(file.name)
          ? 'presentation'
          : /\.(png|jpg|jpeg|svg)$/i.test(file.name)
            ? 'design'
            : /\.(finebak|zip|7z)$/i.test(file.name)
              ? 'backup'
              : 'document';

    const targetLoc: ExplorerFolderLocation =
      treeLocation !== 'All' && treeLocation !== 'Recycle Bin' ? treeLocation : 'Documents';

    const newNode: FileNode = {
      id: `up-${Date.now()}`,
      name: file.name,
      kind,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      modified: new Date().toISOString().slice(0, 10),
      location: targetLoc,
      parentFolder: currentFolder || undefined,
      protectedFolder: true,
      content,
    };
    onAddFile(newNode);
    setSelectedFile(newNode);
    e.target.value = '';
  };

  const createFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const targetLoc: ExplorerFolderLocation =
      treeLocation !== 'All' && treeLocation !== 'Recycle Bin' ? treeLocation : 'Documents';
    onAddFile({
      id: `fld-${Date.now()}`,
      name: newFolderName.trim(),
      kind: 'folder',
      size: '0 items',
      modified: new Date().toISOString().slice(0, 10),
      location: targetLoc,
      parentFolder: currentFolder || undefined,
      colorTag: 'blue',
      protectedFolder: true,
    });
    setNewFolderName('');
    setNewFolderPrompt(false);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const targetLoc: ExplorerFolderLocation =
      treeLocation !== 'All' && treeLocation !== 'Recycle Bin' ? treeLocation : 'Documents';
    if (clipboard.mode === 'cut') {
      onUpdateFiles((prev) =>
        prev.map((f) =>
          f.id === clipboard.file.id
            ? { ...f, location: targetLoc, parentFolder: currentFolder || undefined }
            : f
        )
      );
      setClipboard(null);
    } else {
      onAddFile({
        ...clipboard.file,
        id: `copy-${Date.now()}`,
        name: `${clipboard.file.name.replace(/(\.[^.]+)?$/, '')} - Copy`,
        location: targetLoc,
        parentFolder: currentFolder || undefined,
        modified: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const moveToRecycleBin = (id: string) => {
    onUpdateFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, deleted: true, deletedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), originalLocation: f.location }
          : f
      )
    );
    if (selectedFile?.id === id) setSelectedFile(null);
  };

  const restoreFromBin = (id: string) => {
    onUpdateFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, deleted: false, deletedAt: undefined } : f))
    );
  };

  const permanentlyDelete = (id: string) => {
    onUpdateFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
  };

  const downloadFileNode = (f: FileNode) => {
    if (f.content?.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = f.content;
      a.download = f.name;
      a.click();
      return;
    }
    const blob = new Blob([f.content || `FINE Explorer Item: ${f.name}\nLocation: ${f.location}\n`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openFileItem = (f: FileNode) => {
    if (f.lockedWithPin && !unlockedVaultIds.has(f.id)) {
      setVaultPinChallenge({ fileId: f.id, pin: '' });
      return;
    }
    if (f.kind === 'folder') {
      setCurrentFolder(f.name);
      return;
    }
    setSelectedFile(f);
  };

  const tagDotColor = (tag?: FileNode['colorTag']) =>
    tag === 'red'
      ? 'bg-rose-500'
      : tag === 'green'
        ? 'bg-emerald-500'
        : tag === 'yellow'
          ? 'bg-amber-400'
          : tag === 'blue'
            ? 'bg-blue-500'
            : '';

  return (
    <div className="space-y-4" onClick={() => setContextMenu(null)}>
      {/* Top Explorer Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-5 h-5 text-[#3A86EF]" />
          <div>
            <h1 className="text-base font-bold">FINE Explorer</h1>
            <p className="text-xs text-slate-500 font-mono">
              This PC &gt; {treeLocation}
              {currentFolder ? ` > ${currentFolder}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search files..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent w-40"
          />

          <button
            type="button"
            onClick={() => setNewFolderPrompt((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#3A86EF]" />
            + New Folder
          </button>

          {clipboard && (
            <button
              type="button"
              onClick={handlePaste}
              className="px-3 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold inline-flex items-center gap-1"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste ({clipboard.file.name.slice(0, 12)})
            </button>
          )}

          <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Upload
            <input type="file" onChange={handleUploadLocalFile} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              onCreateBackup();
              onExportWorkspaceArchive();
            }}
            className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-white text-xs font-semibold"
          >
            Export .finebak
          </button>

          <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#3A86EF] cursor-pointer">
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

      {newFolderPrompt && (
        <form onSubmit={createFolder} className="bg-white dark:bg-slate-900 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name..."
            className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
          />
          <button type="submit" className="px-3.5 py-1.5 rounded bg-[#3A86EF] text-white font-semibold">
            Create Folder
          </button>
        </form>
      )}

      {vaultPinChallenge && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
          <span className="font-semibold flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            Fine Vault: Enter 4-digit PIN to unlock folder/file (Demo PIN: 1234)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={vaultPinChallenge.pin}
              onChange={(e) => setVaultPinChallenge({ ...vaultPinChallenge, pin: e.target.value })}
              className="px-2.5 py-1 rounded border border-amber-300 bg-white font-mono w-28"
            />
            <button
              type="button"
              onClick={() => {
                if (vaultPinChallenge.pin.length >= 4) {
                  setUnlockedVaultIds((prev) => new Set(prev).add(vaultPinChallenge.fileId));
                  const found = files.find((f) => f.id === vaultPinChallenge.fileId);
                  if (found?.kind === 'folder') setCurrentFolder(found.name);
                  else if (found) setSelectedFile(found);
                  setVaultPinChallenge(null);
                }
              }}
              className="px-3 py-1 rounded bg-[#0B132B] text-white font-semibold"
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[210px_1fr_300px] gap-4 items-start">
        {/* Left Windows 7 Navigation Tree */}
        <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-0.5 text-xs">
          {EXPLORER_TREE.map((node) => {
            if (node.id === 'USB Drive' && !usbMounted && !files.some((f) => f.location === 'USB Drive')) {
              return null;
            }
            const binCount = node.id === 'Recycle Bin' ? files.filter((f) => f.deleted).length : 0;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setTreeLocation(node.id);
                  setCurrentFolder(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium ${
                  treeLocation === node.id && !currentFolder
                    ? 'bg-[#edf3ff] dark:bg-blue-950/50 text-[#1d4f9c] dark:text-blue-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  {node.id === 'USB Drive' ? (
                    <Usb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : node.id === 'Recycle Bin' ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : node.id.includes('Disk') ? (
                    <HardDrive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-[#3A86EF] shrink-0" />
                  )}
                  <span className="truncate">{node.label}</span>
                </span>
                {binCount > 0 && <span className="font-mono text-[11px] text-rose-600">{binCount}</span>}
              </button>
            );
          })}
        </aside>

        {/* File & Folder Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {currentFolder && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-semibold">Inside Folder: {currentFolder}</span>
              <button
                type="button"
                onClick={() => setCurrentFolder(null)}
                className="text-[#3A86EF] font-semibold hover:underline"
              >
                Up to Parent
              </button>
            </div>
          )}

          {treeLocation === 'Recycle Bin' && visibleFiles.length > 0 && (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-700">Fine Bin (Recycle Bin)</span>
              <button
                type="button"
                onClick={() => onUpdateFiles((prev) => prev.filter((f) => !f.deleted))}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
              >
                Empty Recycle Bin
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Name (Right-click for menu)</th>
                  <th className="py-2.5 px-3 font-semibold">Location</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Size</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {visibleFiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      This folder is empty.
                    </td>
                  </tr>
                ) : (
                  visibleFiles.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedFile(f)}
                      onDoubleClick={() => openFileItem(f)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, file: f });
                      }}
                      className={`cursor-pointer ${
                        selectedFile?.id === f.id ? 'bg-[#f5f8ff] dark:bg-blue-950/30' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium">
                        {renamingId === f.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              onUpdateFiles((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, name: renameValue.trim() || x.name } : x))
                              );
                              setRenamingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="px-2 py-0.5 rounded border border-blue-400 bg-white dark:bg-slate-950 text-xs"
                              autoFocus
                            />
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            {f.colorTag && <span className={`w-2 h-2 rounded-full shrink-0 ${tagDotColor(f.colorTag)}`} />}
                            {f.kind === 'folder' ? (
                              <Folder className="w-4 h-4 text-[#3A86EF] shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{f.name}</span>
                            {f.lockedWithPin && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{f.location}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{f.size}</td>
                      <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {f.deleted ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => restoreFromBin(f.id)}
                              className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 font-semibold inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => permanentlyDelete(f.id)}
                              className="p-1 rounded border border-rose-200 text-rose-700"
                              aria-label="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openFileItem(f)}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => moveToRecycleBin(f.id)}
                              aria-label={`Move ${f.name} to Bin`}
                              className="p-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* File Inspector & Tag / Vault Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          {selectedFile ? (
            <>
              <div className="flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-[#3A86EF] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold break-words">{selectedFile.name}</h2>
                  <p className="text-xs text-slate-500">
                    {selectedFile.location} · {selectedFile.size} · {selectedFile.modified}
                  </p>
                </div>
              </div>

              {/* Folder / File Color Tag */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Color Tag:</span>
                <div className="flex items-center gap-1.5">
                  {(['red', 'green', 'blue', 'yellow'] as const).map((col) => (
                    <button
                      key={col}
                      type="button"
                      aria-label={`Tag ${col}`}
                      onClick={() =>
                        onUpdateFiles((prev) =>
                          prev.map((x) => (x.id === selectedFile.id ? { ...x, colorTag: col } : x))
                        )
                      }
                      className={`w-4 h-4 rounded-full ${tagDotColor(col)} ${
                        selectedFile.colorTag === col ? 'ring-2 ring-offset-1 ring-slate-800' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {selectedFile.content?.startsWith('data:image/') ? (
                <img
                  src={selectedFile.content}
                  alt={selectedFile.name}
                  className="w-full rounded-lg border border-slate-200 max-h-48 object-contain bg-slate-50"
                />
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {selectedFile.lockedWithPin && !unlockedVaultIds.has(selectedFile.id)
                      ? 'Encrypted inside Fine Vault. Double-click or unlock with PIN.'
                      : selectedFile.content || 'Workspace item tracked in FINE Explorer.'}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {selectedFile.kind !== 'folder' && (
                  <button
                    type="button"
                    onClick={() => onOpenOffice(selectedFile)}
                    className="py-2 px-3 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold"
                  >
                    Open in Office
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadFileNode(selectedFile)}
                  className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFiles((prev) =>
                      prev.map((x) => (x.id === selectedFile.id ? { ...x, lockedWithPin: !x.lockedWithPin } : x))
                    )
                  }
                  className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1"
                >
                  {selectedFile.lockedWithPin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {selectedFile.lockedWithPin ? 'Unlock Vault' : 'PIN Lock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(selectedFile.id);
                    setRenameValue(selectedFile.name);
                  }}
                  className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Rename
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">Select or right-click any file/folder.</div>
          )}
        </div>
      </div>

      {/* Right-Click Explorer Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 text-xs"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 240), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              openFileItem(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => {
              setClipboard({ mode: 'copy', file: contextMenu.file });
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button
            type="button"
            onClick={() => {
              setClipboard({ mode: 'cut', file: contextMenu.file });
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Scissors className="w-3.5 h-3.5" /> Cut
          </button>
          <button
            type="button"
            onClick={() => {
              setRenamingId(contextMenu.file.id);
              setRenameValue(contextMenu.file.name);
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5" /> Rename
          </button>
          <button
            type="button"
            onClick={() => {
              moveToRecycleBin(contextMenu.file.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Send to Fine Bin
          </button>
        </div>
      )}
    </div>
  );
};
