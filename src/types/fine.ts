export type FineModuleId =
  | 'home'
  | 'browser'
  | 'ai'
  | 'messages'
  | 'mail'
  | 'contacts'
  | 'software'
  | 'office'
  | 'files'
  | 'media'
  | 'devices'
  | 'print'
  | 'security'
  | 'recovery'
  | 'settings'
  | 'arena'
  | 'atm'
  | 'finedb'
  | 'taskmgr';

export type AiProviderId = 'auto' | 'gemini' | 'chatgpt' | 'deepseek' | 'meta' | 'local';
export type FineAiBrain = 'fast' | 'think' | 'creative' | 'pro';
export type FineEdition = 'Home' | 'Pro' | 'Mobile' | 'ATM' | 'Kiosk' | 'Lite' | 'Max';
export type FineTheme = 'light' | 'dark' | 'neon' | 'nature';
export type VirtualDesktopId = 'Work' | 'Study' | 'Personal';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  module: FineModuleId;
  faviconLetter: string;
  desktop?: VirtualDesktopId;
  groupColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'none';
  isPrivate?: boolean;
  isPinned?: boolean;
  isProtected: boolean;
}

export interface FetchedWebPage {
  url: string;
  finalUrl: string;
  statusCode: number;
  title: string;
  description: string;
  textContent: string;
  links: Array<{ text: string; href: string }>;
  verdict: 'Safe' | 'Caution' | 'Blocked';
  findings: string[];
  fetchedAt: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  module: FineModuleId;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
  verdict: 'Safe' | 'Caution' | 'Blocked';
}

export interface DownloadItem {
  id: string;
  fileName: string;
  source: string;
  size: string;
  status: 'Verified Clean' | 'Scanning' | 'Quarantined';
  downloadedAt: string;
  content?: string;
}

export interface ConnectedBrowser {
  clientId: string;
  name: string;
  accountNumber: string;
  platform: string;
  activeModule: FineModuleId;
  activeUrl: string;
  inArena: boolean;
  connectedAt: string;
}

export interface ChatPollOption {
  text: string;
  votes: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAccount: string;
  channel: string;
  text: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  edited?: boolean;
  deletedForAll?: boolean;
  starred?: boolean;
  pinned?: boolean;
  poll?: {
    question: string;
    options: ChatPollOption[];
  };
  locationLabel?: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
    scanStatus: 'Verified Clean' | 'Quarantined';
  };
  timestamp: string;
}

export interface MailMessage {
  id: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'starred' | 'snoozed' | 'scheduled' | 'trash';
  category?: 'Primary' | 'Social' | 'Promotions';
  from: string;
  fromAddress: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  scheduledFor?: string;
  unread: boolean;
  starred?: boolean;
  attachments?: { name: string; size: string }[];
}

export interface ContactEntry {
  id: string;
  name: string;
  accountNumber: string;
  email: string;
  phone: string;
  status: 'Online' | 'Offline' | 'Blocked';
  blocked: boolean;
  favourite?: boolean;
}

export interface FineAccount {
  accountNumber: string;
  name: string;
  email: string;
  mobile: string;
  country: string;
  photoDataUrl?: string;
  balance?: number;
  twoFactorEnabled: boolean;
  passkeyConfigured: boolean;
  recoveryEmail: string;
  createdAt: string;
}

export interface SecurityLayerStatus {
  id: string;
  number: string;
  name: string;
  description: string;
  enabled: boolean;
  engine: string;
  lastChecked: string;
}

export interface QuarantineItem {
  id: string;
  fileName: string;
  threatName: string;
  detectionMethod: string;
  severity: 'High' | 'Medium' | 'Low';
  detectedAt: string;
  sha256: string;
  status: 'Quarantined' | 'Restored';
}

export interface FineSecurityLog {
  log_id: string;
  account_no: string;
  ip: string;
  action: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocked: boolean;
  timestamp: string;
}

export interface BlockedIpEntry {
  ip: string;
  blockedUntil: number | 'forever';
  reason: string;
  createdAt: string;
}

export interface FineAtmTransaction {
  transaction_id: string;
  account_no: string;
  amount: number;
  type: 'WITHDRAW' | 'BALANCE' | 'TRANSFER' | 'EMERGENCY_REVERSE_PIN';
  status: string;
  offlineQueued?: boolean;
  recipientAccount?: string;
  timestamp: string;
}

export interface FineAiHistoryEntry {
  history_id: string;
  account_no: string;
  prompt: string;
  ai_answer: string;
  model_used: string;
  brain: FineAiBrain;
  timestamp: string;
}

export interface FineVaultSecret {
  id: string;
  site: string;
  username: string;
  password: string;
  updatedAt: string;
}

export interface SoftwarePackage {
  id: string;
  name: string;
  publisher: string;
  version: string;
  platform: 'Windows' | 'Linux' | 'Android' | 'Web' | 'Archive';
  format: 'EXE' | 'MSI' | 'MSIX' | 'DEB' | 'RPM' | 'AppImage' | 'APK' | 'PWA' | 'ZIP' | '7Z';
  size: string;
  summary: string;
  signatureVerified: boolean;
  sha256Short: string;
  installed: boolean;
  permissions: string[];
  homepageUrl?: string;
}

export type ExplorerFolderLocation =
  | 'Desktop'
  | 'Downloads'
  | 'Documents'
  | 'Pictures'
  | 'Music'
  | 'Videos'
  | 'Fine Drive'
  | 'Local Disk (C:)'
  | 'Local Disk (D:)'
  | 'USB Drive'
  | 'Local'
  | 'Cloud Sync'
  | 'Backup Vault';

export interface FileVersionEntry {
  savedAt: string;
  content: string;
}

export interface FileNode {
  id: string;
  name: string;
  kind: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'design' | 'media' | 'backup' | 'note';
  size: string;
  modified: string;
  location: ExplorerFolderLocation;
  parentFolder?: string;
  colorTag?: 'red' | 'green' | 'blue' | 'yellow';
  lockedWithPin?: boolean;
  deleted?: boolean;
  deletedAt?: string;
  originalLocation?: ExplorerFolderLocation;
  protectedFolder: boolean;
  content?: string;
  versions?: FileVersionEntry[];
}

export interface PrintJob {
  id: string;
  documentName: string;
  sourceType: 'Document' | 'PDF' | 'Photo' | 'Email' | 'Web Page' | 'Spreadsheet' | 'Presentation';
  paperSize: 'A4' | 'Letter' | 'Legal';
  colorMode: 'Colour' | 'Black & White';
  duplex: boolean;
  status: 'Completed' | 'Queued' | 'Printing';
  createdAt: string;
  content?: string;
}

export interface SystemTelemetry {
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  memUsedGb: number;
  memTotalGb: number;
  diskUsedGb: number | null;
  diskTotalGb: number | null;
  uptimeSeconds: number;
  networkInterfaces: Array<{ name: string; family: string; address: string }>;
}

export interface ArenaPlayerState {
  id: string;
  name: string;
  accountNumber: string;
  team: 'cobalt' | 'crimson';
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  score: number;
  tags: number;
  taggedOutUntil: number;
  isBot?: boolean;
}

export interface ArenaBeamEvent {
  id: string;
  shooterId: string;
  team: 'cobalt' | 'crimson';
  from: [number, number, number];
  to: [number, number, number];
  hitPlayerId?: string;
  timestamp: number;
}
