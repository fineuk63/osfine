import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Home,
  Globe,
  Sparkles,
  MessageSquare,
  Mail,
  Users,
  Package,
  FileText,
  FolderOpen,
  Film,
  Cpu,
  Printer,
  ShieldCheck,
  Wrench,
  Settings,
  Crosshair,
  Plus,
  X,
  Lock,
  Menu,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  LayoutGrid,
  Power,
  CreditCard,
  Database,
  Activity,
  Columns,
  Bell,
  Mic,
  Moon,
  RotateCcw,
  FolderPlus,
  RefreshCw,
  Palette,
} from 'lucide-react';
import {
  ArenaBeamEvent,
  ArenaPlayerState,
  BookmarkItem,
  BrowserTab,
  ChatMessage,
  ConnectedBrowser,
  ContactEntry,
  DownloadItem,
  FetchedWebPage,
  FileNode,
  FineAccount,
  FineEdition,
  FineModuleId,
  FineTheme,
  FineVaultSecret,
  HistoryEntry,
  MailMessage,
  PrintJob,
  QuarantineItem,
  SecurityLayerStatus,
  SoftwarePackage,
  SystemTelemetry,
  VirtualDesktopId,
} from './types/fine';
import {
  INITIAL_BOOKMARKS,
  INITIAL_CONTACTS,
  INITIAL_DOWNLOADS,
  INITIAL_FILES,
  INITIAL_MAIL,
  INITIAL_PRINT_JOBS,
  INITIAL_QUARANTINE,
  INITIAL_SECURITY_LAYERS,
  INITIAL_SOFTWARE_PACKAGES,
} from './data/fineCatalog';
import { FineDashboardHome } from './components/FineDashboardHome';
import { FineLaserTagArena } from './components/FineLaserTagArena';
import { FineSecurityCenter } from './components/FineSecurityCenter';
import { FineCommunicationView, IncomingRtcSignal } from './components/FineCommunicationView';
import { FineBootOverlay } from './components/FineBootEnvironment';
import { FineOfficeSuite, OfficeAppId } from './components/FineOfficeSuite';
import {
  FineDevicesView,
  FineMediaView,
  FinePrintView,
  FineRecoveryView,
  FineSettingsView,
} from './components/FineSystemModules';
import {
  FineAiView,
  FineBrowserSearchView,
  FineFilesView,
  FineSoftwareCenterView,
} from './components/FineWorkspaceTools';
import {
  FineAtmView,
  FineDbStudioView,
  FineTaskManagerView,
} from './components/FineAtmAndDatabaseView';

const SIDEBAR_ITEMS: Array<{
  id: FineModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'home', label: 'Desktop Home', icon: Home },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'ai', label: 'FINE AI', icon: Sparkles },
  { id: 'messages', label: 'FINE Chat', icon: MessageSquare },
  { id: 'mail', label: 'FINE Mail', icon: Mail },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'office', label: 'Office & Notes', icon: FileText },
  { id: 'files', label: 'Explorer', icon: FolderOpen },
  { id: 'software', label: 'App Store', icon: Package },
  { id: 'atm', label: 'ATM Mode', icon: CreditCard },
  { id: 'finedb', label: 'FineDB Studio', icon: Database },
  { id: 'taskmgr', label: 'Task Manager', icon: Activity },
  { id: 'media', label: 'Media', icon: Film },
  { id: 'devices', label: 'Control Panel', icon: Cpu },
  { id: 'print', label: 'Print', icon: Printer },
  { id: 'security', label: 'Security & IP', icon: ShieldCheck },
  { id: 'recovery', label: 'Recovery', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'arena', label: 'Laser Tag', icon: Crosshair },
];

const MODULE_META: Record<FineModuleId, { title: string; url: string; letter: string }> = {
  home: { title: 'FINE OS — Desktop', url: 'fine://home', letter: 'F' },
  browser: { title: 'FINE Browser', url: 'fine://browser', letter: 'B' },
  ai: { title: 'FINE AI (4 Brains)', url: 'fine://ai', letter: 'A' },
  messages: { title: 'FINE Chat', url: 'fine://messages', letter: 'M' },
  mail: { title: 'FINE Mail', url: 'fine://email', letter: 'E' },
  contacts: { title: 'FINE Contacts', url: 'fine://contacts', letter: 'C' },
  software: { title: 'FINE Store', url: 'fine://software', letter: 'S' },
  office: { title: 'FINE Office', url: 'fine://office', letter: 'O' },
  files: { title: 'FINE Explorer', url: 'fine://files', letter: 'F' },
  media: { title: 'FINE Media', url: 'fine://media', letter: 'M' },
  devices: { title: 'Control Panel', url: 'fine://devices', letter: 'D' },
  print: { title: 'FINE Print', url: 'fine://print', letter: 'P' },
  security: { title: 'Security & IP Shield', url: 'fine://security', letter: 'S' },
  recovery: { title: 'FINE Recovery', url: 'fine://recovery', letter: 'R' },
  settings: { title: 'FINE Settings', url: 'fine://settings', letter: 'S' },
  arena: { title: 'FINE Laser Tag', url: 'fine://arena', letter: 'L' },
  atm: { title: 'FINE ATM Terminal', url: 'fine://atm', letter: 'A' },
  finedb: { title: 'FineDB Studio', url: 'fine://finedb', letter: 'D' },
  taskmgr: { title: 'Task Manager', url: 'fine://taskmgr', letter: 'T' },
};

export default function App() {
  const [edition, setEdition] = useState<FineEdition>('Home');
  const [theme, setTheme] = useState<FineTheme>('light');
  const [brightness, setBrightness] = useState(100);
  const [soundVolume, setSoundVolume] = useState(80);
  const [nightLight, setNightLight] = useState(false);
  const [virtualDesktop, setVirtualDesktop] = useState<VirtualDesktopId>('Work');
  const [splitScreenModule, setSplitScreenModule] = useState<FineModuleId | null>(null);
  const [usbMounted, setUsbMounted] = useState(false);

  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-home',
      title: 'FINE OS — Desktop',
      url: 'fine://home',
      module: 'home',
      faviconLetter: 'F',
      desktop: 'Work',
      isPinned: true,
      isProtected: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-home');
  const [addressInput, setAddressInput] = useState('fine://home');
  const [searchQuery, setSearchQuery] = useState('');
  const [officeApp, setOfficeApp] = useState<OfficeAppId>('writer');
  const [activeOfficeFile, setActiveOfficeFile] = useState<FileNode | null>(null);
  const [commSection, setCommSection] = useState<'messages' | 'mail' | 'calls' | 'contacts' | 'account'>('messages');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [desktopContextMenu, setDesktopContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [heyFineListening, setHeyFineListening] = useState(false);

  const [offlineMode, setOfflineMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [systemMuted, setSystemMuted] = useState(false);
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [dateText, setDateText] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [toast, setToast] = useState<string | null>(null);

  const [account, setAccount] = useState<FineAccount | null>(() => {
    try {
      const saved = localStorage.getItem('fine_account_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [autoStartOnBoot, setAutoStartOnBoot] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fine_autostart_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [bootOverlayMode, setBootOverlayMode] = useState<'boot' | 'lock' | 'sleep' | 'shutdown' | 'recovery' | null>(() => {
    try {
      const saved = localStorage.getItem('fine_autostart_v1');
      return saved === 'false' ? null : 'boot';
    } catch {
      return 'boot';
    }
  });

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(INITIAL_BOOKMARKS);
  const [downloads, setDownloads] = useState<DownloadItem[]>(INITIAL_DOWNLOADS);
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 'hist-1',
      title: 'FINE OS Desktop',
      url: 'fine://home',
      visitedAt: 'Just now',
      verdict: 'Safe',
    },
  ]);
  const [layers, setLayers] = useState<SecurityLayerStatus[]>(INITIAL_SECURITY_LAYERS);
  const [quarantine, setQuarantine] = useState<QuarantineItem[]>(INITIAL_QUARANTINE);
  const [securityEvents, setSecurityEvents] = useState<Array<{ timestamp: string; event: string }>>([
    { timestamp: new Date().toISOString(), event: 'FINE OS Security Core initialized.' },
  ]);
  const [lastScanTime, setLastScanTime] = useState<string>('Verified today');
  const [packages, setPackages] = useState<SoftwarePackage[]>(INITIAL_SOFTWARE_PACKAGES);
  const [mails, setMails] = useState<MailMessage[]>(INITIAL_MAIL);
  const [contacts, setContacts] = useState<ContactEntry[]>(INITIAL_CONTACTS);
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>(INITIAL_PRINT_JOBS);
  const [vaultSecrets, setVaultSecrets] = useState<FineVaultSecret[]>([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);

  // Live host telemetry & live webpage state
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [fetchedPage, setFetchedPage] = useState<FetchedWebPage | null>(null);
  const [fetchingPage, setFetchingPage] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Live WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [clientId, setClientId] = useState<string>('local-session');
  const [connectedBrowsers, setConnectedBrowsers] = useState<ConnectedBrowser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ clientId: string; name: string; channel: string }>>([]);
  const [arenaPlayers, setArenaPlayers] = useState<ArenaPlayerState[]>([]);
  const [arenaBeams, setArenaBeams] = useState<ArenaBeamEvent[]>([]);
  const [hitBanner, setHitBanner] = useState<string | null>(null);
  const [incomingRtcSignal, setIncomingRtcSignal] = useState<IncomingRtcSignal | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Apply Dark / Light Theme onto document root
  useEffect(() => {
    const isDark = theme === 'dark' || theme === 'neon';
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3400);
  }, []);

  const refreshTelemetry = useCallback(() => {
    fetch('/api/system/telemetry')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setTelemetry(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshTelemetry();
    const telTimer = window.setInterval(refreshTelemetry, 15000);

    fetch('/api/workspace')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          if (Array.isArray(d.mails) && d.mails.length > 0) setMails(d.mails);
          if (Array.isArray(d.contacts) && d.contacts.length > 0) setContacts(d.contacts);
          if (Array.isArray(d.files) && d.files.length > 0) setFiles(d.files);
          if (Array.isArray(d.downloads) && d.downloads.length > 0) setDownloads(d.downloads);
          if (Array.isArray(d.bookmarks) && d.bookmarks.length > 0) setBookmarks(d.bookmarks);
          if (Array.isArray(d.history) && d.history.length > 0) setHistory(d.history);
          if (Array.isArray(d.printJobs) && d.printJobs.length > 0) setPrintJobs(d.printJobs);
          if (Array.isArray(d.quarantine) && d.quarantine.length > 0) setQuarantine(d.quarantine);
          if (Array.isArray(d.securityLayers) && d.securityLayers.length > 0) setLayers(d.securityLayers);
          if (Array.isArray(d.securityEvents) && d.securityEvents.length > 0) setSecurityEvents(d.securityEvents);
          if (Array.isArray(d.vaultSecrets)) setVaultSecrets(d.vaultSecrets);
          if (typeof d.autoStartOnBoot === 'boolean') setAutoStartOnBoot(d.autoStartOnBoot);
          if (Array.isArray(d.installedPackageIds) && d.installedPackageIds.length > 0) {
            const setIds = new Set<string>(d.installedPackageIds);
            setPackages((prev) => prev.map((p) => ({ ...p, installed: setIds.has(p.id) })));
          }
        }
      })
      .catch(() => {})
      .finally(() => setWorkspaceReady(true));

    return () => clearInterval(telTimer);
  }, [refreshTelemetry]);

  useEffect(() => {
    if (!workspaceReady) return;
    const timer = window.setTimeout(() => {
      fetch('/api/workspace/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mails,
          contacts,
          files,
          downloads,
          bookmarks,
          history,
          printJobs,
          quarantine,
          securityLayers: layers,
          vaultSecrets,
          installedPackageIds: packages.filter((p) => p.installed).map((p) => p.id),
          autoStartOnBoot,
        }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [workspaceReady, mails, contacts, files, downloads, bookmarks, history, printJobs, quarantine, layers, packages, vaultSecrets, autoStartOnBoot]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date();
      setClockText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateText(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | undefined;

    function connect() {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'browser:presence',
            name: account?.name || 'FINE Explorer',
            accountNumber: account?.accountNumber || 'Guest',
            platform: `${edition} / ${navigator.platform || 'Desktop'}`,
            activeModule: activeTab.module,
            activeUrl: activeTab.url,
            inArena: activeTab.module === 'arena',
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            setClientId(data.clientId);
            setConnectedBrowsers(data.browsers || []);
            setMessages(data.messages || []);
            setArenaPlayers(data.arenaPlayers || []);
          } else if (data.type === 'network:browsers') {
            setConnectedBrowsers(data.browsers || []);
          } else if (data.type === 'chat:message' && data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message].slice(-120);
            });
          } else if (data.type === 'chat:update' && data.message) {
            setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)));
          } else if (data.type === 'chat:typing') {
            setTypingUsers((prev) => {
              const filtered = prev.filter((u) => u.clientId !== data.clientId);
              if (data.typing) {
                return [...filtered, { clientId: data.clientId, name: data.name, channel: data.channel }];
              }
              return filtered;
            });
          } else if (data.type === 'arena:state') {
            setArenaPlayers(data.players || []);
          } else if (data.type === 'arena:beam' && data.beam) {
            setArenaBeams((prev) => {
              if (prev.some((b) => b.id === data.beam.id)) return prev;
              return [...prev.slice(-24), data.beam];
            });
          } else if (data.type === 'arena:hit') {
            const label = data.eliminated
              ? `${data.shooterName} tagged out ${data.targetName}!`
              : `${data.shooterName} tagged ${data.targetName}`;
            setHitBanner(label);
            setTimeout(() => {
              setHitBanner((curr) => (curr === label ? null : curr));
            }, 2200);
          } else if (data.type === 'rtc:signal') {
            setIncomingRtcSignal({
              fromClientId: data.fromClientId,
              fromName: data.fromName || 'FINE Peer',
              signalType: data.signalType,
              payload: data.payload,
              seq: Date.now(),
            });
          }
        } catch {
          // ignore
        }
      };

      socket.onclose = () => {
        if (!disposed) reconnectTimer = window.setTimeout(connect, 1800);
      };
    }

    connect();
    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    setAddressInput(activeTab.module === 'browser' && fetchedPage ? fetchedPage.finalUrl : activeTab.url);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'browser:presence',
          name: account?.name || 'FINE Explorer',
          accountNumber: account?.accountNumber || 'Guest',
          platform: `${edition} / ${navigator.platform || 'Desktop'}`,
          activeModule: activeTab.module,
          activeUrl: activeTab.url,
          inArena: activeTab.module === 'arena',
        })
      );
    }
  }, [activeTab.id, activeTab.module, activeTab.url, account, edition, fetchedPage]);

  const navigateToModule = useCallback(
    (module: FineModuleId, subHint?: string) => {
      setMobileMenuOpen(false);
      setStartMenuOpen(false);
      setPowerMenuOpen(false);

      if (module === 'office' && subHint) {
        const mappedHint = subHint === 'present' ? 'slides' : subHint;
        if (['home', 'writer', 'notes', 'sheets', 'slides', 'pdf', 'design', 'ai_studio'].includes(mappedHint)) {
          setOfficeApp(mappedHint as OfficeAppId);
        }
      }
      if (module === 'messages') {
        if (subHint === 'account' || subHint === 'calls') setCommSection(subHint);
        else setCommSection('messages');
      } else if (module === 'mail') {
        setCommSection('mail');
      } else if (module === 'contacts') {
        setCommSection('contacts');
      }

      const meta = MODULE_META[module];
      const existing = tabs.find((t) => t.module === module);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      const newTab: BrowserTab = {
        id: `tab-${module}-${Date.now()}`,
        title: meta.title,
        url: meta.url,
        module,
        faviconLetter: meta.letter,
        desktop: virtualDesktop,
        isProtected: true,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs, virtualDesktop]
  );

  const fetchLiveWebUrl = useCallback(
    async (rawUrl: string) => {
      const targetUrl = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
      setSearchQuery(targetUrl);
      setFetchingPage(true);
      setFetchError(null);
      navigateToModule('browser');

      try {
        const res = await fetch('/api/browser/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });
        const data = await res.json();

        if (res.status === 403 || data.verdict === 'Blocked') {
          setFetchedPage(null);
          setFetchError(data.error || `FINE Security blocked ${targetUrl}`);
          setHistory((prev) => [
            {
              id: `hist-${Date.now()}`,
              title: targetUrl,
              url: targetUrl,
              visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              verdict: 'Blocked',
            },
            ...prev,
          ]);
          notify(`FINE Security blocked unsafe URL: ${targetUrl}`);
          return;
        }

        if (!res.ok) {
          setFetchError(data.error || `Unable to load ${targetUrl}`);
          return;
        }

        setFetchedPage(data as FetchedWebPage);
        setAddressInput(data.finalUrl || targetUrl);
        setHistory((prev) => [
          {
            id: `hist-${Date.now()}`,
            title: data.title || targetUrl,
            url: data.finalUrl || targetUrl,
            visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            verdict: data.verdict || 'Safe',
          },
          ...prev.slice(0, 29),
        ]);
      } catch {
        setFetchError(`Network error connecting to ${targetUrl}`);
      } finally {
        setFetchingPage(false);
      }
    },
    [navigateToModule, notify]
  );

  const openNewTab = () => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: 'FINE OS — Desktop',
      url: 'fine://home',
      module: 'home',
      faviconLetter: 'F',
      desktop: virtualDesktop,
      isProtected: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tabs.length === 1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) setActiveTabId(nextTabs[nextTabs.length - 1].id);
  };

  const handleOmniboxSubmit = async (rawValue: string) => {
    const q = rawValue.trim();
    if (!q) return;

    if (q.startsWith('fine://')) {
      const target = q.replace('fine://', '').toLowerCase();
      if (['home', 'writer', 'notes', 'sheets', 'slides', 'present', 'pdf', 'design', 'ai_studio'].includes(target)) {
        navigateToModule('office', target === 'present' ? 'slides' : target);
        return;
      }
      if (target === 'email') {
        navigateToModule('mail');
        return;
      }
      if (MODULE_META[target as FineModuleId]) {
        navigateToModule(target as FineModuleId);
        return;
      }
    }

    if (/^https?:\/\//i.test(q) || (q.includes('.') && !q.includes(' '))) {
      await fetchLiveWebUrl(q);
      return;
    }

    setSearchQuery(q);
    setFetchedPage(null);
    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        title: `Search: ${q}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verdict: 'Safe',
      },
      ...prev.slice(0, 29),
    ]);
    navigateToModule('browser');
  };

  const sendWs = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const triggerHeyFineVoice = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      navigateToModule('ai');
      notify('Opened FINE AI Assistant.');
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
      setHeyFineListening(true);
      rec.onresult = (ev) => {
        const spoken = (ev.results?.[0]?.[0]?.transcript || '').toLowerCase();
        if (spoken.includes('atm')) navigateToModule('atm');
        else if (spoken.includes('mail') || spoken.includes('email')) navigateToModule('mail');
        else if (spoken.includes('chat') || spoken.includes('message')) navigateToModule('messages');
        else if (spoken.includes('database') || spoken.includes('finedb')) navigateToModule('finedb');
        else if (spoken.includes('task')) navigateToModule('taskmgr');
        else if (spoken.includes('office') || spoken.includes('note')) navigateToModule('office');
        else if (spoken.includes('lock')) setBootOverlayMode('lock');
        else {
          navigateToModule('ai');
          notify(`Hey Fine heard: "${spoken}"`);
        }
      };
      rec.onend = () => setHeyFineListening(false);
      rec.onerror = () => setHeyFineListening(false);
      rec.start();
    } catch {
      setHeyFineListening(false);
      navigateToModule('ai');
    }
  };

  const createBackupSnapshot = () => {
    const snapName = `FINE Snapshot ${new Date().toISOString().slice(0, 16).replace('T', ' ')}.finebak`;
    const payload = JSON.stringify({
      exportedAt: new Date().toISOString(),
      mails,
      contacts,
      files,
      downloads,
      printJobs,
      quarantine,
    });
    setFiles((prev) => [
      {
        id: `bak-${Date.now()}`,
        name: snapName,
        kind: 'backup',
        size: `${Math.max(2, Math.round(payload.length / 1024))} KB`,
        modified: new Date().toISOString().slice(0, 10),
        location: 'Backup Vault',
        protectedFolder: true,
        content: payload,
      },
      ...prev,
    ]);
    notify('Backup snapshot stored in Backup Vault.');
  };

  const exportWorkspaceArchive = () => {
    const snapshot = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        platform: 'FINE OS Universal Platform',
        mails,
        contacts,
        files,
        downloads,
        printJobs,
        quarantine,
      },
      null,
      2
    );
    const blob = new Blob([snapshot], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fine_os_${new Date().toISOString().slice(0, 10)}.finebak`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Downloaded real .finebak workspace archive.');
  };

  const importWorkspaceArchive = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed.mails)) setMails(parsed.mails);
      if (Array.isArray(parsed.contacts)) setContacts(parsed.contacts);
      if (Array.isArray(parsed.files)) setFiles(parsed.files);
      if (Array.isArray(parsed.downloads)) setDownloads(parsed.downloads);
      if (Array.isArray(parsed.printJobs)) setPrintJobs(parsed.printJobs);
      if (Array.isArray(parsed.quarantine)) setQuarantine(parsed.quarantine);
      notify('Restored workspace state from .finebak archive.');
    } catch {
      notify('Invalid .finebak archive file.');
    }
  };

  const queuePrintJob = (job: Omit<PrintJob, 'id' | 'status' | 'createdAt'>) => {
    setPrintJobs((prev) => [
      {
        ...job,
        id: `pj-${Date.now()}`,
        status: 'Queued',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    navigateToModule('print');
    notify(`Queued "${job.documentName}" in FINE Print.`);
  };

  const activeLayerCount = layers.filter((l) => l.enabled).length;

  const renderModule = (mod: FineModuleId) => {
    if (mod === 'home') {
      return (
        <FineDashboardHome
          account={account}
          edition={edition}
          virtualDesktop={virtualDesktop}
          connectedBrowsers={connectedBrowsers}
          recentFiles={files}
          downloads={downloads}
          recentMessages={messages}
          securityActiveCount={activeLayerCount}
          offlineMode={offlineMode}
          telemetry={telemetry}
          onSearchSubmit={handleOmniboxSubmit}
          onNavigateModule={navigateToModule}
        />
      );
    }
    if (mod === 'browser') {
      return (
        <FineBrowserSearchView
          initialQuery={searchQuery}
          fetchedPage={fetchedPage}
          fetchingPage={fetchingPage}
          fetchError={fetchError}
          bookmarks={bookmarks}
          history={history}
          downloads={downloads}
          vaultSecrets={vaultSecrets}
          onSaveVaultSecret={(secret) => {
            setVaultSecrets((prev) => [secret, ...prev]);
            notify(`Saved credentials for ${secret.site} in Password Vault.`);
          }}
          onRunSearch={(q) => setSearchQuery(q)}
          onFetchUrl={fetchLiveWebUrl}
          onClearPage={() => {
            setFetchedPage(null);
            setFetchError(null);
          }}
          onSaveOfflinePage={(page) => {
            const fileName = `${page.title.slice(0, 40).replace(/[\\/:*?"<>|]/g, '_')}.txt`;
            const body = `URL: ${page.finalUrl}\nFetched: ${page.fetchedAt}\nVerdict: ${page.verdict}\n\n${page.textContent}`;
            setFiles((prev) => [
              {
                id: `web-${Date.now()}`,
                name: fileName,
                kind: 'document',
                size: `${Math.max(2, Math.round(body.length / 1024))} KB`,
                modified: new Date().toISOString().slice(0, 10),
                location: 'Downloads',
                protectedFolder: true,
                content: body,
              },
              ...prev,
            ]);
            setDownloads((prev) => [
              {
                id: `dl-${Date.now()}`,
                fileName,
                source: new URL(page.finalUrl).hostname,
                size: `${Math.max(2, Math.round(body.length / 1024))} KB`,
                status: 'Verified Clean',
                downloadedAt: new Date().toISOString().slice(0, 10),
                content: body,
              },
              ...prev,
            ]);
            notify(`Saved "${page.title}" to FINE Explorer & Downloads.`);
          }}
          onPrintPage={(page) =>
            queuePrintJob({
              documentName: page.title,
              sourceType: 'Web Page',
              paperSize: 'A4',
              colorMode: 'Colour',
              duplex: true,
              content: `URL: ${page.finalUrl}\n\n${page.textContent}`,
            })
          }
          onAddBookmark={(bm) => {
            setBookmarks((prev) => [{ ...bm, id: `bm-${Date.now()}` }, ...prev]);
            notify(`Bookmarked "${bm.title}".`);
          }}
          onRemoveBookmark={(id) => {
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
            notify('Bookmark removed.');
          }}
          onOpenPdfViewer={() => navigateToModule('office', 'pdf')}
        />
      );
    }
    if (mod === 'ai') {
      return <FineAiView telemetry={telemetry} accountNumber={account?.accountNumber} onOpenUrl={fetchLiveWebUrl} />;
    }
    if (mod === 'messages' || mod === 'mail' || mod === 'contacts') {
      return (
        <FineCommunicationView
          initialSection={mod === 'mail' ? 'mail' : mod === 'contacts' ? 'contacts' : commSection}
          clientId={clientId}
          account={account}
          connectedBrowsers={connectedBrowsers}
          messages={messages}
          typingUsers={typingUsers}
          mails={mails}
          contacts={contacts}
          incomingRtcSignal={incomingRtcSignal}
          onSendRtcSignal={(targetClientId, signalType, payload) =>
            sendWs({ type: 'rtc:signal', targetClientId, signalType, payload })
          }
          onSendChat={(text, channel, attachment, extra) =>
            sendWs({ type: 'chat:message', text, channel, attachment, ...extra })
          }
          onEditChat={(id, text) => sendWs({ type: 'chat:edit', id, text })}
          onDeleteChat={(id) => sendWs({ type: 'chat:delete', id })}
          onPinChat={(id) => sendWs({ type: 'chat:pin', id })}
          onVotePoll={(id, optionIndex) => sendWs({ type: 'chat:vote_poll', id, optionIndex })}
          onTypingChange={(channel, typing) => sendWs({ type: 'chat:typing', channel, typing })}
          onSendMail={(to, subject, body, folder = 'sent', extra) => {
            const mail: MailMessage = {
              id: `mail-${Date.now()}`,
              folder,
              category: extra?.category || 'Primary',
              from: account?.name || 'You',
              fromAddress: account?.email || 'owner@fine.browser',
              to,
              cc: extra?.cc,
              bcc: extra?.bcc,
              scheduledFor: extra?.scheduledFor,
              subject,
              preview: body.slice(0, 90),
              body,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
              unread: false,
            };
            setMails((prev) => [mail, ...prev]);
            notify(
              folder === 'drafts'
                ? 'Draft saved in FINE Mail.'
                : folder === 'scheduled'
                  ? `Email scheduled for ${extra?.scheduledFor}`
                  : 'Email sent via FINE Mail.'
            );
          }}
          onMoveMailFolder={(id, folder) => {
            setMails((prev) => prev.map((m) => (m.id === id ? { ...m, folder } : m)));
            notify(`Moved message to ${folder}.`);
          }}
          onToggleStarMail={(id) =>
            setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
          }
          onDeleteMail={(id) => {
            setMails((prev) => prev.filter((m) => m.id !== id));
            notify('Email purged.');
          }}
          onPrintMail={(mail) =>
            queuePrintJob({
              documentName: mail.subject,
              sourceType: 'Email',
              paperSize: 'A4',
              colorMode: 'Black & White',
              duplex: false,
              content: `From: ${mail.from} <${mail.fromAddress}>\nTo: ${mail.to}\nDate: ${mail.timestamp}\n\n${mail.body}`,
            })
          }
          onMarkMailRead={(id) => setMails((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)))}
          onAddContact={(c) => setContacts((prev) => [...prev, { ...c, id: `ct-${Date.now()}` }])}
          onToggleBlockContact={(id) =>
            setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)))
          }
          onToggleFavouriteContact={(id) =>
            setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, favourite: !c.favourite } : c)))
          }
          onDeleteContact={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
          onAccountRegistered={(newAccount, deliveredMail) => {
            setAccount(newAccount);
            localStorage.setItem('fine_account_v1', JSON.stringify(newAccount));
            if (deliveredMail) {
              setMails((prev) => [deliveredMail, ...prev]);
              notify(`Account #${newAccount.accountNumber} synced & notification delivered to Inbox.`);
            } else {
              notify(`Signed in as ${newAccount.name} (#${newAccount.accountNumber}).`);
            }
          }}
          onSignOutAccount={() => {
            setAccount(null);
            localStorage.removeItem('fine_account_v1');
            notify('Signed out of FINE Account.');
          }}
        />
      );
    }
    if (mod === 'software') {
      return (
        <FineSoftwareCenterView
          packages={packages}
          onToggleInstall={async (id) => {
            const target = packages.find((p) => p.id === id);
            if (!target) return;
            const installing = !target.installed;
            if (installing) {
              const installerName = `${target.name.replace(/\s+/g, '_')}_${target.version}.${target.format.toLowerCase()}`;
              try {
                await fetch('/api/security/scan-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fileName: installerName,
                    contentSample: `FINE Verified Installer: ${target.name} v${target.version} (${target.format})`,
                    sizeBytes: 2048,
                  }),
                });
              } catch {
                // ignore
              }
              setDownloads((prev) => [
                {
                  id: `swdl-${Date.now()}`,
                  fileName: installerName,
                  source: 'FINE App Store',
                  size: target.size,
                  status: 'Verified Clean',
                  downloadedAt: new Date().toISOString().slice(0, 10),
                  content: JSON.stringify(target, null, 2),
                },
                ...prev,
              ]);
            }
            setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, installed: installing } : p)));
            notify(installing ? `Verified & installed "${target.name}" (${target.format}).` : `Uninstalled "${target.name}".`);
          }}
          onBackupInstaller={(pkg) => {
            setFiles((prev) => [
              {
                id: `pkgbak-${Date.now()}`,
                name: `${pkg.name} (${pkg.format} Installer).finebak`,
                kind: 'backup',
                size: pkg.size,
                modified: new Date().toISOString().slice(0, 10),
                location: 'Backup Vault',
                protectedFolder: true,
                content: JSON.stringify(pkg, null, 2),
              },
              ...prev,
            ]);
            notify(`Installer "${pkg.name}" saved to Backup Vault.`);
          }}
        />
      );
    }
    if (mod === 'office') {
      return (
        <FineOfficeSuite
          initialApp={officeApp}
          files={files}
          activeFile={activeOfficeFile}
          onSaveFile={(name, kind, content, versions, silent) => {
            setFiles((prev) => [
              {
                id: `f-${Date.now()}`,
                name,
                kind,
                size: `${Math.max(4, Math.round((content?.length || 400) / 80))} KB`,
                modified: new Date().toISOString().slice(0, 10),
                location: 'Documents',
                protectedFolder: true,
                content,
                versions,
              },
              ...prev.filter((f) => f.name !== name),
            ]);
            if (!silent) notify(`Saved "${name}" locally to FINE Explorer.`);
          }}
          onTrashFile={(id) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id ? { ...f, deleted: true, deletedAt: new Date().toISOString().slice(0, 10) } : f
              )
            );
            notify('Moved Office file to Trash.');
          }}
          onRestoreFile={(id) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, deleted: false } : f)));
            notify('Restored Office file from Trash.');
          }}
          onSendToPrint={queuePrintJob}
        />
      );
    }
    if (mod === 'files') {
      return (
        <FineFilesView
          files={files}
          usbMounted={usbMounted}
          onCreateBackup={createBackupSnapshot}
          onAddFile={(file) => {
            setFiles((prev) => [file, ...prev]);
            notify(`Added "${file.name}" into FINE Explorer.`);
          }}
          onUpdateFiles={(updater) => setFiles(updater)}
          onDeleteFile={(id) => {
            setFiles((prev) => prev.filter((f) => f.id !== id));
            notify('Removed file from FINE Explorer.');
          }}
          onOpenOffice={(file) => {
            if (file) setActiveOfficeFile(file);
            navigateToModule('office', file?.kind === 'note' ? 'notes' : 'writer');
          }}
          onExportWorkspaceArchive={exportWorkspaceArchive}
          onImportWorkspaceArchive={importWorkspaceArchive}
        />
      );
    }
    if (mod === 'atm') {
      return (
        <FineAtmView
          account={account}
          offlineMode={offlineMode}
          onAtmReceiptMail={(mail) => {
            setMails((prev) => [mail, ...prev]);
            notify('ATM Receipt delivered to FINE Mail Inbox.');
          }}
          onAtmChatNotify={(txt) => sendWs({ type: 'chat:message', text: txt, channel: 'Global Lobby' })}
          onAccountBalanceUpdated={(acc) => {
            setAccount(acc);
            localStorage.setItem('fine_account_v1', JSON.stringify(acc));
          }}
        />
      );
    }
    if (mod === 'finedb') {
      return (
        <FineDbStudioView
          account={account}
          onExportWorkspaceArchive={exportWorkspaceArchive}
          onImportWorkspaceArchive={importWorkspaceArchive}
        />
      );
    }
    if (mod === 'taskmgr') {
      return (
        <FineTaskManagerView
          tabs={tabs}
          telemetry={telemetry}
          offlineMode={offlineMode}
          onEndTask={(tabId) => {
            closeTab(tabId);
            notify('Process terminated cleanly.');
          }}
          onRefreshTelemetry={refreshTelemetry}
        />
      );
    }
    if (mod === 'media') return <FineMediaView />;
    if (mod === 'devices') {
      return (
        <FineDevicesView
          telemetry={telemetry}
          usbMounted={usbMounted}
          onMountUsbDrive={() => {
            setUsbMounted(true);
            setFiles((prev) => {
              if (prev.some((f) => f.location === 'USB Drive')) return prev;
              return [
                {
                  id: `usb-${Date.now()}`,
                  name: 'SanDisk_32GB_Presentation.docx',
                  kind: 'document',
                  size: '148 KB',
                  modified: new Date().toISOString().slice(0, 10),
                  location: 'USB Drive',
                  protectedFolder: true,
                  content: 'Mounted cleanly from SanDisk Ultra 32GB USB Drive after Zero-Trust scan.',
                },
                ...prev,
              ];
            });
            notify('SanDisk 32GB USB verified clean & mounted in FINE Explorer.');
          }}
          onEjectUsbDrive={() => {
            setUsbMounted(false);
            setFiles((prev) => prev.filter((f) => f.location !== 'USB Drive'));
            notify('USB Drive safely ejected.');
          }}
          onRefreshTelemetry={refreshTelemetry}
        />
      );
    }
    if (mod === 'print') {
      return (
        <FinePrintView
          jobs={printJobs}
          onAddPrintJob={(job) => {
            setPrintJobs((prev) => [
              {
                ...job,
                id: `pj-${Date.now()}`,
                status: 'Completed',
                createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
              ...prev,
            ]);
            notify(`Print job "${job.documentName}" sent to print driver.`);
          }}
          onClearCompleted={() => setPrintJobs((prev) => prev.filter((j) => j.status !== 'Completed'))}
        />
      );
    }
    if (mod === 'security') {
      return (
        <FineSecurityCenter
          layers={layers}
          quarantine={quarantine}
          securityEvents={securityEvents}
          lastScanTime={lastScanTime}
          onToggleLayer={(id) =>
            setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)))
          }
          onRunFullScan={() => {
            const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastScanTime(ts);
            setSecurityEvents((prev) => [
              { timestamp: new Date().toISOString(), event: `Full Zero Trust scan verified ${activeLayerCount} active layers.` },
              ...prev,
            ]);
            notify('FINE Security completed full Zero Trust scan.');
          }}
          onAddQuarantine={(item) => {
            setQuarantine((prev) => [item, ...prev]);
            setSecurityEvents((prev) => [
              { timestamp: new Date().toISOString(), event: `Quarantined "${item.fileName}" (${item.threatName}).` },
              ...prev,
            ]);
            notify(`Quarantined ${item.fileName}`);
          }}
          onRestoreQuarantine={(id) =>
            setQuarantine((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'Restored' } : q)))
          }
          onDeleteQuarantine={(id) => setQuarantine((prev) => prev.filter((q) => q.id !== id))}
          onSecurityEventsUpdated={(events) => setSecurityEvents(events)}
        />
      );
    }
    if (mod === 'recovery') {
      return <FineRecoveryView onTriggerBackup={createBackupSnapshot} onExportArchive={exportWorkspaceArchive} />;
    }
    if (mod === 'settings') {
      return (
        <FineSettingsView
          offlineMode={offlineMode}
          largeText={largeText}
          autoStartOnBoot={autoStartOnBoot}
          account={account}
          edition={edition}
          theme={theme}
          brightness={brightness}
          soundVolume={soundVolume}
          nightLight={nightLight}
          onChangeEdition={(ed) => {
            setEdition(ed);
            if (ed === 'ATM') navigateToModule('atm');
            notify(`Switched machine edition to FINE ${ed}.`);
          }}
          onChangeTheme={(th) => {
            setTheme(th);
            notify(`Applied ${th} OS theme.`);
          }}
          onChangeBrightness={setBrightness}
          onChangeSoundVolume={setSoundVolume}
          onToggleNightLight={() => setNightLight((v) => !v)}
          onToggleOffline={() => setOfflineMode((v) => !v)}
          onToggleLargeText={() => setLargeText((v) => !v)}
          onToggleAutoStart={() => {
            setAutoStartOnBoot((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('fine_autostart_v1', String(next));
              } catch {
                // ignore
              }
              notify(next ? 'Auto-Boot enabled on computer startup.' : 'Auto-Boot disabled.');
              return next;
            });
          }}
          onSimulateBoot={() => setBootOverlayMode('boot')}
          onLaunchStandaloneRecovery={() => setBootOverlayMode('recovery')}
          onOpenAccount={() => navigateToModule('messages', 'account')}
        />
      );
    }
    if (mod === 'arena') {
      return (
        <FineLaserTagArena
          clientId={clientId}
          playerName={account?.name || 'FINE Explorer'}
          accountNumber={account?.accountNumber || 'Guest'}
          players={arenaPlayers}
          beams={arenaBeams}
          hitBanner={hitBanner}
          onJoinArena={(team) => sendWs({ type: 'arena:join', team })}
          onLeaveArena={() => sendWs({ type: 'arena:leave' })}
          onMove={(pos) => sendWs({ type: 'arena:move', ...pos })}
          onFire={(origin, dir) => sendWs({ type: 'arena:fire', origin, dir })}
        />
      );
    }
    return null;
  };

  const themeWrapperClass =
    theme === 'neon'
      ? 'bg-slate-950 text-cyan-50'
      : theme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : theme === 'nature'
          ? 'bg-[#eff6f1] text-[#0B132B]'
          : 'bg-[#F8F9FA] text-[#0B132B]';

  const isMobileEdition = edition === 'Mobile';
  const isKioskEdition = edition === 'Kiosk';
  const isAtmEdition = edition === 'ATM';

  return (
    <div
      style={{
        filter: `brightness(${brightness}%) ${nightLight ? 'sepia(0.18) saturate(1.05)' : ''}`,
      }}
      onClick={() => {
        if (desktopContextMenu) setDesktopContextMenu(null);
      }}
      className={`min-h-screen flex flex-col pb-12 transition-colors ${themeWrapperClass} ${largeText ? 'text-[16px]' : ''} ${
        isMobileEdition ? 'max-w-[440px] mx-auto border-x border-slate-300 dark:border-slate-700 shadow-2xl' : ''
      }`}
    >
      {/* A. Top OS Bar */}
      {!isAtmEdition && (
        <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 h-14 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 shrink-0">
            {!isKioskEdition && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateToModule('home')}
              className="text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <span>FINE</span>
              <span className="text-[11px] font-mono font-semibold text-[#3A86EF] uppercase">{edition}</span>
            </button>
          </div>

          {!isKioskEdition && !isMobileEdition && (
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button type="button" onClick={() => navigateToModule('home')} className="hover:text-[#3A86EF] whitespace-nowrap">
                Desktop
              </button>
              <button type="button" onClick={() => navigateToModule('browser')} className="hover:text-[#3A86EF] whitespace-nowrap">
                Browser
              </button>
              <button type="button" onClick={() => navigateToModule('ai')} className="hover:text-[#3A86EF] whitespace-nowrap">
                FINE AI
              </button>
              <button type="button" onClick={() => navigateToModule('office')} className="hover:text-[#3A86EF] whitespace-nowrap">
                Office
              </button>
              <button type="button" onClick={() => navigateToModule('atm')} className="hover:text-[#3A86EF] whitespace-nowrap">
                ATM
              </button>
              <button type="button" onClick={() => navigateToModule('finedb')} className="hover:text-[#3A86EF] whitespace-nowrap">
                FineDB
              </button>
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Virtual Desktop Switcher */}
            {!isMobileEdition && !isKioskEdition && (
              <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-[11px]">
                {(['Work', 'Study', 'Personal'] as const).map((vd) => (
                  <button
                    key={vd}
                    type="button"
                    onClick={() => {
                      setVirtualDesktop(vd);
                      notify(`Switched to ${vd} Desktop`);
                    }}
                    className={`px-2 py-1 rounded font-semibold ${
                      virtualDesktop === vd
                        ? 'bg-white dark:bg-slate-900 text-[#3A86EF] shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {vd}
                  </button>
                ))}
              </div>
            )}

            {/* Split-Screen Workspace Toggle */}
            {!isMobileEdition && !isKioskEdition && (
              <button
                type="button"
                onClick={() =>
                  setSplitScreenModule((prev) => (prev ? null : activeTab.module === 'ai' ? 'browser' : 'ai'))
                }
                title="Toggle Side-by-Side Split Screen"
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                  splitScreenModule
                    ? 'border-[#3A86EF] bg-[#edf3ff] text-[#1d4f9c]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                {splitScreenModule ? 'Exit Split' : 'Split View'}
              </button>
            )}

            {isKioskEdition && (
              <button
                type="button"
                onClick={() => setEdition('Home')}
                className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-semibold"
              >
                Exit Kiosk
              </button>
            )}

            <button
              type="button"
              onClick={() => navigateToModule('messages', 'account')}
              className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {account ? `#${account.accountNumber}` : 'FINE Account'}
            </button>
          </div>
        </header>
      )}

      {isAtmEdition && (
        <div className="no-print bg-[#0B132B] text-white px-5 py-2.5 flex items-center justify-between text-xs">
          <span className="font-bold">FINE ATM KIOSK MODE ACTIVE</span>
          <button
            type="button"
            onClick={() => {
              setEdition('Home');
              navigateToModule('home');
            }}
            className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 font-semibold"
          >
            Exit ATM Mode
          </button>
        </div>
      )}

      {/* Main Platform Layout */}
      <div className="flex-1 flex min-h-0">
        {!isMobileEdition && !isKioskEdition && !isAtmEdition && (
          <aside
            className={`no-print ${
              mobileMenuOpen ? 'fixed inset-y-14 left-0 z-40 block' : 'hidden'
            } lg:block w-56 shrink-0 bg-[#0B132B] text-slate-100 border-r border-slate-900 overflow-y-auto`}
          >
            <div className="p-3 space-y-0.5">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab.module === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateToModule(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isActive ? 'bg-[#3A86EF] text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Right Workspace Column */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('input, textarea, select')) return;
            e.preventDefault();
            setDesktopContextMenu({
              x: Math.min(e.clientX, window.innerWidth - 210),
              y: Math.min(e.clientY, window.innerHeight - 190),
            });
          }}
        >
          {/* Browser Multi-Tab Strip & Address Bar */}
          {!isKioskEdition && !isAtmEdition && (
            <div className="no-print bg-[#edf1f7] dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2 space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setActiveTabId(tab.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer max-w-[180px] shrink-0 ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-[#0B132B] dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="w-4 h-4 rounded bg-[#0B132B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {tab.faviconLetter}
                      </span>
                      <span className="truncate">{tab.title}</span>
                      {tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => closeTab(tab.id, e)}
                          aria-label={`Close ${tab.title}`}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={openNewTab}
                  aria-label="New browser tab"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOmniboxSubmit(addressInput);
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 rounded-lg px-3 py-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter website address, search query, or fine://atm, fine://finedb..."
                    className="flex-1 min-w-0 text-xs bg-transparent outline-none font-mono"
                    aria-label="Address bar"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigateToModule('security')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-600 whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Trust Active
                </button>
              </form>
            </div>
          )}

          {/* Active Workspace Content (Supports Split-Screen Side-by-Side) */}
          <main className="flex-1 p-4 md:p-6 max-w-[1520px] w-full mx-auto">
            {isAtmEdition ? (
              renderModule('atm')
            ) : splitScreenModule ? (
              <div className="grid xl:grid-cols-2 gap-5 items-start">
                <div className="min-w-0">{renderModule(activeTab.module)}</div>
                <div className="min-w-0 border border-blue-200 dark:border-slate-700 rounded-xl p-3 bg-white/40 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span>Split Pane</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={splitScreenModule}
                        onChange={(e) => setSplitScreenModule(e.target.value as FineModuleId)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                      >
                        {SIDEBAR_ITEMS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setSplitScreenModule(null)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {renderModule(splitScreenModule)}
                </div>
              </div>
            ) : (
              renderModule(activeTab.module)
            )}
          </main>
        </div>
      </div>

      {/* Desktop Right-Click Context Menu */}
      {desktopContextMenu && (
        <div
          style={{ left: desktopContextMenu.x, top: desktopContextMenu.y }}
          className="no-print fixed z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 text-xs"
        >
          <button
            type="button"
            onClick={() => {
              setFiles((prev) => [
                {
                  id: `df-${Date.now()}`,
                  name: `New Folder ${prev.length + 1}`,
                  kind: 'folder',
                  size: '0 items',
                  modified: new Date().toISOString().slice(0, 10),
                  location: 'Desktop',
                  colorTag: 'blue',
                  protectedFolder: true,
                },
                ...prev,
              ]);
              setDesktopContextMenu(null);
              notify('Created New Folder on Desktop.');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#3A86EF]" />
            New Desktop Folder
          </button>
          <button
            type="button"
            onClick={() => {
              refreshTelemetry();
              setDesktopContextMenu(null);
              notify('Desktop & OS telemetry refreshed.');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            Refresh System
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
              setDesktopContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            Toggle Dark / Light
          </button>
          <button
            type="button"
            onClick={() => {
              setSplitScreenModule((prev) => (prev ? null : 'ai'));
              setDesktopContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Columns className="w-3.5 h-3.5 text-[#3A86EF]" />
            Toggle Split Screen
          </button>
        </div>
      )}

      {/* Start Menu Popover */}
      {startMenuOpen && (
        <div className="no-print fixed bottom-14 left-3 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold">FINE OS Start Menu</span>
            <button
              type="button"
              onClick={() => {
                setStartMenuOpen(false);
                setPowerMenuOpen((v) => !v);
              }}
              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
            >
              <Power className="w-3 h-3" />
              Power
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-2 max-h-64 overflow-y-auto">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToModule(item.id)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-[#edf3ff] dark:hover:bg-slate-800"
                >
                  <Icon className="w-3.5 h-3.5 text-[#3A86EF] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setStartMenuOpen(false);
                setBootOverlayMode('lock');
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Screen
            </button>
            <button
              type="button"
              onClick={() => {
                setStartMenuOpen(false);
                setBootOverlayMode('recovery');
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <Wrench className="w-3.5 h-3.5 text-[#3A86EF]" />
              Recovery OS
            </button>
          </div>
        </div>
      )}

      {/* Power Menu Modal/Popover */}
      {powerMenuOpen && (
        <div className="no-print fixed bottom-14 right-4 z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 text-xs">
          <div className="px-3 py-1.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            OS Power Actions
          </div>
          <button
            type="button"
            onClick={() => {
              setPowerMenuOpen(false);
              setBootOverlayMode('lock');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold"
          >
            <Lock className="w-3.5 h-3.5 text-[#3A86EF]" />
            Lock Screen
          </button>
          <button
            type="button"
            onClick={() => {
              setPowerMenuOpen(false);
              setBootOverlayMode('sleep');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold"
          >
            <Moon className="w-3.5 h-3.5 text-amber-500" />
            Sleep
          </button>
          <button
            type="button"
            onClick={() => {
              setPowerMenuOpen(false);
              setBootOverlayMode('boot');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            Restart (4s Boot)
          </button>
          <button
            type="button"
            onClick={() => {
              setPowerMenuOpen(false);
              setBootOverlayMode('shutdown');
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2 font-semibold"
          >
            <Power className="w-3.5 h-3.5" />
            Shutdown
          </button>
        </div>
      )}

      {/* Notifications & Calendar Drawer */}
      {notificationsOpen && (
        <div className="no-print fixed bottom-14 right-4 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold">Notifications & Calendar</span>
            <button type="button" onClick={() => setNotificationsOpen(false)} className="text-slate-400">
              Close
            </button>
          </div>
          <div className="bg-[#0B132B] text-white rounded-lg p-3">
            <div className="text-[11px] text-blue-200">{dateText}</div>
            <div className="text-lg font-mono font-bold">{clockText}</div>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {securityEvents.slice(0, 6).map((ev, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="font-medium">{ev.event}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Bottom OS Taskbar */}
      <footer className="no-print fixed bottom-0 left-0 right-0 h-12 bg-[#0B132B] text-white border-t border-slate-900 px-3 md:px-5 flex items-center justify-between gap-3 z-40">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStartMenuOpen((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Start
          </button>

          <button
            type="button"
            onClick={triggerHeyFineVoice}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 ${
              heyFineListening ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-blue-100'
            }`}
            title="Hey Fine Voice Command"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{heyFineListening ? 'Listening...' : 'Hey Fine'}</span>
          </button>

          {(
            [
              { id: 'browser', label: 'Browser' },
              { id: 'ai', label: 'FINE AI' },
              { id: 'files', label: 'Explorer' },
              { id: 'messages', label: 'Chat' },
              { id: 'office', label: 'Office' },
              { id: 'atm', label: 'ATM' },
              { id: 'taskmgr', label: 'Tasks' },
            ] as const
          ).map((quick) => (
            <button
              key={quick.id}
              type="button"
              onClick={() => navigateToModule(quick.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab.module === quick.id ? 'bg-white/20 text-white' : 'text-blue-100/80 hover:bg-white/10'
              }`}
            >
              {quick.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-blue-100 shrink-0 tabular-nums">
          <button
            type="button"
            onClick={() => setSystemMuted((m) => !m)}
            aria-label={systemMuted ? 'Unmute system audio' : 'Mute system audio'}
            className="p-1.5 rounded hover:bg-white/10"
          >
            {systemMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setOfflineMode((o) => !o)}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10"
            title="Toggle online / offline simulation"
          >
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-300" /> : <Wifi className="w-3.5 h-3.5 text-emerald-300" />}
            <span>{offlineMode ? 'Offline' : 'Online'}</span>
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="p-1.5 rounded hover:bg-white/10"
            aria-label="Notifications and Calendar"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setPowerMenuOpen((v) => !v)}
            className="p-1.5 rounded hover:bg-white/10"
            aria-label="OS Power Menu"
          >
            <Power className="w-3.5 h-3.5 text-rose-300" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="text-right leading-tight hidden sm:block hover:bg-white/10 px-1.5 py-0.5 rounded"
          >
            <div className="font-mono font-semibold text-[11px]">{clockText}</div>
            <div className="text-[10px] text-blue-200/80">{dateText}</div>
          </button>
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-16 right-5 z-50 bg-[#0B132B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border border-blue-400/20"
        >
          {toast}
        </div>
      )}

      {bootOverlayMode && (
        <FineBootOverlay
          mode={bootOverlayMode}
          telemetry={telemetry}
          account={account}
          onEnterDesktop={() => setBootOverlayMode(null)}
          onExportBackup={exportWorkspaceArchive}
          onWakeOrRestart={() => setBootOverlayMode('boot')}
          onAccountUnlocked={(acc) => {
            setAccount(acc);
            localStorage.setItem('fine_account_v1', JSON.stringify(acc));
            setBootOverlayMode(null);
            notify(`Unlocked FINE OS as ${acc.name} (#${acc.accountNumber}).`);
          }}
        />
      )}
    </div>
  );
}
