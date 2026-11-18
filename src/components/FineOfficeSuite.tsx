import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bold,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eraser,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Heading2,
  Highlighter,
  History,
  Home,
  Image as ImageIcon,
  Italic,
  Languages,
  Layers,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  MessageSquare,
  Mic,
  Minimize2,
  Palette,
  PieChart,
  Play,
  Plus,
  Presentation,
  Printer,
  RotateCcw,
  Save,
  Scissors,
  Search,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Table2,
  Trash2,
  TrendingUp,
  Underline,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react';
import { FileNode, FileVersionEntry, PrintJob } from '../types/fine';

export type OfficeAppId =
  | 'home'
  | 'writer'
  | 'notes'
  | 'sheets'
  | 'slides'
  | 'pdf'
  | 'design'
  | 'ai_studio';

type HomeSection = 'all' | 'templates' | 'recent' | 'starred' | 'trash';
type WriterRibbonTab = 'File' | 'Home' | 'Insert' | 'Layout' | 'Review' | 'View' | 'AI Studio';
type SheetRibbonTab = 'File' | 'Home' | 'Insert' | 'Formulas' | 'Data' | 'Review' | 'AI Studio';
type SlideThemeId = 'business' | 'school' | 'minimal' | 'colorful' | 'dark' | '3d';
type SlideTransitionId = 'fade' | 'slide' | 'zoom' | 'none';
type SlideLayoutId = 'hero' | 'split' | 'kpi' | 'quote';
type AiStudioMode = 'writer' | 'sheets' | 'slides' | 'pdf' | 'image';

interface SlideItem {
  title: string;
  body: string;
  notes: string;
  layout?: SlideLayoutId;
}

interface SheetTabData {
  id: string;
  name: string;
  cells: string[][];
}

interface WriterComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

interface OfficeTemplate {
  id: string;
  title: string;
  category: 'Business' | 'School' | 'Finance' | 'Personal';
  targetApp: 'writer' | 'sheets' | 'slides';
  summary: string;
  writerTitle?: string;
  writerBody?: string;
  sheetName?: string;
  sheetCells?: string[][];
  slidesDeck?: SlideItem[];
}

interface FineOfficeSuiteProps {
  initialApp?: OfficeAppId;
  files?: FileNode[];
  activeFile?: FileNode | null;
  onSaveFile: (
    name: string,
    kind: 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'design' | 'note',
    content?: string,
    versions?: FileVersionEntry[],
    silent?: boolean
  ) => void;
  onSendToPrint: (job: Omit<PrintJob, 'id' | 'status' | 'createdAt'>) => void;
  onTrashFile?: (id: string) => void;
  onRestoreFile?: (id: string) => void;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const INITIAL_SHEET_CELLS: string[][] = [
  ['Department / Item', 'Q1', 'Q2', 'Q3', 'Row Total', 'Status'],
  ['Browser Protection Scans', '1240', '1490', '1620', '=SUM(B2:D2)', '=IF(E2>3000,"Optimal","Check")'],
  ['Verified Software Installs', '42', '58', '74', '=SUM(B3:D3)', '=IF(E3>100,"Optimal","Growing")'],
  ['Print & PDF Jobs', '115', '138', '164', '=SUM(B4:D4)', '=IF(E4>300,"Optimal","Normal")'],
  ['AI Studio Automation', '280', '410', '590', '=SUM(B5:D5)', '=IF(E5>1000,"Optimal","Normal")'],
  ['Column Sum', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', '=AVERAGE(E2:E5)'],
];

const OFFICE_TEMPLATES: OfficeTemplate[] = [
  {
    id: 'tpl-resume',
    title: 'Executive Resume',
    category: 'Personal',
    targetApp: 'writer',
    summary: 'Clean 1-page CV layout with skills, experience & contact block.',
    writerTitle: 'Executive Resume.docx',
    writerBody:
      '## AHMAD RAZA — SENIOR SOFTWARE ENGINEER\nLahore, Pakistan · +92-300-0000000 · ahmad@fine.os\n\n## SUMMARY\nFull-stack engineer with 7+ years designing high-reliability desktop platforms, secure browsers, and AI productivity suites.\n\n## EXPERIENCE\n• Lead Systems Architect — FINE Universal Platform (2023–Present)\n• Software Engineer — Enterprise Cloud Systems (2019–2023)\n\n## CORE SKILLS\n• TypeScript, React, C++/WinUI, Node.js, SQLite, Gemini AI',
  },
  {
    id: 'tpl-invoice',
    title: 'Official Tax Invoice',
    category: 'Finance',
    targetApp: 'sheets',
    summary: 'Itemized billing ledger with =SUM & tax calculations.',
    sheetName: 'Invoice #2026-041',
    sheetCells: [
      ['Service Description', 'Qty', 'Unit Price', 'Discount', 'Line Total', 'Tax Status'],
      ['FINE Enterprise Licenses', '12', '45', '0', '=B2*C2', 'Taxable'],
      ['On-Premise Security Audit', '1', '650', '50', '=B3*C3-D3', 'Taxable'],
      ['Cloud Backup Vault (1TB)', '4', '85', '0', '=B4*C4', 'Exempt'],
      ['Custom AI Integration', '2', '320', '40', '=B5*C5-D5', 'Taxable'],
      ['Grand Total', '=SUM(B2:B5)', '=AVERAGE(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', 'Due 15 Days'],
    ],
  },
  {
    id: 'tpl-report',
    title: 'Quarterly Platform Report',
    category: 'Business',
    targetApp: 'writer',
    summary: 'Structured board report with executive summary and milestones.',
    writerTitle: 'Quarterly Platform Report.docx',
    writerBody:
      '## QUARTERLY PLATFORM REPORT\nPrepared for Leadership · Offline & Cloud Synced\n\n## EXECUTIVE SUMMARY\nFINE Office adoption grew 38% this quarter across Windows, Linux, and Kiosk endpoints with zero security incidents.\n\n## KEY MILESTONES\n1. Instant 5-second local autosave & version snapshot recovery.\n2. Native Writer, Sheets, Present, PDF & AI Studio integration.\n3. Seamless English & Urdu RTL document workflows.',
  },
  {
    id: 'tpl-budget',
    title: 'Shop Monthly Budget',
    category: 'Finance',
    targetApp: 'sheets',
    summary: 'Track store revenue, rent, stock, payroll, and net profit.',
    sheetName: 'Monthly Budget',
    sheetCells: [
      ['Expense / Income Line', 'Week 1', 'Week 2', 'Week 3', 'Total', 'Health'],
      ['Retail Sales Revenue', '4800', '5250', '6100', '=SUM(B2:D2)', '=IF(E2>12000,"Strong","Watch")'],
      ['Inventory Restock', '1900', '2100', '2350', '=SUM(B3:D3)', 'Planned'],
      ['Staff Payroll', '1200', '1200', '1200', '=SUM(B4:D4)', 'Fixed'],
      ['Utilities & Rent', '650', '420', '410', '=SUM(B5:D5)', 'Fixed'],
      ['Combined Cashflow', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', '=MAX(E2:E5)'],
    ],
  },
  {
    id: 'tpl-school',
    title: 'Class 9 Climate Change Deck',
    category: 'School',
    targetApp: 'slides',
    summary: 'Ready-to-present 8-slide science deck with speaker notes.',
    slidesDeck: [
      { title: 'Climate Change & Our Planet', body: 'Class 9 Science Project · Causes, Impacts & Local Solutions', notes: 'Welcome the class and introduce why climate literacy matters locally.', layout: 'hero' },
      { title: '1. What Is the Greenhouse Effect?', body: 'Heat-trapping gases regulate Earth temperature; excess CO2 accelerates warming.', notes: 'Point out the difference between natural warming and human emissions.', layout: 'split' },
      { title: '2. Major Drivers of Warming', body: 'Fossil fuels, urban transport, deforestation, and industrial emissions.', notes: 'Ask students for two examples they see in their city.', layout: 'kpi' },
      { title: '3. Local Weather & Glacier Impact', body: 'Changing monsoon patterns, heatwaves, and glacial melt affecting rivers.', notes: 'Connect global science to regional water security.', layout: 'split' },
      { title: '4. Renewable Energy Alternatives', body: 'Solar rooftops, wind corridors, and electric public transit.', notes: 'Highlight falling solar panel costs over the past decade.', layout: 'kpi' },
      { title: '5. Forestation & Urban Trees', body: 'Planting native trees reduces urban heat islands by up to 3°C.', notes: 'Discuss school tree-planting drives.', layout: 'quote' },
      { title: '6. Student Action Plan', body: 'Save electricity, reduce plastic waste, carpool or cycle, educate peers.', notes: 'Give 3 practical habits students can start today.', layout: 'split' },
      { title: 'Thank You & Questions', body: 'Prepared in FINE Present · Together for a Resilient Future.', notes: 'Open the floor for Q&A.', layout: 'hero' },
    ],
  },
  {
    id: 'tpl-pitch',
    title: 'Startup Pitch Deck',
    category: 'Business',
    targetApp: 'slides',
    summary: 'Investor-grade pitch structure covering problem, product & traction.',
    slidesDeck: [
      { title: 'FINE Universal Platform', body: 'One Browser. One Office. One Intelligent Computer Experience.', notes: 'Open strong with the unified computing vision.', layout: 'hero' },
      { title: 'The Problem', body: 'Fragmented apps, insecure downloads, and slow subscription-locked office tools.', notes: 'Emphasize cost and security fatigue for SMEs.', layout: 'split' },
      { title: 'The Solution', body: 'Local-first Windows/Linux suite with integrated multi-provider AI and zero-trust security.', notes: 'Demo instant offline responsiveness.', layout: 'kpi' },
      { title: 'Traction & Unit Economics', body: '15GB Cloud Sync · 50+ languages · Built-in PDF, Sheets, Writer & Present.', notes: 'Walk through adoption velocity.', layout: 'kpi' },
      { title: 'Product Roadmap', body: 'Desktop WinUI 3 native bridge, enterprise admin console & offline LLM pack.', notes: 'Share Q3-Q4 milestones.', layout: 'split' },
    ],
  },
];

const SLIDE_THEME_CLASSES: Record<SlideThemeId, { stage: string; sub: string; chip: string }> = {
  business: { stage: 'bg-gradient-to-br from-[#0B132B] via-[#13294B] to-[#3A86EF] text-white', sub: 'text-blue-100', chip: 'text-blue-200' },
  school: { stage: 'bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white', sub: 'text-emerald-100', chip: 'text-emerald-200' },
  minimal: { stage: 'bg-white text-slate-900 border-2 border-slate-200', sub: 'text-slate-600', chip: 'text-slate-400' },
  colorful: { stage: 'bg-gradient-to-br from-[#4338CA] via-[#7C3AED] to-[#DB2777] text-white', sub: 'text-fuchsia-100', chip: 'text-pink-200' },
  dark: { stage: 'bg-gradient-to-br from-slate-950 to-slate-800 text-slate-100', sub: 'text-slate-300', chip: 'text-slate-400' },
  '3d': { stage: 'bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0891B2] text-white shadow-2xl', sub: 'text-cyan-100', chip: 'text-cyan-200' },
};

function parseCellCoord(ref: string): { row: number; col: number } | null {
  const m = ref.trim().toUpperCase().match(/^([A-F])(\d+)$/);
  if (!m) return null;
  const col = COL_LABELS.indexOf(m[1]);
  const row = Number(m[2]) - 1;
  if (col < 0 || row < 0) return null;
  return { row, col };
}

function expandRange(rangeStr: string): Array<{ row: number; col: number }> {
  const parts = rangeStr.split(':').map((s) => s.trim());
  if (parts.length === 1) {
    const c = parseCellCoord(parts[0]);
    return c ? [c] : [];
  }
  const start = parseCellCoord(parts[0]);
  const end = parseCellCoord(parts[1]);
  if (!start || !end) return [];
  const coords: Array<{ row: number; col: number }> = [];
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      coords.push({ row: r, col: c });
    }
  }
  return coords;
}

function evaluateCell(cells: string[][], row: number, col: number, visited = new Set<string>()): string | number {
  const key = `${row}:${col}`;
  if (visited.has(key)) return '#CYCLE!';
  const raw = (cells[row]?.[col] ?? '').trim();
  if (!raw.startsWith('=')) {
    if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
    return raw;
  }

  visited.add(key);
  const expr = raw.slice(1).trim();
  const numOf = (r: number, c: number): number => {
    const v = evaluateCell(cells, r, c, new Set(visited));
    return typeof v === 'number' ? v : Number(v) || 0;
  };
  const evalScalar = (token: string): number | string => {
    const t = token.trim();
    const coord = parseCellCoord(t);
    if (coord) return evaluateCell(cells, coord.row, coord.col, new Set(visited));
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
    if (t !== '' && !Number.isNaN(Number(t))) return Number(t);
    return t;
  };

  try {
    const fnMatch = expr.match(/^([A-Z]+)\((.+)\)$/i);
    if (fnMatch) {
      const fn = fnMatch[1].toUpperCase();
      const argsRaw = fnMatch[2];
      if (['SUM', 'AVERAGE', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(fn)) {
        const coords = argsRaw.split(',').flatMap((part) => expandRange(part));
        const nums = coords.map((pt) => numOf(pt.row, pt.col));
        if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
        if (fn === 'AVERAGE' || fn === 'AVG') return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0;
        if (fn === 'COUNT') return coords.filter((pt) => (cells[pt.row]?.[pt.col] ?? '').trim() !== '').length;
        if (fn === 'MIN') return nums.length ? Math.min(...nums) : 0;
        if (fn === 'MAX') return nums.length ? Math.max(...nums) : 0;
      }
      if (fn === 'IF') {
        const parts = argsRaw.split(',');
        if (parts.length >= 3) {
          const cond = parts[0].trim();
          const opMatch = cond.match(/^(.+?)(>=|<=|!=|=|>|<)(.+)$/);
          let result = false;
          if (opMatch) {
            const left = evalScalar(opMatch[1]);
            const op = opMatch[2];
            const right = evalScalar(opMatch[3]);
            const ln = Number(left);
            const rn = Number(right);
            const bothNum = !Number.isNaN(ln) && !Number.isNaN(rn) && left !== '' && right !== '';
            if (op === '>') result = bothNum ? ln > rn : String(left) > String(right);
            else if (op === '<') result = bothNum ? ln < rn : String(left) < String(right);
            else if (op === '>=') result = ln >= rn;
            else if (op === '<=') result = ln <= rn;
            else if (op === '!=') result = String(left) !== String(right);
            else result = String(left) === String(right);
          }
          return evalScalar(result ? parts[1] : parts[2]);
        }
      }
    }

    // Simple arithmetic expression e.g. B2*C2-D2
    const replaced = expr.replace(/\b([A-F]\d+)\b/gi, (match) => {
      const c = parseCellCoord(match);
      if (!c) return '0';
      return String(numOf(c.row, c.col));
    });
    if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
      const computed = Function(`"use strict"; return (${replaced})`)();
      if (typeof computed === 'number' && Number.isFinite(computed)) {
        return Math.round(computed * 100) / 100;
      }
    }
    return raw;
  } catch {
    return '#ERR';
  }
}

export const FineOfficeSuite: React.FC<FineOfficeSuiteProps> = ({
  initialApp = 'writer',
  files = [],
  activeFile,
  onSaveFile,
  onSendToPrint,
  onTrashFile,
  onRestoreFile,
}) => {
  const [activeApp, setActiveApp] = useState<OfficeAppId>(initialApp);
  const [homeSection, setHomeSection] = useState<HomeSection>('all');
  const [templateFilter, setTemplateFilter] = useState<'All' | 'Business' | 'School' | 'Finance' | 'Personal'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fine_office_starred_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [aiBusy, setAiBusy] = useState(false);
  const [officeNotice, setOfficeNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialApp) setActiveApp(initialApp);
  }, [initialApp]);

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('fine_office_starred_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // ---------------- 1. FINE WRITER STATE ----------------
  const [writerRibbon, setWriterRibbon] = useState<WriterRibbonTab>('Home');
  const [docTitle, setDocTitle] = useState('Quarterly Platform Report.docx');
  const [docText, setDocText] = useState(
    '## FINE Office — Local Offline Document\n\nFINE Writer supports offline editing for DOCX and ODT documents, letters, and structured reports without requiring an internet connection.\n\n## Key Highlights\n1. Instant 5-second local autosave & Version History snapshots.\n2. One-click conversion to PDF or direct printing via FINE Print.\n3. AI writing assistance, grammar correction, and English-to-Urdu translation.'
  );
  const [docVersions, setDocVersions] = useState<FileVersionEntry[]>([
    {
      savedAt: new Date(Date.now() - 120_000).toISOString().slice(0, 19).replace('T', ' '),
      content: 'FINE Office — Initial Draft\n\nFINE Writer supports offline editing for DOCX and ODT documents with encrypted FINE Explorer storage.',
    },
  ]);
  const [showVersions, setShowVersions] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState('Synced');
  const [dirtyWriter, setDirtyWriter] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [urduRtl, setUrduRtl] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontSizePx, setFontSizePx] = useState(14);
  const [lineSpacing, setLineSpacing] = useState<'1.4' | '1.75' | '2.1'>('1.75');
  const [docTextColor, setDocTextColor] = useState('#0F172A');
  const [highlightMode, setHighlightMode] = useState(false);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [marginSize, setMarginSize] = useState<'Normal' | 'Narrow' | 'Wide'>('Normal');
  const [showRuler, setShowRuler] = useState(true);
  const [pageView, setPageView] = useState(true);
  const [docZoom, setDocZoom] = useState(100);
  const [docHeader, setDocHeader] = useState('FINE OFFICE · CONFIDENTIAL DRAFT');
  const [docFooter, setDocFooter] = useState('Saved locally & encrypted · Page 1');
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [embeddedImageUrl, setEmbeddedImageUrl] = useState<string | null>(null);
  const [writerComments, setWriterComments] = useState<WriterComment[]>([
    {
      id: 'wc-1',
      author: 'Team Reviewer',
      text: 'Verified offline autosave timing and executive summary points.',
      createdAt: '09:42',
      resolved: false,
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [trackChanges, setTrackChanges] = useState(true);
  const [changeLog, setChangeLog] = useState<string[]>(['Document initialized locally']);
  const [writerAiPrompt, setWriterAiPrompt] = useState('');
  const writerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ---------------- 1B. FINE NOTES STATE ----------------
  const [noteTitle, setNoteTitle] = useState('Daily Meeting Notes.note');
  const [noteBody, setNoteBody] = useState('• Review FINE OS desktop & ATM mode rollout\n• Verify FineDB backup snapshot schedule');
  const [noteTasks, setNoteTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: 't1', text: 'Verify USB Auto-Scan & Explorer mount', done: true },
    { id: 't2', text: 'Test Urdu voice captions in Video Call', done: false },
    { id: 't3', text: 'Export weekly .finebak archive', done: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [noteVoiceActive, setNoteVoiceActive] = useState(false);

  // ---------------- 2. FINE SHEETS STATE ----------------
  const [sheetRibbon, setSheetRibbon] = useState<SheetRibbonTab>('Home');
  const [sheetsList, setSheetsList] = useState<SheetTabData[]>([
    { id: 'sh-1', name: 'Sheet1 · Operations', cells: INITIAL_SHEET_CELLS },
    {
      id: 'sh-2',
      name: 'Sheet2 · Forecast',
      cells: [
        ['Month', 'Users', 'Growth %', 'Target', 'Variance', 'Grade'],
        ['Jan', '1200', '8', '1100', '=B2-D2', '=IF(E2>=0,"Beat","Miss")'],
        ['Feb', '1480', '23', '1350', '=B3-D3', '=IF(E3>=0,"Beat","Miss")'],
        ['Mar', '1820', '23', '1600', '=B4-D4', '=IF(E4>=0,"Beat","Miss")'],
        ['Total', '=SUM(B2:B4)', '=AVERAGE(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)', '=COUNT(B2:B4)'],
      ],
    },
  ]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 1, col: 4 });
  const [freezeHeader, setFreezeHeader] = useState(true);
  const [sheetFilterQuery, setSheetFilterQuery] = useState('');
  const [condThreshold, setCondThreshold] = useState<number>(1000);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut'>('bar');
  const [sheetAiPrompt, setSheetAiPrompt] = useState('');
  const [sheetInsight, setSheetInsight] = useState<string | null>(null);

  // ---------------- 3. FINE PRESENT (SLIDES) STATE ----------------
  const [slides, setSlides] = useState<SlideItem[]>([
    {
      title: 'FINE OS — One OS. Every Machine.',
      body: 'Unified browser, 4 AI brains, office suite, communication, ATM terminal, and independent recovery.',
      notes: 'Introduce FINE Universal Platform and highlight cross-device synchronization.',
      layout: 'hero',
    },
    {
      title: 'Local Offline Readiness',
      body: 'Writer, Notes, Sheets, Present, PDF, Files, and Hardware management remain fast and reliable even offline.',
      notes: 'Remind attendees that all documents autosave locally every 5 seconds.',
      layout: 'split',
    },
    {
      title: 'Zero Trust Security & IP Shield',
      body: 'Protected by layered browser filtering, IP brute-force blocking, Reverse-PIN alerts, and FineDB encryption.',
      notes: 'Highlight Reverse-PIN and encrypted local FineDB protection.',
      layout: 'kpi',
    },
  ]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideTheme, setSlideTheme] = useState<SlideThemeId>('business');
  const [slideTransition, setSlideTransition] = useState<SlideTransitionId>('fade');
  const [slideTopic, setSlideTopic] = useState('');
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterElapsed, setPresenterElapsed] = useState(0);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [presenterCoachFeedback, setPresenterCoachFeedback] = useState<string | null>(null);
  const slideStageRef = useRef<HTMLDivElement | null>(null);

  // ---------------- 4. FINE PDF STATE ----------------
  const [pdfSource, setPdfSource] = useState('Network Architecture Blueprint.pdf');
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pdfNotes, setPdfNotes] = useState(
    'Verified layout for A4 duplex printing. Upload any local PDF above to inspect, split, merge, sign, edit notes, or convert.'
  );
  const [pdfSignerName, setPdfSignerName] = useState('FINE Verified Signer');
  const [pdfSignatureStamp, setPdfSignatureStamp] = useState<{
    signer: string;
    signedAt: string;
    hash: string;
  } | null>(null);
  const [pdfSplitRange, setPdfSplitRange] = useState('1-3');
  const [pdfMergedFiles, setPdfMergedFiles] = useState<string[]>([]);
  const [convertFormat, setConvertFormat] = useState<'DOCX' | 'PPTX' | 'CSV'>('DOCX');
  const [convertNotice, setConvertNotice] = useState<string | null>(null);

  // ---------------- 5. FINE DESIGN STATE ----------------
  const designCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState('#3A86EF');
  const [brushSize, setBrushSize] = useState(4);
  const [drawTool, setDrawTool] = useState<'freehand' | 'line' | 'rect'>('freehand');
  const isDrawingRef = useRef(false);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);

  // ---------------- 6. FINE AI STUDIO STATE ----------------
  const [aiStudioMode, setAiStudioMode] = useState<AiStudioMode>('writer');
  const [aiStudioInput, setAiStudioInput] = useState('');
  const [aiStudioOutput, setAiStudioOutput] = useState<string | null>(null);
  const [aiPromptHistory, setAiPromptHistory] = useState<Array<{ id: string; mode: AiStudioMode; prompt: string; output: string; at: string }>>(() => {
    try {
      const saved = localStorage.getItem('fine_office_ai_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync incoming Explorer file
  useEffect(() => {
    if (!activeFile || !activeFile.content) return;
    if (activeFile.kind === 'note') {
      setNoteTitle(activeFile.name);
      setNoteBody(activeFile.content);
      setActiveApp('notes');
    } else if (activeFile.kind === 'document') {
      setDocTitle(activeFile.name);
      setDocText(activeFile.content);
      if (activeFile.versions) setDocVersions(activeFile.versions);
      setActiveApp('writer');
    } else if (activeFile.kind === 'spreadsheet') {
      const rows = activeFile.content
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((line) => line.split(',').slice(0, 6));
      if (rows.length > 0) {
        setSheetsList((prev) =>
          prev.map((sh, i) => (i === 0 ? { ...sh, name: activeFile.name, cells: rows } : sh))
        );
        setActiveSheetIdx(0);
      }
      setActiveApp('sheets');
    }
  }, [activeFile]);

  // 5-second Auto-Save loop for FINE Writer
  useEffect(() => {
    if (!dirtyWriter) return;
    const timer = window.setTimeout(() => {
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const nextVersions = [{ savedAt: ts, content: docText }, ...docVersions].slice(0, 12);
      setDocVersions(nextVersions);
      onSaveFile(docTitle, 'document', docText, nextVersions, true);
      setLastAutoSaved(`Auto-saved ${ts.slice(11)}`);
      setDirtyWriter(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dirtyWriter, docTitle, docText, docVersions, onSaveFile]);

  // Presenter timer loop
  useEffect(() => {
    if (!presenterOpen) {
      setPresenterElapsed(0);
      return;
    }
    const id = window.setInterval(() => setPresenterElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [presenterOpen]);

  // Cleanup PDF object URL
  useEffect(() => {
    return () => {
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    };
  }, [pdfObjectUrl]);

  // Initialize FINE Design canvas
  useEffect(() => {
    if (activeApp !== 'design') return;
    const canvas = designCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!canvas.dataset.initialized) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      canvas.dataset.initialized = 'true';
    }
  }, [activeApp]);

  const callOfficeAi = useCallback(async (prompt: string): Promise<string | null> => {
    setAiBusy(true);
    setOfficeNotice(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'office', brain: 'pro', prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOfficeNotice(data.error || 'AI service unavailable.');
        return null;
      }
      return data.text || '';
    } catch {
      setOfficeNotice('Unable to reach FINE AI endpoint.');
      return null;
    } finally {
      setAiBusy(false);
    }
  }, []);

  const downloadFile = (filename: string, text: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Writer helpers
  const recordWriterEdit = (nextVal: string, label?: string) => {
    setDocText(nextVal);
    setDirtyWriter(true);
    if (trackChanges && label) {
      const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setChangeLog((prev) => [`${stamp} · ${label}`, ...prev.slice(0, 14)]);
    }
  };

  const applyFormatSnippet = (prefix: string, suffix = '', label = 'Formatted selection') => {
    const el = writerTextareaRef.current;
    if (!el) {
      recordWriterEdit(`${docText}\n${prefix}Text${suffix}`, label);
      return;
    }
    const start = el.selectionStart ?? docText.length;
    const end = el.selectionEnd ?? docText.length;
    const selected = docText.slice(start, end) || 'Text';
    const next = `${docText.slice(0, start)}${prefix}${selected}${suffix}${docText.slice(end)}`;
    recordWriterEdit(next, label);
  };

  // Notes speech dictation
  const startNoteDictation = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      setOfficeNotice('Speech dictation is unavailable in this browser.');
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
      rec.lang = urduRtl ? 'ur-PK' : 'en-US';
      setNoteVoiceActive(true);
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setNoteBody((prev) => (prev ? `${prev}\n• ${transcript}` : `• ${transcript}`));
        }
      };
      rec.onend = () => setNoteVoiceActive(false);
      rec.onerror = () => setNoteVoiceActive(false);
      rec.start();
    } catch {
      setNoteVoiceActive(false);
    }
  };

  // Sheet helpers
  const activeSheet = sheetsList[activeSheetIdx] || sheetsList[0];

  const updateCell = (r: number, c: number, val: string) => {
    setSheetsList((prev) =>
      prev.map((sh, idx) => {
        if (idx !== activeSheetIdx) return sh;
        const nextCells = sh.cells.map((rowArr, ri) => (ri === r ? rowArr.map((cell, ci) => (ci === c ? val : cell)) : rowArr));
        return { ...sh, cells: nextCells };
      })
    );
  };

  const addSheetRow = () => {
    setSheetsList((prev) =>
      prev.map((sh, idx) => {
        if (idx !== activeSheetIdx) return sh;
        const nextIdx = sh.cells.length + 1;
        const newRow = [`Item ${nextIdx - 1}`, '100', '120', '140', `=SUM(B${nextIdx}:D${nextIdx})`, '=IF(E' + nextIdx + '>300,"Optimal","Normal")'];
        return { ...sh, cells: [...sh.cells, newRow] };
      })
    );
  };

  const sortSheetByColumn = (colIdx: number) => {
    setSheetsList((prev) =>
      prev.map((sh, idx) => {
        if (idx !== activeSheetIdx || sh.cells.length <= 2) return sh;
        const [header, ...body] = sh.cells;
        const sorted = [...body].sort((a, b) => {
          const av = evaluateCell(sh.cells, sh.cells.indexOf(a), colIdx);
          const bv = evaluateCell(sh.cells, sh.cells.indexOf(b), colIdx);
          if (typeof av === 'number' && typeof bv === 'number') return bv - av;
          return String(av).localeCompare(String(bv));
        });
        return { ...sh, cells: [header, ...sorted] };
      })
    );
  };

  const sheetChartData = useMemo(() => {
    return activeSheet.cells
      .slice(1)
      .map((row, rOffset) => {
        const label = row[0] || `Row ${rOffset + 2}`;
        if (label.toLowerCase().includes('sum') || label.toLowerCase().includes('total')) return null;
        const v1 = Number(evaluateCell(activeSheet.cells, rOffset + 1, 1)) || 0;
        const v2 = Number(evaluateCell(activeSheet.cells, rOffset + 1, 2)) || 0;
        const v3 = Number(evaluateCell(activeSheet.cells, rOffset + 1, 3)) || 0;
        const computedTotal = Number(evaluateCell(activeSheet.cells, rOffset + 1, 4)) || v1 + v2 + v3;
        return { label, value: Math.max(0, computedTotal) };
      })
      .filter((x): x is { label: string; value: number } => x !== null && x.value >= 0);
  }, [activeSheet]);

  const maxChartVal = Math.max(1, ...sheetChartData.map((d) => d.value));

  // Design canvas drawing
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = designCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStackRef.current.length > 15) undoStackRef.current.shift();

    const pos = getCanvasCoords(e, canvas);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    isDrawingRef.current = true;

    if (drawTool === 'freehand') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      shapeStartRef.current = pos;
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = designCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pos = getCanvasCoords(e, canvas);

    if (drawTool === 'freehand') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (shapeStartRef.current && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      const start = shapeStartRef.current;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      if (drawTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (drawTool === 'rect') {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      }
    }
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    shapeStartRef.current = null;
    snapshotRef.current = null;
  };

  const undoDraw = () => {
    const canvas = designCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const prev = undoStackRef.current.pop();
    if (canvas && ctx && prev) ctx.putImageData(prev, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = designCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Template opener
  const applyTemplate = (tpl: OfficeTemplate) => {
    if (tpl.targetApp === 'writer' && tpl.writerBody) {
      setDocTitle(tpl.writerTitle || `${tpl.title}.docx`);
      setDocText(tpl.writerBody);
      setDirtyWriter(true);
      setActiveApp('writer');
      setOfficeNotice(`Loaded "${tpl.title}" template in FINE Writer.`);
    } else if (tpl.targetApp === 'sheets' && tpl.sheetCells) {
      setSheetsList((prev) => [{ id: `sh-${Date.now()}`, name: tpl.sheetName || tpl.title, cells: tpl.sheetCells! }, ...prev.slice(1)]);
      setActiveSheetIdx(0);
      setActiveApp('sheets');
      setOfficeNotice(`Loaded "${tpl.title}" template with live formulas in FINE Sheets.`);
    } else if (tpl.targetApp === 'slides' && tpl.slidesDeck) {
      setSlides(tpl.slidesDeck);
      setSlideIdx(0);
      setActiveApp('slides');
      setOfficeNotice(`Loaded "${tpl.title}" (${tpl.slidesDeck.length} slides) in FINE Present.`);
    }
  };

  // Cross-App Converters
  const convertDocToSlides = async () => {
    const aiText = await callOfficeAi(
      `Convert this document into a 5-slide presentation. Format each line strictly as: Slide X: Title | Concise bullet summary | Short speaker note\n\nDocument:\n${docText}`
    );
    if (aiText) {
      const parsed = aiText
        .split('\n')
        .map((line) => line.replace(/^Slide\s*\d+:\s*/i, '').trim())
        .filter((l) => l.includes('|'))
        .map((l) => {
          const [title, body, notes] = l.split('|');
          return {
            title: (title || 'Slide').trim(),
            body: (body || '').trim(),
            notes: (notes || 'Discuss key points with audience.').trim(),
            layout: 'split' as SlideLayoutId,
          };
        });
      if (parsed.length > 0) {
        setSlides(parsed);
        setSlideIdx(0);
        setActiveApp('slides');
        setOfficeNotice(`Converted "${docTitle}" into a ${parsed.length}-slide deck in FINE Present.`);
        return;
      }
    }
    // Deterministic heading fallback if AI output wasn't delimited cleanly
    const blocks = docText
      .split(/\n##\s+/)
      .filter((b) => b.trim().length > 0)
      .slice(0, 6)
      .map((blk, i) => {
        const [first, ...rest] = blk.split('\n');
        return {
          title: first.replace(/^#+\s*/, '').trim() || `Slide ${i + 1}`,
          body: rest.join(' ').trim() || docTitle,
          notes: `Key highlights from ${docTitle}`,
          layout: (i === 0 ? 'hero' : 'split') as SlideLayoutId,
        };
      });
    if (blocks.length > 0) {
      setSlides(blocks);
      setSlideIdx(0);
      setActiveApp('slides');
      setOfficeNotice(`Converted "${docTitle}" sections into ${blocks.length} slides.`);
    }
  };

  const convertSheetToSlide = () => {
    const summaryLines = sheetChartData.map((d) => `${d.label}: ${d.value}`).join(' · ');
    const newSlide: SlideItem = {
      title: `${activeSheet.name} — Key Numbers`,
      body: summaryLines || 'Spreadsheet metrics synchronized cleanly.',
      notes: `Generated directly from FINE Sheets tab "${activeSheet.name}".`,
      layout: 'kpi',
    };
    setSlides((prev) => [...prev, newSlide]);
    setSlideIdx(slides.length);
    setActiveApp('slides');
    setOfficeNotice(`Added summary slide from "${activeSheet.name}" to FINE Present.`);
  };

  const convertPdfToWriterDoc = () => {
    const newTitle = pdfSource.replace(/\.pdf$/i, '.docx');
    setDocTitle(newTitle);
    setDocText(`## Extracted Document: ${pdfSource}\n\n${pdfNotes}${pdfSignatureStamp ? `\n\n## Digital Verification\nSigned by ${pdfSignatureStamp.signer} (${pdfSignatureStamp.hash})` : ''}`);
    setDirtyWriter(true);
    setActiveApp('writer');
    setOfficeNotice(`Converted PDF annotations into "${newTitle}" in FINE Writer.`);
  };

  const runAiStudioPrompt = async (customPrompt?: string) => {
    const q = (customPrompt ?? aiStudioInput).trim();
    if (!q) return;
    if (customPrompt) setAiStudioInput(customPrompt);

    if (aiStudioMode === 'sheets') {
      const prompt = `Create a structured spreadsheet table for: "${q}". Return ONLY lines formatted as pipe-separated cells with 6 columns (First line is headers, columns 5 and 6 can be numbers or =SUM/=IF formulas), maximum 6 rows. No markdown code fences.`;
      const txt = await callOfficeAi(prompt);
      if (!txt) return;
      const rows = txt
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.includes('|') && !l.startsWith('|---') && !l.startsWith('---'))
        .map((l) =>
          l
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim())
            .slice(0, 6)
        )
        .filter((r) => r.length >= 3);
      if (rows.length >= 2) {
        const padded = rows.map((r) => [...r, ...Array(Math.max(0, 6 - r.length)).fill('')].slice(0, 6));
        setSheetsList((prev) => [{ id: `sh-ai-${Date.now()}`, name: q.slice(0, 22), cells: padded }, ...prev]);
        setActiveSheetIdx(0);
      }
      setAiStudioOutput(txt);
      const entry = { id: `aih-${Date.now()}`, mode: aiStudioMode, prompt: q, output: txt, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAiPromptHistory((prev) => {
        const next = [entry, ...prev].slice(0, 20);
        try {
          localStorage.setItem('fine_office_ai_history_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      return;
    }

    if (aiStudioMode === 'slides') {
      const txt = await callOfficeAi(
        `Create an 8-slide presentation for "${q}". Format every slide strictly as:\nSlide X: Title | Concise slide body | Brief speaker note`
      );
      if (!txt) return;
      const parsed = txt
        .split('\n')
        .map((l) => l.replace(/^Slide\s*\d+:\s*/i, '').trim())
        .filter((l) => l.includes('|'))
        .map((l, i) => {
          const [title, body, notes] = l.split('|');
          return {
            title: (title || `Slide ${i + 1}`).trim(),
            body: (body || '').trim(),
            notes: (notes || '').trim(),
            layout: (i === 0 ? 'hero' : i % 2 === 0 ? 'kpi' : 'split') as SlideLayoutId,
          };
        });
      if (parsed.length > 0) {
        setSlides(parsed);
        setSlideIdx(0);
      }
      setAiStudioOutput(txt);
      const entry = { id: `aih-${Date.now()}`, mode: aiStudioMode, prompt: q, output: txt, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAiPromptHistory((prev) => [entry, ...prev].slice(0, 20));
      return;
    }

    const txt = await callOfficeAi(
      aiStudioMode === 'image'
        ? `Create a detailed visual layout specification, color palette, typography pairing, and design brief for: ${q}`
        : `You are FINE Office AI (${aiStudioMode} specialist). Fulfill this request cleanly and professionally:\n\n${q}`
    );
    if (!txt) return;
    setAiStudioOutput(txt);
    const entry = { id: `aih-${Date.now()}`, mode: aiStudioMode, prompt: q, output: txt, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAiPromptHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try {
        localStorage.setItem('fine_office_ai_history_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Filtered Explorer files for Office Home
  const visibleOfficeFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter((f) => {
      const isTrash = Boolean(f.deleted);
      if (homeSection === 'trash') return isTrash;
      if (isTrash) return false;
      if (homeSection === 'starred' && !starredIds.includes(f.id)) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, homeSection, starredIds, searchQuery]);

  const storageUsedMb = useMemo(() => {
    const kbTotal = files.reduce((sum, f) => {
      const num = parseFloat(f.size) || 12;
      return sum + (f.size.toLowerCase().includes('mb') ? num * 1024 : num);
    }, 180);
    return Math.round((kbTotal / 1024) * 10) / 10;
  }, [files]);

  const currentSlide = slides[slideIdx] || slides[0];
  const themeStyle = SLIDE_THEME_CLASSES[slideTheme];
  const currentCellRef = `${COL_LABELS[selectedCell.col] || 'A'}${selectedCell.row + 1}`;
  const currentCellRaw = activeSheet.cells[selectedCell.row]?.[selectedCell.col] ?? '';

  const wordCount = docText.trim().split(/\s+/).filter(Boolean).length;
  const readingMins = Math.max(1, Math.ceil(wordCount / 200));

  const appLabels: Record<OfficeAppId, string> = {
    home: 'Office Home',
    writer: 'FINE Writer',
    sheets: 'FINE Sheets',
    slides: 'FINE Present',
    pdf: 'FINE PDF',
    design: 'FINE Design',
    notes: 'FINE Notes',
    ai_studio: 'AI Studio',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[680px]">
      {/* LEFT OFFICE RAIL */}
      <aside className="no-print lg:w-60 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <div className="px-2 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">FINE Office Suite</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Online + Offline Engine</div>
          </div>

          <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
            {(
              [
                { id: 'home', label: 'Home', icon: Home },
                { id: 'writer', label: 'Writer', icon: FileText },
                { id: 'sheets', label: 'Sheets', icon: Table2 },
                { id: 'slides', label: 'Present', icon: Presentation },
                { id: 'pdf', label: 'PDF', icon: FileCheck2 },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'notes', label: 'Notes', icon: StickyNote },
                { id: 'ai_studio', label: 'AI Studio', icon: Sparkles },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = activeApp === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveApp(item.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0B132B] dark:bg-[#3A86EF] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1 hidden lg:block">
            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Workspace</div>
            {(
              [
                { id: 'templates', label: 'Templates', icon: Layers },
                { id: 'recent', label: 'Recent Files', icon: Clock },
                { id: 'starred', label: 'Starred', icon: Star },
                { id: 'trash', label: 'Trash', icon: Trash2 },
              ] as const
            ).map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeApp === 'home' && homeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setHomeSection(sec.id);
                    setActiveApp('home');
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-[#edf3ff] dark:bg-slate-800 text-[#1d4f9c] dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 15GB FINE Cloud Storage Meter */}
        <div className="hidden lg:block border-t border-slate-100 dark:border-slate-800 pt-3 px-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-300">FINE Cloud</span>
            <span className="font-mono text-slate-500 tabular-nums">{storageUsedMb} MB / 15 GB</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#3A86EF] rounded-full"
              style={{ width: `${Math.min(100, Math.max(4, Math.round((storageUsedMb / 15360) * 100)))}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            5s Auto-Save · {dirtyWriter ? 'Saving...' : lastAutoSaved}
          </div>
        </div>
      </aside>

      {/* MAIN OFFICE VIEWPORT */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* TOP OFFICE HEADER BAR */}
        <header className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setHomeSection('all');
                setActiveApp('home');
              }}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              FINE Office
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-900 dark:text-white">{appLabels[activeApp]}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeApp !== 'home' && e.target.value.trim()) {
                    setHomeSection('recent');
                  }
                }}
                placeholder="Search Office files..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNewMenu((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-[#0B132B] dark:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
              {showNewMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 z-30 text-xs">
                  {[
                    { label: 'Blank Document', app: 'writer' as OfficeAppId },
                    { label: 'Blank Spreadsheet', app: 'sheets' as OfficeAppId },
                    { label: 'New Presentation', app: 'slides' as OfficeAppId },
                    { label: 'Quick Note', app: 'notes' as OfficeAppId },
                    { label: 'PDF Workspace', app: 'pdf' as OfficeAppId },
                    { label: 'Design Canvas', app: 'design' as OfficeAppId },
                  ].map((opt) => (
                    <button
                      key={opt.app}
                      type="button"
                      onClick={() => {
                        if (opt.app === 'writer') {
                          setDocTitle('Untitled Document.docx');
                          setDocText('');
                          setDirtyWriter(false);
                        }
                        setActiveApp(opt.app);
                        setShowNewMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveApp('ai_studio')}
              className="px-3 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Spark
            </button>
          </div>
        </header>

        {officeNotice && (
          <div className="no-print bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between gap-2">
            <span>{officeNotice}</span>
            <button type="button" onClick={() => setOfficeNotice(null)} className="font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ==================== 0. OFFICE HOME & TEMPLATES ==================== */}
        {activeApp === 'home' && (
          <div className="space-y-5">
            {/* Quick Create Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  title: 'New Document',
                  sub: 'A4 Page · Auto-Save · Urdu/En',
                  icon: FileText,
                  accent: 'text-[#3A86EF]',
                  onClick: () => setActiveApp('writer'),
                },
                {
                  title: 'New Spreadsheet',
                  sub: 'Formulas · Charts · Multi-Sheet',
                  icon: FileSpreadsheet,
                  accent: 'text-[#16A34A]',
                  onClick: () => setActiveApp('sheets'),
                },
                {
                  title: 'New Presentation',
                  sub: '6 Themes · Laser Presenter',
                  icon: Presentation,
                  accent: 'text-amber-600',
                  onClick: () => setActiveApp('slides'),
                },
                {
                  title: 'Ask AI Studio',
                  sub: 'Draft CV, Invoice, Deck or Sheet',
                  icon: Sparkles,
                  accent: 'text-indigo-600 dark:text-indigo-400',
                  onClick: () => setActiveApp('ai_studio'),
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={card.onClick}
                    className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#3A86EF] rounded-xl p-4 transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${card.accent} mb-2`} />
                    <div className="text-sm font-bold">{card.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{card.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Template Gallery */}
            {(homeSection === 'all' || homeSection === 'templates') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold">Template Gallery</h2>
                    <p className="text-xs text-slate-500">One-click ready layouts for work, finance, and school.</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(['All', 'Business', 'Finance', 'School', 'Personal'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTemplateFilter(cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          templateFilter === cat
                            ? 'bg-[#0B132B] dark:bg-[#3A86EF] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {OFFICE_TEMPLATES.filter((t) => templateFilter === 'All' || t.category === templateFilter).map((tpl) => (
                    <div
                      key={tpl.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 bg-[#F8F9FA] dark:bg-slate-800/40"
                    >
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {tpl.category} · {tpl.targetApp === 'slides' ? 'Present' : tpl.targetApp === 'sheets' ? 'Sheets' : 'Writer'}
                        </div>
                        <div className="text-sm font-bold mt-1">{tpl.title}</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.summary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="w-full py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#3A86EF] text-xs font-semibold"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent / Starred / Trash Files */}
            {homeSection !== 'templates' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold">
                    {homeSection === 'starred'
                      ? 'Starred Office Files'
                      : homeSection === 'trash'
                      ? 'Office Trash Bin'
                      : 'Recent & Explorer Documents'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['all', 'recent', 'starred', 'trash'] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setHomeSection(sec)}
                        className={`px-2.5 py-1 rounded capitalize font-semibold ${
                          homeSection === sec
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleOfficeFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <div>No matching files in this view.</div>
                    <button
                      type="button"
                      onClick={() => setActiveApp('writer')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] text-white font-semibold"
                    >
                      Create First Document
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                          <th className="py-2.5 px-4 font-semibold">Name</th>
                          <th className="py-2.5 px-4 font-semibold">Type</th>
                          <th className="py-2.5 px-4 font-semibold">Location</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Size</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Modified</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleOfficeFiles.slice(0, 12).map((f) => {
                          const isStarred = starredIds.includes(f.id);
                          return (
                            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 px-4 font-semibold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (f.kind === 'spreadsheet') {
                                      if (f.content) {
                                        const rows = f.content.split('\n').filter(Boolean).map((l) => l.split(',').slice(0, 6));
                                        if (rows.length > 0) setSheetsList((prev) => [{ id: `sh-${f.id}`, name: f.name, cells: rows }, ...prev.slice(1)]);
                                        setActiveSheetIdx(0);
                                      }
                                      setActiveApp('sheets');
                                    } else if (f.kind === 'presentation') {
                                      setActiveApp('slides');
                                    } else if (f.kind === 'pdf') {
                                      setPdfSource(f.name);
                                      if (f.content) setPdfNotes(f.content);
                                      setActiveApp('pdf');
                                    } else if (f.kind === 'note') {
                                      setNoteTitle(f.name);
                                      if (f.content) setNoteBody(f.content);
                                      setActiveApp('notes');
                                    } else {
                                      setDocTitle(f.name);
                                      if (f.content) setDocText(f.content);
                                      setActiveApp('writer');
                                    }
                                  }}
                                  className="hover:text-[#3A86EF] text-left"
                                >
                                  {f.name}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 capitalize text-slate-500">{f.kind}</td>
                              <td className="py-2.5 px-4 text-slate-500">{f.location}</td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">{f.size}</td>
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">{f.modified}</td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleStar(f.id)}
                                    title={isStarred ? 'Unstar' : 'Star file'}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                                  </button>
                                  {f.deleted && onRestoreFile && (
                                    <button
                                      type="button"
                                      onClick={() => onRestoreFile(f.id)}
                                      className="text-emerald-600 font-semibold hover:underline"
                                    >
                                      Restore
                                    </button>
                                  )}
                                  {!f.deleted && onTrashFile && (
                                    <button
                                      type="button"
                                      onClick={() => onTrashFile(f.id)}
                                      title="Move to Trash"
                                      className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== 1. FINE WRITER (WORD PARITY) ==================== */}
        {activeApp === 'writer' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Document Header + Save/Export Controls */}
            <div className="no-print px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => {
                    setDocTitle(e.target.value);
                    setDirtyWriter(true);
                  }}
                  className="text-sm font-bold border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 outline-none pb-0.5 min-w-[200px]"
                />
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {wordCount} words · {readingMins} min read · 1 Collaborator Ready
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVersions((v) => !v)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <History className="w-3.5 h-3.5" />
                  History ({docVersions.length})
                </button>
                <button
                  type="button"
                  onClick={convertDocToSlides}
                  disabled={aiBusy}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Presentation className="w-3.5 h-3.5 text-amber-600" />
                  Doc → Slides
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    const nextVersions = [{ savedAt: ts, content: docText }, ...docVersions].slice(0, 12);
                    setDocVersions(nextVersions);
                    onSaveFile(docTitle, 'document', docText, nextVersions);
                    setDirtyWriter(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* Ribbon Tabs */}
            <div className="no-print bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 px-4 pt-2">
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                {(['File', 'Home', 'Insert', 'Layout', 'Review', 'View', 'AI Studio'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setWriterRibbon(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                      writerRibbon === tab
                        ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Ribbon Sub-Toolbar */}
              <div className="py-2 flex flex-wrap items-center gap-2 text-xs">
                {writerRibbon === 'File' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDocTitle('New Document.docx');
                        setDocText('');
                        setDirtyWriter(false);
                      }}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      New Blank
                    </button>
                    {files.filter((f) => f.kind === 'document' && f.content && !f.deleted).length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const chosen = files.find((f) => f.id === e.target.value);
                          if (chosen) {
                            setDocTitle(chosen.name);
                            setDocText(chosen.content || '');
                            if (chosen.versions) setDocVersions(chosen.versions);
                          }
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="">Open from Explorer...</option>
                        {files
                          .filter((f) => f.kind === 'document' && f.content && !f.deleted)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const htmlDoc = `<html><head><meta charset="utf-8"><title>${docTitle}</title></head><body><h1>${docTitle}</h1><pre style="font-family:sans-serif;white-space:pre-wrap">${docText}</pre></body></html>`;
                        downloadFile(docTitle.replace(/\.(docx|odt|txt)$/i, '.doc'), htmlDoc, 'application/msword');
                      }}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export DOC
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          docTitle.replace(/\.(docx|odt|txt)$/i, '.html'),
                          `<!doctype html><html><meta charset="utf-8"><title>${docTitle}</title><body style="max-width:740px;margin:40px auto;font-family:sans-serif;line-height:1.6"><h1>${docTitle}</h1><pre style="white-space:pre-wrap;font-family:inherit">${docText}</pre></body></html>`,
                          'text/html;charset=utf-8'
                        )
                      }
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      Export HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Save as PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSendToPrint({
                          documentName: docTitle,
                          sourceType: 'Document',
                          paperSize,
                          colorMode: 'Colour',
                          duplex: true,
                          content: docText,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#0B132B] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Send to Print
                    </button>
                  </>
                )}

                {writerRibbon === 'Home' && (
                  <>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as 'sans' | 'serif' | 'mono')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="sans">Plus Jakarta Sans</option>
                      <option value="serif">Georgia Serif</option>
                      <option value="mono">JetBrains Mono</option>
                    </select>
                    <select
                      value={fontSizePx}
                      onChange={(e) => setFontSizePx(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    >
                      {[12, 14, 16, 18, 22].map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}px
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => applyFormatSnippet('**', '**', 'Bold')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Bold">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => applyFormatSnippet('*', '*', 'Italic')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Italic">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => applyFormatSnippet('__', '__', 'Underline')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Underline">
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => applyFormatSnippet('## ', '', 'Heading')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Heading">
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => applyFormatSnippet('• ', '', 'Bullet list')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Bullet">
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => applyFormatSnippet('1. ', '', 'Numbered list')} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700" title="Numbered">
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHighlightMode((v) => !v)}
                      className={`p-1.5 rounded ${highlightMode ? 'bg-amber-200 text-slate-900' : 'hover:bg-white dark:hover:bg-slate-700'}`}
                      title="Paper highlight tint"
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                    </button>
                    <select
                      value={docTextColor}
                      onChange={(e) => setDocTextColor(e.target.value)}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      title="Text Color"
                    >
                      <option value="#0F172A">Ink Black</option>
                      <option value="#1D4ED8">Royal Blue</option>
                      <option value="#15803D">Forest Green</option>
                      <option value="#B91C1C">Crimson</option>
                    </select>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
                      <button type="button" onClick={() => setTextAlign('left')} className={`p-1 ${textAlign === 'left' ? 'text-[#3A86EF]' : ''}`}>
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setTextAlign('center')} className={`p-1 ${textAlign === 'center' ? 'text-[#3A86EF]' : ''}`}>
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setTextAlign('right')} className={`p-1 ${textAlign === 'right' ? 'text-[#3A86EF]' : ''}`}>
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(e.target.value as '1.4' | '1.75' | '2.1')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    >
                      <option value="1.4">Spacing 1.0</option>
                      <option value="1.75">Spacing 1.5</option>
                      <option value="2.1">Spacing 2.0</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setUrduRtl((v) => !v)}
                      className={`px-2 py-1 rounded font-semibold ${urduRtl ? 'bg-[#3A86EF] text-white' : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                    >
                      {urduRtl ? 'RTL (Urdu)' : 'LTR (En)'}
                    </button>
                  </>
                )}

                {writerRibbon === 'Insert' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        recordWriterEdit(
                          `${docText}\n\n| Column A | Column B | Column C |\n| --- | --- | --- |\n| Data 1 | Data 2 | Data 3 |`,
                          'Inserted Table'
                        )
                      }
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1"
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      Insert Table
                    </button>
                    <button
                      type="button"
                      onClick={() => recordWriterEdit(`${docText}\n[Reference Link](https://fine.os)`, 'Inserted Link')}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Insert Link
                    </button>
                    <label className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Insert Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEmbeddedImageUrl(reader.result);
                              recordWriterEdit(`${docText}\n[Embedded Image: ${f.name}]`, `Attached ${f.name}`);
                            }
                          };
                          reader.readAsDataURL(f);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHeaderFooter((v) => !v)}
                      className={`px-2.5 py-1 rounded border font-semibold ${
                        showHeaderFooter ? 'bg-[#3A86EF] text-white border-[#3A86EF]' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      Header / Footer & Page #
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        recordWriterEdit(
                          `${docText}\n\n---\nVerified Signature: FINE Office User · ${new Date().toISOString().slice(0, 10)}`,
                          'Inserted Signature'
                        )
                      }
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    >
                      Signature Block
                    </button>
                  </>
                )}

                {writerRibbon === 'Layout' && (
                  <>
                    <span className="text-slate-500 font-semibold">Page Size:</span>
                    {(['A4', 'Letter', 'Legal'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPaperSize(sz)}
                        className={`px-2.5 py-1 rounded font-semibold ${paperSize === sz ? 'bg-[#0B132B] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                      >
                        {sz}
                      </button>
                    ))}
                    <span className="text-slate-500 font-semibold ml-2">Margins:</span>
                    {(['Normal', 'Narrow', 'Wide'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMarginSize(m)}
                        className={`px-2.5 py-1 rounded font-semibold ${marginSize === m ? 'bg-[#0B132B] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </>
                )}

                {writerRibbon === 'Review' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setTrackChanges((v) => !v)}
                      className={`px-2.5 py-1 rounded font-semibold ${trackChanges ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                    >
                      Track Changes: {trackChanges ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={async () => {
                        const res = await callOfficeAi(
                          `Perform a thorough grammar, clarity, and originality check on this document and list concrete suggestions:\n\n${docText}`
                        );
                        if (res) {
                          setWriterComments((prev) => [
                            { id: `wc-${Date.now()}`, author: 'AI Grammar & Style Check', text: res, createdAt: 'Now', resolved: false },
                            ...prev,
                          ]);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiBusy ? 'Checking...' : 'Grammar & Originality Check'}
                    </button>
                  </>
                )}

                {writerRibbon === 'View' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPageView((v) => !v)}
                      className={`px-2.5 py-1 rounded font-semibold ${pageView ? 'bg-[#0B132B] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                    >
                      {pageView ? 'A4 Page Layout' : 'Full Width View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRuler((v) => !v)}
                      className={`px-2.5 py-1 rounded font-semibold ${showRuler ? 'bg-[#3A86EF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                    >
                      Ruler: {showRuler ? 'Shown' : 'Hidden'}
                    </button>
                    <select
                      value={docZoom}
                      onChange={(e) => setDocZoom(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    >
                      <option value={90}>Zoom 90%</option>
                      <option value={100}>Zoom 100%</option>
                      <option value={115}>Zoom 115%</option>
                    </select>
                  </>
                )}

                {writerRibbon === 'AI Studio' && (
                  <div className="w-full flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={writerAiPrompt}
                      onChange={(e) => setWriterAiPrompt(e.target.value)}
                      placeholder="1-line prompt (e.g. Write formal leave application to manager)..."
                      className="flex-1 min-w-[220px] px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                    <button
                      type="button"
                      disabled={aiBusy || !writerAiPrompt.trim()}
                      onClick={async () => {
                        const out = await callOfficeAi(`Write a complete professional document for: "${writerAiPrompt}"`);
                        if (out) recordWriterEdit(out, 'AI Generated from 1-line prompt');
                      }}
                      className="px-3 py-1 rounded bg-[#3A86EF] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {aiBusy ? 'Writing...' : 'Generate'}
                    </button>
                    {[
                      { label: 'Rewrite', instr: 'Rewrite clearly and professionally' },
                      { label: 'Shorten', instr: 'Shorten concisely by 40% while preserving key points' },
                      { label: 'Expand', instr: 'Expand with richer structure, bullet points, and details' },
                      { label: 'Formal Tone', instr: 'Convert into an executive formal tone' },
                      { label: 'Summarize', instr: 'Create a crisp 5-bullet executive summary at the top followed by the document' },
                    ].map((act) => (
                      <button
                        key={act.label}
                        type="button"
                        disabled={aiBusy}
                        onClick={async () => {
                          const out = await callOfficeAi(`${act.instr}:\n\n${docText}`);
                          if (out) recordWriterEdit(out, `AI ${act.label}`);
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold hover:border-[#3A86EF]"
                      >
                        {act.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={async () => {
                        const out = await callOfficeAi(`Translate naturally between English and Urdu:\n\n${docText}`);
                        if (out) {
                          setUrduRtl(/[\u0600-\u06FF]/.test(out));
                          recordWriterEdit(out, 'Translated Urdu/English');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold inline-flex items-center gap-1"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      Urdu / En
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Version History Drawer */}
            {showVersions && (
              <div className="no-print m-4 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-slate-800/70 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Version History ({docVersions.length} snapshots)</span>
                  <button type="button" onClick={() => setShowVersions(false)} className="text-slate-500 hover:underline">
                    Close
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {docVersions.map((ver, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-[#3A86EF]">{ver.savedAt}</span>
                        <div className="text-slate-500 truncate">{ver.content.slice(0, 90)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDocText(ver.content);
                          setShowVersions(false);
                          setOfficeNotice(`Restored snapshot from ${ver.savedAt}`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#0B132B] text-white font-semibold shrink-0"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Workspace (Page + Optional Review Sidebar) */}
            <div className={`grid ${writerRibbon === 'Review' ? 'xl:grid-cols-[1fr_290px]' : 'grid-cols-1'} bg-slate-100 dark:bg-slate-950/70`}>
              <div className="p-4 sm:p-6 overflow-x-auto">
                {showRuler && pageView && (
                  <div className="no-print max-w-[780px] mx-auto mb-1.5 px-4 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-mono text-slate-400 flex justify-between select-none">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <span key={n}>| {n} in</span>
                    ))}
                  </div>
                )}

                <div
                  className={`fine-printable-sheet mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all ${
                    pageView ? 'max-w-[780px] min-h-[540px]' : 'w-full'
                  } ${marginSize === 'Narrow' ? 'p-5' : marginSize === 'Wide' ? 'p-12' : 'p-8'}`}
                  style={{
                    transform: docZoom !== 100 ? `scale(${docZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    backgroundColor: highlightMode ? '#FEFCE8' : undefined,
                  }}
                >
                  {showHeaderFooter && (
                    <input
                      type="text"
                      value={docHeader}
                      onChange={(e) => setDocHeader(e.target.value)}
                      className="w-full text-[11px] font-mono text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 bg-transparent outline-none"
                    />
                  )}
                  <h1 className="hidden print:block text-xl font-bold mb-4">{docTitle}</h1>
                  {embeddedImageUrl && (
                    <div className="mb-4 relative inline-block">
                      <img src={embeddedImageUrl} alt="Embedded document visual" className="max-h-48 rounded-lg border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setEmbeddedImageUrl(null)}
                        className="no-print absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <textarea
                    ref={writerTextareaRef}
                    rows={16}
                    dir={urduRtl ? 'rtl' : 'ltr'}
                    value={docText}
                    onChange={(e) => recordWriterEdit(e.target.value)}
                    style={{
                      textAlign,
                      fontSize: `${fontSizePx}px`,
                      lineHeight: lineSpacing,
                      color: highlightMode ? '#0F172A' : undefined,
                    }}
                    className={`w-full bg-transparent outline-none resize-y ${
                      fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'
                    } ${highlightMode ? 'text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}
                  />
                  {showHeaderFooter && (
                    <input
                      type="text"
                      value={docFooter}
                      onChange={(e) => setDocFooter(e.target.value)}
                      className="w-full text-[11px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-3 bg-transparent outline-none text-right"
                    />
                  )}
                </div>
              </div>

              {writerRibbon === 'Review' && (
                <div className="no-print border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#3A86EF]" />
                      Comments ({writerComments.length})
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newCommentText.trim()) return;
                        setWriterComments((prev) => [
                          {
                            id: `wc-${Date.now()}`,
                            author: 'You',
                            text: newCommentText.trim(),
                            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            resolved: false,
                          },
                          ...prev,
                        ]);
                        setNewCommentText('');
                      }}
                      className="flex gap-1.5"
                    >
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add review note..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none"
                      />
                      <button type="submit" className="px-2.5 py-1.5 rounded-lg bg-[#0B132B] text-white text-xs font-semibold">
                        Post
                      </button>
                    </form>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {writerComments.map((c) => (
                        <div key={c.id} className={`p-2.5 rounded-lg border text-xs ${c.resolved ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-blue-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
                          <div className="flex justify-between font-semibold">
                            <span>{c.author}</span>
                            <span className="font-mono text-slate-400">{c.createdAt}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{c.text}</p>
                          <button
                            type="button"
                            onClick={() =>
                              setWriterComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)))
                            }
                            className="text-[11px] text-[#3A86EF] font-semibold mt-1 hover:underline"
                          >
                            {c.resolved ? 'Reopen' : 'Mark Resolved'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                    <div className="text-xs font-bold">Track Changes Log</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto text-[11px] font-mono text-slate-500">
                      {changeLog.map((entry, idx) => (
                        <div key={idx} className="truncate">
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 1B. FINE NOTES ==================== */}
        {activeApp === 'notes' && (
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="text-base font-bold bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startNoteDictation}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                      noteVoiceActive
                        ? 'bg-rose-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {noteVoiceActive ? 'Listening...' : 'Voice-to-Note'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const fullContent = `${noteBody}\n\nChecklist:\n${noteTasks
                        .map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}`)
                        .join('\n')}`;
                      onSaveFile(noteTitle, 'note', fullContent);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Note
                  </button>
                </div>
              </div>
              <textarea
                rows={12}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Write quick thoughts, meeting summaries, or dictate with Voice-to-Note..."
                className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm leading-relaxed outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold">Quick To-Do Checklist</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTaskText.trim()) return;
                  setNoteTasks((prev) => [...prev, { id: `nt-${Date.now()}`, text: newTaskText.trim(), done: false }]);
                  setNewTaskText('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add new task item..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-white text-xs font-semibold">
                  Add
                </button>
              </form>
              <div className="space-y-2">
                {noteTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNoteTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                  >
                    {t.done ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className={t.done ? 'line-through text-slate-400' : ''}>{t.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. FINE SHEETS (EXCEL PARITY) ==================== */}
        {activeApp === 'sheets' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Ribbon Header */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 px-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {(['File', 'Home', 'Insert', 'Formulas', 'Data', 'Review', 'AI Studio'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setSheetRibbon(tab)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                          sheetRibbon === tab
                            ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={convertSheetToSlide}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Presentation className="w-3.5 h-3.5 text-amber-600" />
                      Sheet → Slide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const csv = activeSheet.cells
                          .map((row, ri) => row.map((_, ci) => String(evaluateCell(activeSheet.cells, ri, ci))).join(','))
                          .join('\n');
                        onSaveFile(`${activeSheet.name}.csv`, 'spreadsheet', csv);
                        downloadFile(`${activeSheet.name.replace(/\s+/g, '_')}.csv`, csv, 'text/csv;charset=utf-8');
                      }}
                      className="px-3 py-1 rounded bg-[#3A86EF] text-white text-xs font-semibold"
                    >
                      Save & Export CSV
                    </button>
                  </div>
                </div>

                {/* Sheet Ribbon Commands */}
                <div className="py-2 flex flex-wrap items-center gap-2 text-xs">
                  {sheetRibbon === 'File' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onSendToPrint({
                            documentName: `${activeSheet.name}.csv`,
                            sourceType: 'Spreadsheet',
                            paperSize: 'A4',
                            colorMode: 'Colour',
                            duplex: false,
                            content: activeSheet.cells.map((r) => r.join(' | ')).join('\n'),
                          })
                        }
                        className="px-2.5 py-1 rounded bg-[#0B132B] text-white font-semibold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSheetsList((prev) => [
                            ...prev,
                            {
                              id: `sh-${Date.now()}`,
                              name: `Sheet${prev.length + 1}`,
                              cells: [
                                ['Category', 'Jan', 'Feb', 'Mar', 'Total', 'Status'],
                                ['Item A', '0', '0', '0', '=SUM(B2:D2)', '=IF(E2>0,"Active","Empty")'],
                              ],
                            },
                          ]);
                          setActiveSheetIdx(sheetsList.length);
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                      >
                        + Add New Sheet Tab
                      </button>
                    </>
                  )}

                  {sheetRibbon === 'Home' && (
                    <>
                      <button
                        type="button"
                        onClick={addSheetRow}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Row
                      </button>
                      <button
                        type="button"
                        onClick={() => setFreezeHeader((v) => !v)}
                        className={`px-2.5 py-1 rounded font-semibold ${freezeHeader ? 'bg-[#0B132B] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'}`}
                      >
                        Freeze Header: {freezeHeader ? 'ON' : 'OFF'}
                      </button>
                      <label className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span>Highlight &gt;</span>
                        <input
                          type="number"
                          value={condThreshold}
                          onChange={(e) => setCondThreshold(Number(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                        />
                      </label>
                    </>
                  )}

                  {sheetRibbon === 'Insert' && (
                    <>
                      {(['bar', 'line', 'donut'] as const).map((ct) => (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => setChartType(ct)}
                          className={`px-2.5 py-1 rounded font-semibold capitalize inline-flex items-center gap-1 ${
                            chartType === ct ? 'bg-[#3A86EF] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {ct === 'bar' ? <BarChart3 className="w-3.5 h-3.5" /> : ct === 'line' ? <TrendingUp className="w-3.5 h-3.5" /> : <PieChart className="w-3.5 h-3.5" />}
                          {ct} Chart
                        </button>
                      ))}
                    </>
                  )}

                  {sheetRibbon === 'Formulas' && (
                    <>
                      <span className="text-slate-500">Insert into {currentCellRef}:</span>
                      {['=SUM(B2:D2)', '=AVERAGE(B2:D2)', '=MIN(B2:D2)', '=MAX(B2:D2)', '=COUNT(B2:E5)', '=IF(E2>1000,"High","Normal")'].map((fn) => (
                        <button
                          key={fn}
                          type="button"
                          onClick={() => updateCell(selectedCell.row, selectedCell.col, fn)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono hover:border-[#3A86EF]"
                        >
                          {fn}
                        </button>
                      ))}
                    </>
                  )}

                  {sheetRibbon === 'Data' && (
                    <>
                      <button
                        type="button"
                        onClick={() => sortSheetByColumn(0)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                      >
                        Sort A-Z (Col A)
                      </button>
                      <button
                        type="button"
                        onClick={() => sortSheetByColumn(4)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                      >
                        Sort Descending (Col E)
                      </button>
                      <input
                        type="text"
                        value={sheetFilterQuery}
                        onChange={(e) => setSheetFilterQuery(e.target.value)}
                        placeholder="Filter rows..."
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                      />
                    </>
                  )}

                  {sheetRibbon === 'Review' && (
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={async () => {
                        const out = await callOfficeAi(
                          `Explain this spreadsheet cell formula "${currentCellRaw || 'N/A'}" at ${currentCellRef} and review table accuracy:\n${activeSheet.cells.map((r) => r.join(', ')).join('\n')}`
                        );
                        if (out) setSheetInsight(out);
                      }}
                      className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiBusy ? 'Checking...' : `Explain Formula (${currentCellRef})`}
                    </button>
                  )}

                  {sheetRibbon === 'AI Studio' && (
                    <div className="w-full flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={sheetAiPrompt}
                        onChange={(e) => setSheetAiPrompt(e.target.value)}
                        placeholder="Describe a table (e.g. Monthly budget for a clothing shop in Lahore)..."
                        className="flex-1 min-w-[220px] px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                      />
                      <button
                        type="button"
                        disabled={aiBusy || !sheetAiPrompt.trim()}
                        onClick={async () => {
                          const txt = await callOfficeAi(
                            `Generate a 6-column CSV table (header row + 5 data rows, use =SUM(B2:D2) style formulas in col 5) for: ${sheetAiPrompt}. Return ONLY CSV lines.`
                          );
                          if (!txt) return;
                          const rows = txt
                            .split('\n')
                            .map((l) => l.trim())
                            .filter((l) => l.includes(',') && !l.startsWith('```'))
                            .map((l) => l.split(',').map((c) => c.trim()).slice(0, 6));
                          if (rows.length >= 2) {
                            const padded = rows.map((r) => [...r, ...Array(Math.max(0, 6 - r.length)).fill('')].slice(0, 6));
                            setSheetsList((prev) =>
                              prev.map((sh, i) => (i === activeSheetIdx ? { ...sh, cells: padded } : sh))
                            );
                          }
                        }}
                        className="px-3 py-1 rounded bg-[#3A86EF] text-white font-semibold inline-flex items-center gap-1"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {aiBusy ? 'Building...' : 'AI Build Sheet'}
                      </button>
                      <button
                        type="button"
                        disabled={aiBusy}
                        onClick={async () => {
                          const summary = activeSheet.cells
                            .map((r, ri) => r.map((_, ci) => evaluateCell(activeSheet.cells, ri, ci)).join(', '))
                            .join('\n');
                          const analysis = await callOfficeAi(`Analyze trends, anomalies, and next-month forecast for:\n${summary}`);
                          if (analysis) setSheetInsight(analysis);
                        }}
                        className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Predict & Analyze
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Formula Bar */}
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[#3A86EF] min-w-[44px] text-center">
                  {currentCellRef}
                </span>
                <span className="font-mono text-slate-400">fx</span>
                <input
                  type="text"
                  value={currentCellRaw}
                  onChange={(e) => updateCell(selectedCell.row, selectedCell.col, e.target.value)}
                  placeholder="Enter value or formula like =SUM(B2:D2) or =IF(E2>500,&quot;High&quot;,&quot;Low&quot;)"
                  className="flex-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono outline-none focus:border-blue-500"
                />
              </div>

              {sheetInsight && (
                <div className="m-4 p-4 rounded-xl bg-[#f5f8ff] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                  <div className="flex justify-between font-bold mb-1">
                    <span>FINE Sheets AI Insight</span>
                    <button type="button" onClick={() => setSheetInsight(null)} className="text-slate-500 hover:underline">
                      Close
                    </button>
                  </div>
                  {sheetInsight}
                </div>
              )}

              {/* Spreadsheet Grid */}
              <div className="overflow-x-auto max-h-[360px]">
                <table className="w-full text-left border-collapse text-xs tabular-nums">
                  <thead className={freezeHeader ? 'sticky top-0 z-10' : ''}>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <th className="py-2 px-3 font-mono w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                      {COL_LABELS.map((lbl) => (
                        <th key={lbl} className="py-2 px-3 font-mono font-bold border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeSheet.cells.map((row, rIdx) => {
                      const rowStr = row.join(' ').toLowerCase();
                      if (sheetFilterQuery.trim() && rIdx > 0 && !rowStr.includes(sheetFilterQuery.trim().toLowerCase())) {
                        return null;
                      }
                      const isHeaderRow = rIdx === 0;
                      return (
                        <tr key={rIdx} className={isHeaderRow ? 'bg-slate-50 dark:bg-slate-800/60 font-bold' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'}>
                          <td className="py-1.5 px-2 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            {rIdx + 1}
                          </td>
                          {COL_LABELS.map((_, cIdx) => {
                            const raw = row[cIdx] ?? '';
                            const evaluated = isHeaderRow ? raw : evaluateCell(activeSheet.cells, rIdx, cIdx);
                            const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                            const isNumeric = typeof evaluated === 'number';
                            const highHighlight = !isHeaderRow && isNumeric && evaluated >= condThreshold && cIdx > 0;
                            return (
                              <td
                                key={cIdx}
                                onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                                className={`p-0 border-r border-slate-200 dark:border-slate-800 ${
                                  isSelected ? 'ring-2 ring-inset ring-[#3A86EF] bg-blue-50/40 dark:bg-blue-950/30' : ''
                                } ${highHighlight ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold' : ''}`}
                              >
                                <input
                                  type="text"
                                  value={isSelected ? raw : String(evaluated)}
                                  onFocus={() => setSelectedCell({ row: rIdx, col: cIdx })}
                                  onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                  className={`w-full px-3 py-2 bg-transparent outline-none ${
                                    isNumeric && !isSelected ? 'text-right font-mono' : raw.startsWith('=') && isSelected ? 'font-mono text-[#3A86EF]' : ''
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Multi-Sheet Tabs */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                {sheetsList.map((sh, i) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => setActiveSheetIdx(i)}
                    className={`px-3 py-1 rounded-md font-semibold ${
                      activeSheetIdx === i ? 'bg-white dark:bg-slate-900 text-[#3A86EF] border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {sh.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSheetsList((prev) => [
                      ...prev,
                      { id: `sh-${Date.now()}`, name: `Sheet${prev.length + 1}`, cells: [['Item', 'Jan', 'Feb', 'Mar', 'Total', 'Note'], ['Row 1', '10', '20', '30', '=SUM(B2:D2)', 'OK']] },
                    ]);
                    setActiveSheetIdx(sheetsList.length);
                  }}
                  className="px-2 py-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                >
                  + Add Sheet
                </button>
              </div>
            </div>

            {/* Live Chart Visualization Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">Live Chart Engine — {activeSheet.name}</h3>
                  <p className="text-xs text-slate-500">Updates automatically from formula evaluations in real time.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(['bar', 'line', 'donut'] as const).map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => setChartType(ct)}
                      className={`px-2.5 py-1 rounded font-semibold capitalize ${
                        chartType === ct ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white' : 'text-slate-500'
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              {chartType === 'bar' && (
                <div className="space-y-3">
                  {sheetChartData.map((d, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{d.label}</span>
                        <span className="font-mono font-semibold tabular-nums">{d.value}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#3A86EF] rounded-full transition-all" style={{ width: `${Math.round((d.value / maxChartVal) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chartType === 'line' && sheetChartData.length > 0 && (
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 600 180" className="w-full h-44">
                    <polyline
                      fill="none"
                      stroke="#3A86EF"
                      strokeWidth="3"
                      points={sheetChartData
                        .map((d, i) => {
                          const x = 40 + (i * 520) / Math.max(1, sheetChartData.length - 1);
                          const y = 145 - (d.value / maxChartVal) * 115;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {sheetChartData.map((d, i) => {
                      const x = 40 + (i * 520) / Math.max(1, sheetChartData.length - 1);
                      const y = 145 - (d.value / maxChartVal) * 115;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill="#0B132B" stroke="#3A86EF" strokeWidth="2" />
                          <text x={x} y={168} textAnchor="middle" fontSize="10" fill="#64748B">
                            {d.label.slice(0, 12)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {chartType === 'donut' && (
                <div className="flex flex-wrap items-center gap-6">
                  {(() => {
                    const totalSum = Math.max(1, sheetChartData.reduce((acc, item) => acc + item.value, 0));
                    const colors = ['#3A86EF', '#16A34A', '#F59E0B', '#E63946', '#6366F1'];
                    let offset = 0;
                    return (
                      <>
                        <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
                          {sheetChartData.map((d, i) => {
                            const pct = d.value / totalSum;
                            const dash = `${pct * 251.2} 251.2`;
                            const dashOffset = -offset * 251.2;
                            offset += pct;
                            return (
                              <circle
                                key={i}
                                cx="60"
                                cy="60"
                                r="40"
                                fill="transparent"
                                stroke={colors[i % colors.length]}
                                strokeWidth="18"
                                strokeDasharray={dash}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90 60 60)"
                              />
                            );
                          })}
                        </svg>
                        <div className="space-y-1.5 text-xs">
                          {sheetChartData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 tabular-nums">
                              <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                              <span className="font-medium">{d.label}</span>
                              <span className="font-mono text-slate-500">({Math.round((d.value / totalSum) * 100)}%)</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 3. FINE PRESENT (POWERPOINT PARITY) ==================== */}
        {activeApp === 'slides' && (
          <div className="space-y-4">
            {/* Top Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={slideTopic}
                  onChange={(e) => setSlideTopic(e.target.value)}
                  placeholder="Enter topic for 8-slide AI deck (e.g. Cybersecurity Briefing)..."
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                />
                <button
                  type="button"
                  disabled={aiBusy || !slideTopic.trim()}
                  onClick={async () => {
                    const resText = await callOfficeAi(
                      `Create exactly 8 presentation slides for the topic "${slideTopic}". Format strictly as:\nSlide 1: Title | Bullet summary | Short speaker note`
                    );
                    if (!resText) return;
                    const parsed = resText
                      .split('\n')
                      .map((line) => line.replace(/^Slide\s*\d+:\s*/i, '').trim())
                      .filter((l) => l.includes('|'))
                      .map((l, i) => {
                        const [title, body, notes] = l.split('|');
                        return {
                          title: (title || `Slide ${i + 1}`).trim(),
                          body: (body || '').trim(),
                          notes: (notes || '').trim(),
                          layout: (i === 0 ? 'hero' : i % 2 === 0 ? 'kpi' : 'split') as SlideLayoutId,
                        };
                      });
                    if (parsed.length > 0) {
                      setSlides(parsed);
                      setSlideIdx(0);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#edf3ff] hover:bg-[#dce8ff] text-[#1d4f9c] text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiBusy ? 'Generating...' : 'AI Generate 8 Slides'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={slideTheme}
                  onChange={(e) => setSlideTheme(e.target.value as SlideThemeId)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950"
                >
                  <option value="business">Theme: Business</option>
                  <option value="school">Theme: School</option>
                  <option value="minimal">Theme: Minimal</option>
                  <option value="colorful">Theme: Colorful</option>
                  <option value="dark">Theme: Dark</option>
                  <option value="3d">Theme: 3D Depth</option>
                </select>
                <select
                  value={slideTransition}
                  onChange={(e) => setSlideTransition(e.target.value as SlideTransitionId)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-950"
                >
                  <option value="fade">Transition: Fade</option>
                  <option value="slide">Transition: Slide</option>
                  <option value="zoom">Transition: Zoom</option>
                  <option value="none">Transition: None</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const deckText = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}\nNotes: ${s.notes}`).join('\n\n');
                    onSaveFile('FINE Presentation Deck.pptx', 'presentation', deckText);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Deck
                </button>
                <button
                  type="button"
                  onClick={() => setPresenterOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  Presenter Mode
                </button>
              </div>
            </div>

            {/* 3-Panel Studio */}
            <div className="grid lg:grid-cols-[230px_1fr] xl:grid-cols-[230px_1fr_270px] gap-4">
              {/* Left Thumbnail Strip */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Slides ({slides.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSlides((prev) => [...prev, { title: 'New Slide', body: 'Add key points here.', notes: '' }]);
                      setSlideIdx(slides.length);
                    }}
                    className="text-xs font-semibold text-[#3A86EF] hover:underline"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {slides.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        slideIdx === idx
                          ? 'border-blue-500 bg-[#edf3ff] dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <button type="button" onClick={() => setSlideIdx(idx)} className="w-full text-left">
                        <div className="font-mono text-[10px] text-slate-400">Slide {idx + 1}</div>
                        <div className="font-bold truncate mt-0.5">{s.title}</div>
                      </button>
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-slate-400">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const next = [...slides];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            setSlides(next);
                            setSlideIdx(idx - 1);
                          }}
                          className="p-0.5 hover:text-slate-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === slides.length - 1}
                          onClick={() => {
                            if (idx === slides.length - 1) return;
                            const next = [...slides];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            setSlides(next);
                            setSlideIdx(idx + 1);
                          }}
                          className="p-0.5 hover:text-slate-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...s, title: `${s.title} (Copy)` };
                            setSlides((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
                          }}
                          className="p-0.5 hover:text-[#3A86EF]"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSlides((prev) => prev.filter((_, i) => i !== idx));
                              setSlideIdx((cur) => Math.max(0, cur >= idx ? cur - 1 : cur));
                            }}
                            className="p-0.5 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center 16:9 Slide Canvas + Speaker Notes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div
                  ref={slideStageRef}
                  className={`aspect-[16/9] rounded-xl p-8 flex flex-col justify-between transition-all duration-300 ${themeStyle.stage} ${
                    currentSlide.layout === 'quote' ? 'items-center text-center' : ''
                  }`}
                >
                  <div className={`text-xs font-semibold ${themeStyle.chip}`}>
                    FINE Present · {slideTheme.toUpperCase()} · {slideTransition.toUpperCase()}
                  </div>

                  {currentSlide.layout === 'split' ? (
                    <div className="grid sm:grid-cols-2 gap-6 items-center">
                      <h2 className="text-xl md:text-2xl font-bold leading-snug">{currentSlide.title}</h2>
                      <p className={`text-sm leading-relaxed ${themeStyle.sub}`}>{currentSlide.body}</p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold">{currentSlide.title}</h2>
                      <p className={`text-sm md:text-base mt-3 max-w-2xl leading-relaxed ${themeStyle.sub}`}>{currentSlide.body}</p>
                    </div>
                  )}

                  <div className={`flex items-center justify-between w-full text-xs ${themeStyle.chip}`}>
                    <span>Slide {slideIdx + 1} of {slides.length}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={slideIdx === 0}
                        onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                        className="p-1.5 rounded bg-black/20 hover:bg-black/35 disabled:opacity-40"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={slideIdx === slides.length - 1}
                        onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                        className="p-1.5 rounded bg-black/20 hover:bg-black/35 disabled:opacity-40"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlides((prev) => prev.map((s, i) => (i === slideIdx ? { ...s, title: val } : s)));
                    }}
                    placeholder="Slide Title"
                    className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={currentSlide.body}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlides((prev) => prev.map((s, i) => (i === slideIdx ? { ...s, body: val } : s)));
                    }}
                    placeholder="Slide Body Content"
                    className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Speaker Notes</label>
                  <textarea
                    rows={2}
                    value={currentSlide.notes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlides((prev) => prev.map((s, i) => (i === slideIdx ? { ...s, notes: val } : s)));
                    }}
                    placeholder="Private speaker cues visible in Presenter Mode..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none"
                  />
                </div>
              </div>

              {/* Right Panel: Design Ideas + AI Presenter Studio */}
              <div className="lg:col-span-2 xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Design Ideas</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        { id: 'hero', label: 'Hero Title' },
                        { id: 'split', label: '2-Column Split' },
                        { id: 'kpi', label: 'Executive KPI' },
                        { id: 'quote', label: 'Spotlight Quote' },
                      ] as const
                    ).map((ly) => (
                      <button
                        key={ly.id}
                        type="button"
                        onClick={() =>
                          setSlides((prev) => prev.map((s, i) => (i === slideIdx ? { ...s, layout: ly.id } : s)))
                        }
                        className={`p-2 rounded-lg border font-semibold text-left ${
                          currentSlide.layout === ly.id
                            ? 'border-[#3A86EF] bg-[#edf3ff] dark:bg-slate-800 text-[#1d4f9c] dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {ly.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Presenter Tools</div>
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={async () => {
                      const note = await callOfficeAi(
                        `Write concise 2-sentence speaker notes for this presentation slide:\nTitle: ${currentSlide.title}\nBody: ${currentSlide.body}`
                      );
                      if (note) {
                        setSlides((prev) => prev.map((s, i) => (i === slideIdx ? { ...s, notes: note.trim() } : s)));
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#edf3ff] hover:bg-[#dce8ff] text-[#1d4f9c] text-xs font-semibold text-left inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Auto-Write Speaker Notes
                  </button>
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={async () => {
                      const feedback = await callOfficeAi(
                        `Act as an AI Presenter Coach. Review this slide deck pacing, clarity, and delivery tips in 3 bullet points:\n${slides.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`).join('\n')}`
                      );
                      if (feedback) setPresenterCoachFeedback(feedback);
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#3A86EF] text-xs font-semibold text-left"
                  >
                    AI Presenter Coach Review
                  </button>

                  {presenterCoachFeedback && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {presenterCoachFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fullscreen Presenter Mode Overlay */}
            {presenterOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-white p-6 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-bold">FINE Presenter Mode</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      Timer: {String(Math.floor(presenterElapsed / 60)).padStart(2, '0')}:{String(presenterElapsed % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLaserEnabled((v) => !v)}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${laserEnabled ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200'}`}
                    >
                      Laser Pointer: {laserEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPresenterOpen(false);
                        setLaserEnabled(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      Exit
                    </button>
                  </div>
                </div>

                <div
                  onMouseMove={(e) => {
                    if (!laserEnabled) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setLaserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setLaserPos(null)}
                  className={`relative flex-1 max-w-5xl w-full mx-auto rounded-2xl p-10 flex flex-col justify-between ${themeStyle.stage} ${laserEnabled ? 'cursor-none' : ''}`}
                >
                  {laserEnabled && laserPos && (
                    <span
                      className="pointer-events-none absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.85)]"
                      style={{ left: laserPos.x, top: laserPos.y }}
                    />
                  )}
                  <div className={`text-xs font-semibold ${themeStyle.chip}`}>Slide {slideIdx + 1} / {slides.length}</div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-bold">{currentSlide.title}</h2>
                    <p className={`text-lg md:text-xl mt-4 leading-relaxed ${themeStyle.sub}`}>{currentSlide.body}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-75">
                    <span>FINE Present Live</span>
                    <span>Use Prev / Next controls below</span>
                  </div>
                </div>

                <div className="max-w-5xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-300 truncate max-w-2xl">
                    <span className="font-bold text-slate-400 mr-2">Speaker Notes:</span>
                    {currentSlide.notes || 'No speaker notes for this slide.'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={slideIdx === 0}
                      onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={slideIdx === slides.length - 1}
                      onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                      className="px-3 py-1.5 rounded bg-[#3A86EF] hover:bg-[#2b74dc] disabled:opacity-40"
                    >
                      Next Slide
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. FINE PDF ==================== */}
        {activeApp === 'pdf' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold">FINE PDF — Read, Merge, Split, Sign & Convert</h2>
                <p className="text-xs text-slate-500">Inspect local PDFs, merge documents, extract page ranges, apply verified seals, and convert.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-1.5 rounded-lg bg-[#0B132B] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Open PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
                      setPdfSource(f.name);
                      setPdfObjectUrl(URL.createObjectURL(f));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Merge Second PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setPdfMergedFiles((prev) => [...prev, f.name]);
                      setConvertNotice(`Merged "${f.name}" into active PDF bundle.`);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={convertPdfToWriterDoc}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-[#3A86EF]" />
                  PDF → Writer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sigText = pdfSignatureStamp
                      ? `\n\n--- DIGITAL SIGNATURE ---\nSigned by: ${pdfSignatureStamp.signer}\nTimestamp: ${pdfSignatureStamp.signedAt}\nSeal: ${pdfSignatureStamp.hash}`
                      : '';
                    onSendToPrint({
                      documentName: pdfSource,
                      sourceType: 'PDF',
                      paperSize: 'A4',
                      colorMode: 'Black & White',
                      duplex: true,
                      content: `${pdfNotes}${sigText}`,
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print PDF
                </button>
              </div>
            </div>

            {convertNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                {convertNotice}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {pdfObjectUrl ? (
                  <iframe
                    title={`PDF Preview - ${pdfSource}`}
                    src={pdfObjectUrl}
                    className="w-full h-[340px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100"
                  />
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-[#F8F9FA] dark:bg-slate-800 space-y-3">
                    <div className="text-xs font-mono text-slate-400">DOCUMENT INSPECTOR · {pdfSource}</div>
                    <h3 className="text-base font-bold">{pdfSource}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{pdfNotes}</p>
                    {pdfMergedFiles.length > 0 && (
                      <div className="text-xs text-[#3A86EF] font-semibold">
                        Merged attachments: {pdfMergedFiles.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {pdfSignatureStamp && (
                  <div className="border-2 border-[#2DC653]/50 bg-[#2DC653]/10 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="font-bold">Digital Signature Applied · Verified</div>
                    <div>
                      Signer: <strong>{pdfSignatureStamp.signer}</strong> · {pdfSignatureStamp.signedAt}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">Signature Seal: {pdfSignatureStamp.hash}</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Document File Name</label>
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={async () => {
                      const summary = await callOfficeAi(
                        `Organize, extract key action items, and summarize these PDF annotations for "${pdfSource}":\n${pdfNotes}`
                      );
                      if (summary) setPdfNotes(summary);
                    }}
                    className="text-xs font-semibold text-[#3A86EF] inline-flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiBusy ? 'Summarizing...' : 'AI Summarize & OCR'}
                  </button>
                </div>
                <input
                  type="text"
                  value={pdfSource}
                  onChange={(e) => setPdfSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                />
                <label className="block text-xs font-semibold">PDF Editing & Annotations</label>
                <textarea
                  rows={5}
                  value={pdfNotes}
                  onChange={(e) => setPdfNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                />

                {/* Split & Convert Controls */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-[#F8F9FA] dark:bg-slate-800 space-y-2">
                    <label className="block text-xs font-bold">Split / Extract Pages</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pdfSplitRange}
                        onChange={(e) => setPdfSplitRange(e.target.value)}
                        placeholder="e.g. 1-3"
                        className="w-20 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const outName = pdfSource.replace(/\.pdf$/i, `_pages_${pdfSplitRange}.pdf`);
                          onSaveFile(outName, 'pdf', `Extracted Pages ${pdfSplitRange} from ${pdfSource}\n\n${pdfNotes}`);
                          setConvertNotice(`Extracted pages "${pdfSplitRange}" into "${outName}".`);
                        }}
                        className="flex-1 px-2.5 py-1 rounded bg-[#0B132B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                      >
                        <Scissors className="w-3 h-3" />
                        Extract
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-[#F8F9FA] dark:bg-slate-800 space-y-2">
                    <label className="block text-xs font-bold">Convert Format</label>
                    <div className="flex gap-2">
                      <select
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value as 'DOCX' | 'PPTX' | 'CSV')}
                        className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                      >
                        <option value="DOCX">DOCX</option>
                        <option value="PPTX">PPTX</option>
                        <option value="CSV">CSV</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const targetName = pdfSource.replace(/\.pdf$/i, `.${convertFormat.toLowerCase()}`);
                          onSaveFile(targetName, 'document', `Converted from ${pdfSource}\n\n${pdfNotes}`);
                          setConvertNotice(`Converted & saved "${targetName}".`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#3A86EF] text-white text-xs font-semibold"
                      >
                        Convert
                      </button>
                    </div>
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-[#F8F9FA] dark:bg-slate-800 space-y-2">
                  <label className="block text-xs font-bold">Digital Signing & Verification</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pdfSignerName}
                      onChange={(e) => setPdfSignerName(e.target.value)}
                      placeholder="Signer full name..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const seal = `FINE-SIG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                        setPdfSignatureStamp({
                          signer: pdfSignerName.trim() || 'FINE Signer',
                          signedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                          hash: seal,
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#2DC653] hover:bg-emerald-600 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Sign PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. FINE DESIGN ==================== */}
        {activeApp === 'design' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">FINE Design — Vector & Poster Canvas</h2>
                <p className="text-xs text-slate-500">Sketch freehand, draw shapes, undo strokes, save to FINE Explorer, and export PNG.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(['freehand', 'line', 'rect'] as const).map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setDrawTool(tool)}
                      className={`px-2.5 py-1 rounded font-semibold capitalize ${
                        drawTool === tool
                          ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tool === 'rect' ? 'Box' : tool}
                    </button>
                  ))}
                </div>

                {['#0B132B', '#3A86EF', '#16865b', '#d94b58', '#17243b'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrushColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`w-6 h-6 rounded-full border-2 ${
                      brushColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-white'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}

                <input
                  type="range"
                  min={2}
                  max={18}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  aria-label="Brush thickness"
                  className="w-20"
                />
                <button
                  type="button"
                  onClick={undoDraw}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = designCanvasRef.current;
                    if (!canvas) return;
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'fine_design_sketch.png';
                    a.click();
                    onSaveFile('fine_design_sketch.png', 'design', url);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save & Export PNG
                </button>
              </div>
            </div>

            <canvas
              ref={designCanvasRef}
              width={920}
              height={420}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full h-[380px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white cursor-crosshair touch-none"
            />
          </div>
        )}

        {/* ==================== 6. FINE AI STUDIO ==================== */}
        {activeApp === 'ai_studio' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">FINE Office AI Studio</h2>
                  <p className="text-xs text-slate-500">Create full documents, spreadsheets, slide decks, PDFs & design briefs from natural language.</p>
                </div>
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(
                    [
                      { id: 'writer', label: 'Writer AI' },
                      { id: 'sheets', label: 'Sheets AI' },
                      { id: 'slides', label: 'Present AI' },
                      { id: 'pdf', label: 'PDF AI' },
                      { id: 'image', label: 'Design AI' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAiStudioMode(m.id)}
                      className={`px-3 py-1 rounded font-semibold ${
                        aiStudioMode === m.id ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white' : 'text-slate-500'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Enterprise & Student Prompts */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: 'Write Formal Email', mode: 'writer' as AiStudioMode, prompt: 'Draft a polite follow-up email to a client regarding quarterly renewal and product demo.' },
                  { label: 'Make Executive CV', mode: 'writer' as AiStudioMode, prompt: 'Create a modern 1-page software engineer CV with summary, experience, and skills.' },
                  { label: 'Clothing Shop Proposal (Lahore)', mode: 'writer' as AiStudioMode, prompt: 'Write a detailed business proposal for opening a modern retail clothing shop in Lahore.' },
                  { label: '20-Employee Salary Sheet', mode: 'sheets' as AiStudioMode, prompt: 'Monthly payroll salary ledger for departments with base pay, allowance, bonus, and =SUM total' },
                  { label: 'Class 9 Climate Change 8 Slides', mode: 'slides' as AiStudioMode, prompt: 'Climate Change for Class 9 students with causes, local impacts, and green solutions' },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    disabled={aiBusy}
                    onClick={() => {
                      setAiStudioMode(q.mode);
                      runAiStudioPrompt(q.prompt);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#3A86EF] bg-[#F8F9FA] dark:bg-slate-800 font-semibold"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiStudioInput}
                  onChange={(e) => setAiStudioInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runAiStudioPrompt();
                  }}
                  placeholder={`Ask ${aiStudioMode.toUpperCase()} AI anything...`}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={aiBusy || !aiStudioInput.trim()}
                  onClick={() => runAiStudioPrompt()}
                  className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#2b74dc] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiBusy ? 'Generating...' : 'Run AI Studio'}
                </button>
              </div>

              {/* 1-Click Cross-App Converters */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Cross-App Converters</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={convertDocToSlides}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                  >
                    Writer Doc → Present Deck
                  </button>
                  <button
                    type="button"
                    onClick={convertSheetToSlide}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                  >
                    Sheet Totals → Slide
                  </button>
                  <button
                    type="button"
                    onClick={convertPdfToWriterDoc}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                  >
                    PDF Notes → Writer Doc
                  </button>
                </div>
              </div>
            </div>

            {aiStudioOutput && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold">Generated Result ({aiStudioMode.toUpperCase()})</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDocText(aiStudioOutput);
                        setDirtyWriter(true);
                        setActiveApp('writer');
                      }}
                      className="px-3 py-1 rounded-lg bg-[#0B132B] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Open in Writer
                    </button>
                    {aiStudioMode === 'sheets' && (
                      <button
                        type="button"
                        onClick={() => setActiveApp('sheets')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        Open in Sheets
                      </button>
                    )}
                    {aiStudioMode === 'slides' && (
                      <button
                        type="button"
                        onClick={() => setActiveApp('slides')}
                        className="px-3 py-1 rounded-lg bg-amber-600 text-white font-semibold"
                      >
                        Open in Present
                      </button>
                    )}
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap leading-relaxed font-sans text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  {aiStudioOutput}
                </pre>
              </div>
            )}

            {aiPromptHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Saved Prompt History</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAiPromptHistory([]);
                      try {
                        localStorage.removeItem('fine_office_ai_history_v1');
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {aiPromptHistory.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setAiStudioMode(h.mode);
                        setAiStudioInput(h.prompt);
                        setAiStudioOutput(h.output);
                      }}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="font-medium truncate">
                        <span className="font-mono uppercase text-[#3A86EF] mr-2">[{h.mode}]</span>
                        {h.prompt}
                      </span>
                      <span className="font-mono text-slate-400 shrink-0 tabular-nums">{h.at}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
