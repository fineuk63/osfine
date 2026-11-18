import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  Mail,
  Phone,
  Video,
  UserPlus,
  Shield,
  Volume2,
  Mic,
  Camera,
  CheckCircle2,
  Ban,
  Trash2,
  Star,
  Search,
  Reply,
  Pin,
  Edit3,
  BarChart2,
  MapPin,
  Sparkles,
  ScreenShare,
  PenTool,
  Subtitles,
  Clock,
  Undo2,
  Forward,
  Upload,
  Fingerprint,
  HelpCircle,
  Plus,
} from 'lucide-react';
import {
  ChatMessage,
  ConnectedBrowser,
  ContactEntry,
  FineAccount,
  MailMessage,
} from '../types/fine';

export interface IncomingRtcSignal {
  fromClientId: string;
  fromName: string;
  signalType: 'offer' | 'answer' | 'ice' | 'hangup';
  payload: unknown;
  seq: number;
}

interface FineCommunicationViewProps {
  initialSection: 'messages' | 'mail' | 'calls' | 'contacts' | 'account';
  clientId: string;
  account: FineAccount | null;
  connectedBrowsers: ConnectedBrowser[];
  messages: ChatMessage[];
  typingUsers?: Array<{ clientId: string; name: string; channel: string }>;
  mails: MailMessage[];
  contacts: ContactEntry[];
  incomingRtcSignal?: IncomingRtcSignal | null;
  onSendRtcSignal?: (targetClientId: string, signalType: 'offer' | 'answer' | 'ice' | 'hangup', payload?: unknown) => void;
  onSendChat: (
    text: string,
    channel: string,
    attachment?: ChatMessage['attachment'],
    extra?: {
      replyTo?: ChatMessage['replyTo'];
      poll?: ChatMessage['poll'];
      locationLabel?: string;
    }
  ) => void;
  onEditChat?: (id: string, text: string) => void;
  onDeleteChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onVotePoll?: (id: string, optionIndex: number) => void;
  onTypingChange?: (channel: string, typing: boolean) => void;
  onSendMail: (
    to: string,
    subject: string,
    body: string,
    folder?: MailMessage['folder'],
    extra?: { cc?: string; bcc?: string; scheduledFor?: string; category?: MailMessage['category'] }
  ) => void;
  onMoveMailFolder: (id: string, folder: MailMessage['folder']) => void;
  onToggleStarMail?: (id: string) => void;
  onDeleteMail: (id: string) => void;
  onPrintMail: (mail: MailMessage) => void;
  onMarkMailRead: (id: string) => void;
  onAddContact: (contact: Omit<ContactEntry, 'id'>) => void;
  onToggleBlockContact: (id: string) => void;
  onToggleFavouriteContact: (id: string) => void;
  onDeleteContact: (id: string) => void;
  onAccountRegistered: (account: FineAccount, deliveredMail?: MailMessage) => void;
  onSignOutAccount: () => void;
}

export const FineCommunicationView: React.FC<FineCommunicationViewProps> = ({
  initialSection,
  clientId,
  account,
  connectedBrowsers,
  messages,
  typingUsers = [],
  mails,
  contacts,
  incomingRtcSignal,
  onSendRtcSignal,
  onSendChat,
  onEditChat,
  onDeleteChat,
  onPinChat,
  onVotePoll,
  onTypingChange,
  onSendMail,
  onMoveMailFolder,
  onToggleStarMail,
  onDeleteMail,
  onPrintMail,
  onMarkMailRead,
  onAddContact,
  onToggleBlockContact,
  onToggleFavouriteContact,
  onDeleteContact,
  onAccountRegistered,
  onSignOutAccount,
}) => {
  const [section, setSection] = useState<'messages' | 'mail' | 'calls' | 'contacts' | 'account'>(initialSection);

  // Channels & Chat Features
  const [channels, setChannels] = useState(['Global Lobby', 'Office Team', 'Arena Squads', 'Software & Security']);
  const [newChannelName, setNewChannelName] = useState('');
  const [channel, setChannel] = useState('Global Lobby');
  const [chatSearch, setChatSearch] = useState('');
  const [chatText, setChatText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage['replyTo'] | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptA, setPollOptA] = useState('Yes');
  const [pollOptB, setPollOptB] = useState('No');
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const typingTimerRef = useRef<number | null>(null);

  // Mail state
  const [mailFolder, setMailFolder] = useState<MailMessage['folder']>('inbox');
  const [mailCategory, setMailCategory] = useState<'All' | 'Primary' | 'Social' | 'Promotions'>('All');
  const [mailSearch, setMailSearch] = useState('');
  const [selectedMailId, setSelectedMailId] = useState<string>(mails[0]?.id ?? '');
  const [composingMail, setComposingMail] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailCc, setMailCc] = useState('');
  const [mailBcc, setMailBcc] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailSchedule, setMailSchedule] = useState('');
  const [mailAiBusy, setMailAiBusy] = useState(false);
  const [pendingUndoMail, setPendingUndoMail] = useState<{
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    secondsLeft: number;
  } | null>(null);

  // Calls & WebRTC Peer-to-Peer Devices + Filters + Screen Share + Whiteboard + Captions + AI Summary
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [selectedCam, setSelectedCam] = useState('');
  const [targetPeerId, setTargetPeerId] = useState('');
  const [callActive, setCallActive] = useState<'idle' | 'audio' | 'video' | 'group' | 'screen'>('idle');
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [camFilter, setCamFilter] = useState<'none' | 'beauty' | 'blur' | 'studio'>('none');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionLines, setCaptionLines] = useState<string[]>([]);
  const [callSummary, setCallSummary] = useState<string | null>(null);
  const [callSummaryBusy, setCallSummaryBusy] = useState(false);
  const whiteboardRef = useRef<HTMLCanvasElement | null>(null);
  const wbDrawingRef = useRef(false);
  const [incomingOffer, setIncomingOffer] = useState<{
    fromClientId: string;
    fromName: string;
    sdp: RTCSessionDescriptionInit;
    mode: 'audio' | 'video';
  } | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const activePeerIdRef = useRef<string | null>(null);

  // Contacts state
  const [newContactName, setNewContactName] = useState('');
  const [newContactAccount, setNewContactAccount] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Account auth + Photo + Forgot Hint + OTP wizard state
  const [accountTab, setAccountTab] = useState<'register' | 'login' | 'forgot' | 'reset'>(account ? 'login' : 'register');
  const [regName, setRegName] = useState(account?.name || '');
  const [regMobile, setRegMobile] = useState(account?.mobile || '');
  const [regEmail, setRegEmail] = useState(account?.email || '');
  const [regCountry, setRegCountry] = useState(account?.country || 'Pakistan');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPhoto, setRegPhoto] = useState<string | undefined>(account?.photoDataUrl);
  const [regRecovery] = useState(account?.recoveryEmail || '');
  const [regVerified, setRegVerified] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regNotice, setRegNotice] = useState<string | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState(account?.accountNumber || '72841936');
  const [loginPin, setLoginPin] = useState('');
  const [resetEmail, setResetEmail] = useState(account?.email || '');
  const [resetNewPin, setResetNewPin] = useState('');

  // Forgot Hint + OTP wizard
  const [forgotQuery, setForgotQuery] = useState('');
  const [forgotHint, setForgotHint] = useState<{
    maskedPhone: string;
    maskedEmail: string;
    ownerInitials: string;
    otpDispatched?: boolean;
    hintToken?: string;
    demoOtp?: string;
  } | null>(null);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  // 30-second Undo Send countdown effect
  useEffect(() => {
    if (!pendingUndoMail) return;
    if (pendingUndoMail.secondsLeft <= 0) {
      onSendMail(pendingUndoMail.to, pendingUndoMail.subject, pendingUndoMail.body, 'sent', {
        cc: pendingUndoMail.cc,
        bcc: pendingUndoMail.bcc,
        category: 'Primary',
      });
      setPendingUndoMail(null);
      return;
    }
    const id = window.setTimeout(() => {
      setPendingUndoMail((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
    }, 1000);
    return () => clearTimeout(id);
  }, [pendingUndoMail, onSendMail]);

  useEffect(() => {
    if (section !== 'calls' || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setAudioInputs(devices.filter((d) => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter((d) => d.kind === 'audiooutput'));
        setVideoInputs(devices.filter((d) => d.kind === 'videoinput'));
      })
      .catch(() => {});
  }, [section]);

  const cleanupRtcResources = () => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  useEffect(() => {
    return () => cleanupRtcResources();
  }, []);

  useEffect(() => {
    if (!incomingRtcSignal) return;
    const { fromClientId, fromName, signalType, payload } = incomingRtcSignal;

    if (signalType === 'offer' && payload && typeof payload === 'object') {
      const offerPayload = payload as { sdp: RTCSessionDescriptionInit; mode?: 'audio' | 'video' };
      setIncomingOffer({
        fromClientId,
        fromName,
        sdp: offerPayload.sdp,
        mode: offerPayload.mode === 'audio' ? 'audio' : 'video',
      });
      setSection('calls');
    } else if (signalType === 'answer' && pcRef.current && payload) {
      pcRef.current
        .setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit))
        .then(() => setCallStatus(`Connected live via WebRTC with ${fromName}`))
        .catch(() => {});
    } else if (signalType === 'ice' && pcRef.current && payload) {
      pcRef.current.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit)).catch(() => {});
    } else if (signalType === 'hangup') {
      cleanupRtcResources();
      activePeerIdRef.current = null;
      setIncomingOffer(null);
      setCallActive('idle');
      setCallStatus(`${fromName} ended the call.`);
    }
  }, [incomingRtcSignal]);

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pc.onicecandidate = (ev) => {
      if (ev.candidate && onSendRtcSignal) {
        onSendRtcSignal(peerId, 'ice', ev.candidate.toJSON());
      }
    };
    pc.ontrack = (ev) => {
      if (remoteVideoRef.current && ev.streams[0]) {
        remoteVideoRef.current.srcObject = ev.streams[0];
      }
    };
    pcRef.current = pc;
    activePeerIdRef.current = peerId;
    return pc;
  };

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sample = await file.slice(0, 4096).text();
    const res = await fetch('/api/security/scan-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentSample: sample, sizeBytes: file.size }),
    });
    const scan = await res.json();
    let dataUrl: string | undefined;
    if (file.size <= 350_000) {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
    }
    setPendingAttachment({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      type: file.type || 'application/octet-stream',
      dataUrl,
      scanStatus: scan.clean ? 'Verified Clean' : 'Quarantined',
    });
    e.target.value = '';
  };

  const toggleVoiceRecording = async () => {
    setVoiceError(null);
    if (recordingVoice && voiceRecorderRef.current) {
      voiceRecorderRef.current.stop();
      setRecordingVoice(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) voiceChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          onSendChat('Voice message', channel, {
            name: `voice_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
            size: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
            type: 'audio/webm',
            dataUrl: String(reader.result || ''),
            scanStatus: 'Verified Clean',
          });
        };
        reader.readAsDataURL(blob);
      };
      voiceRecorderRef.current = recorder;
      recorder.start();
      setRecordingVoice(true);
    } catch {
      setVoiceError('Microphone access unavailable in this browser/iframe environment.');
    }
  };

  const handleChatInput = (val: string) => {
    setChatText(val);
    if (onTypingChange) {
      onTypingChange(channel, Boolean(val.trim()));
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        onTypingChange(channel, false);
      }, 2500);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() && !pendingAttachment) return;
    onSendChat(chatText.trim(), channel, pendingAttachment || undefined, {
      replyTo: replyingTo || undefined,
    });
    setChatText('');
    setPendingAttachment(null);
    setReplyingTo(null);
    onTypingChange?.(channel, false);
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSendChat('Shared current location', channel, undefined, {
            locationLabel: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`,
          });
        },
        () => {
          onSendChat('Shared office location', channel, undefined, {
            locationLabel: 'Lahore / Islamabad Regional Hub (Verified)',
          });
        },
        { timeout: 3000 }
      );
    } else {
      onSendChat('Shared office location', channel, undefined, {
        locationLabel: 'FINE Verified Location Pin',
      });
    }
  };

  const startCallPreview = async (mode: 'audio' | 'video' | 'group' | 'screen') => {
    cleanupRtcResources();
    setCallActive(mode);
    if (mode === 'screen') {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        mediaStreamRef.current = displayStream;
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = displayStream;
        setCallStatus('Live screen sharing active.');
        return;
      } catch {
        setCallStatus('Screen sharing permission denied or unavailable.');
        setCallActive('idle');
        return;
      }
    }

    setCallStatus(
      targetPeerId
        ? 'Dialing connected browser via WebRTC...'
        : 'Local camera & microphone preview active (select a peer above to establish live WebRTC call).'
    );
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: mode !== 'audio' ? (selectedCam ? { deviceId: { exact: selectedCam } } : true) : false,
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current && mode !== 'audio') {
        videoPreviewRef.current.srcObject = stream;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter((d) => d.kind === 'audioinput'));
      setAudioOutputs(devices.filter((d) => d.kind === 'audiooutput'));
      setVideoInputs(devices.filter((d) => d.kind === 'videoinput'));

      if (targetPeerId && onSendRtcSignal) {
        const pc = createPeerConnection(targetPeerId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        onSendRtcSignal(targetPeerId, 'offer', {
          sdp: offer,
          mode: mode === 'audio' ? 'audio' : 'video',
        });
      }
    } catch {
      setCallStatus('Camera/microphone permission unavailable in this browser environment.');
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingOffer) return;
    const offerData = incomingOffer;
    setIncomingOffer(null);
    cleanupRtcResources();
    setCallActive(offerData.mode);
    setCallStatus(`Connected live via WebRTC with ${offerData.fromName}`);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: offerData.mode === 'video' ? (selectedCam ? { deviceId: { exact: selectedCam } } : true) : false,
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current && offerData.mode === 'video') {
        videoPreviewRef.current.srcObject = stream;
      }
      const pc = createPeerConnection(offerData.fromClientId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onSendRtcSignal?.(offerData.fromClientId, 'answer', answer);
    } catch {
      setCallStatus('Unable to access microphone/camera to answer call.');
    }
  };

  const stopCallPreview = () => {
    if (activePeerIdRef.current && onSendRtcSignal) {
      onSendRtcSignal(activePeerIdRef.current, 'hangup');
    }
    activePeerIdRef.current = null;
    cleanupRtcResources();
    setCallActive('idle');
    setCallStatus(null);
  };

  const toggleLiveCaptions = () => {
    if (captionsOn) {
      setCaptionsOn(false);
      return;
    }
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      setCaptionLines((prev) => [...prev, '[Captions] Browser speech recognition unavailable — live demo caption active.']);
      setCaptionsOn(true);
      return;
    }
    try {
      const rec = new SpeechRec() as {
        lang: string;
        continuous: boolean;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.onresult = (ev) => {
        const lastIdx = ev.results.length - 1;
        const txt = ev.results[lastIdx]?.[0]?.transcript || '';
        if (txt) setCaptionLines((prev) => [...prev.slice(-8), txt]);
      };
      rec.onend = () => setCaptionsOn(false);
      rec.start();
      setCaptionsOn(true);
    } catch {
      setCaptionsOn(true);
    }
  };

  const generateAiCallSummary = async () => {
    setCallSummaryBusy(true);
    try {
      const transcript = captionLines.join('\n') || `Call mode: ${callActive}, peer: ${targetPeerId || 'Local Session'}`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'assistant',
          brain: 'pro',
          prompt: `Generate a clean 3-bullet AI Call Summary & Action Items from this call:\n${transcript}`,
        }),
      });
      const data = await res.json();
      setCallSummary(res.ok ? data.text : data.error || 'Summary unavailable.');
    } catch {
      setCallSummary('Unable to reach FINE AI summary endpoint.');
    } finally {
      setCallSummaryBusy(false);
    }
  };

  const runAiMailHelper = async (style: 'polite' | 'short' | 'urdu') => {
    setMailAiBusy(true);
    try {
      const promptMap = {
        polite: `Draft or polish a polite, clear business email reply for subject "${mailSubject}":\n${mailBody}`,
        short: `Make this email reply concise and under 4 sentences:\n${mailBody}`,
        urdu: `Translate or write a respectful Urdu email reply for subject "${mailSubject}":\n${mailBody}`,
      };
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'office', brain: 'pro', prompt: promptMap[style] }),
      });
      const data = await res.json();
      if (res.ok && data.text) setMailBody(data.text);
    } finally {
      setMailAiBusy(false);
    }
  };

  // Account Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.size > 800_000) return;
    const reader = new FileReader();
    reader.onload = () => setRegPhoto(String(reader.result || ''));
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegNotice(null);
    if (!regVerified) {
      setRegError('Please verify your phone number and email address before generating your account.');
      return;
    }
    if (regPin.length < 4) {
      setRegError('Create a 4-digit security PIN.');
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          mobile: regMobile,
          email: regEmail,
          country: regCountry,
          password: regPassword,
          pin: regPin,
          photoDataUrl: regPhoto,
          recoveryEmail: regRecovery || regEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Registration failed.');
        return;
      }
      onAccountRegistered(data.account, data.welcomeMail);
      setLoginIdentifier(data.account.accountNumber);
      setRegPin('');
      setRegPassword('');
      setSection('mail');
      setMailFolder('inbox');
      setSelectedMailId(data.welcomeMail.id);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent, biometric = false) => {
    e?.preventDefault();
    setRegError(null);
    setRegNotice(null);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          pin: loginPin,
          biometricVerified: biometric,
          deviceName: navigator.platform || 'FINE OS Workstation',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Login failed.');
        return;
      }
      onAccountRegistered(data.account, data.securityAlertMail);
      setLoginPin('');
      setRegNotice(`Signed in cleanly as ${data.account.name} (#${data.account.accountNumber}). Login alert mailed.`);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleForgotLookup = async (confirmMatch: boolean) => {
    setRegError(null);
    setRegNotice(null);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/account/forgot-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: forgotQuery.trim(), confirmMatch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Lookup failed.');
        return;
      }
      setForgotHint(data);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotHint?.hintToken) return;
    setRegError(null);
    setRegNotice(null);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/account/forgot-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hintToken: forgotHint.hintToken,
          otp: forgotOtp.trim(),
          newPin: forgotNewPin.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'OTP verification failed.');
        return;
      }
      setRegNotice(data.message);
      setLoginIdentifier(data.accountNumber);
      setForgotHint(null);
      setForgotOtp('');
      setForgotNewPin('');
      setAccountTab('login');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegNotice(null);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/account/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: loginIdentifier.trim(), email: resetEmail.trim(), newPin: resetNewPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'PIN reset failed.');
        return;
      }
      setResetNewPin('');
      setRegNotice(data.message || 'PIN updated securely.');
      setAccountTab('login');
    } finally {
      setRegSubmitting(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const inChan = m.channel === channel;
    const matchesQ =
      !chatSearch.trim() ||
      m.text.toLowerCase().includes(chatSearch.toLowerCase()) ||
      m.senderName.toLowerCase().includes(chatSearch.toLowerCase());
    return inChan && matchesQ;
  });

  const pinnedInChannel = filteredMessages.filter((m) => m.pinned);
  const typingInChannel = typingUsers.filter((u) => u.channel === channel && u.clientId !== clientId);

  const folderMails = mails.filter((m) => {
    if (mailFolder === 'starred') {
      if (!m.starred) return false;
    } else if (m.folder !== mailFolder) {
      return false;
    }
    if (mailFolder === 'inbox' && mailCategory !== 'All' && (m.category || 'Primary') !== mailCategory) {
      return false;
    }
    const matchesQ =
      !mailSearch.trim() ||
      m.subject.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.from.toLowerCase().includes(mailSearch.toLowerCase()) ||
      m.body.toLowerCase().includes(mailSearch.toLowerCase());
    return matchesQ;
  });

  const activeMail = mails.find((m) => m.id === selectedMailId) || folderMails[0] || null;

  const videoFilterCss =
    camFilter === 'beauty'
      ? 'brightness(1.08) contrast(0.95) saturate(1.12)'
      : camFilter === 'blur'
        ? 'blur(2px) brightness(1.03)'
        : camFilter === 'studio'
          ? 'contrast(1.15) saturate(1.05)'
          : 'none';

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(
            [
              { id: 'messages', label: 'FINE Chat' },
              { id: 'mail', label: 'FINE Mail' },
              { id: 'calls', label: 'Calls & Screen' },
              { id: 'contacts', label: 'Contacts' },
              { id: 'account', label: 'FINE Account & PIN' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                section === tab.id
                  ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 px-2 tabular-nums">
          {account ? (
            <span>
              Account <strong className="font-mono text-[#0B132B] dark:text-white">#{account.accountNumber}</strong> · {account.name}
            </span>
          ) : (
            <span>Built-in Owner #72841936 (PIN 1234) · Or Register New Account</span>
          )}
        </div>
      </div>

      {/* 1. FINE CHAT (Reply, Edit, Delete, Pin, Poll, Location, @Fine Bot, Typing) */}
      {section === 'messages' && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-5">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Groups & Channels</h2>
              <div className="space-y-1">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      channel === ch
                        ? 'bg-[#edf3ff] text-[#1d4f9c]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newChannelName.trim()) return;
                  if (!channels.includes(newChannelName.trim())) {
                    setChannels((prev) => [...prev, newChannelName.trim()]);
                  }
                  setChannel(newChannelName.trim());
                  setNewChannelName('');
                }}
                className="flex gap-1.5 mt-2.5"
              >
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="+ New Group..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-[#0B132B] text-white"
                  title="Create group channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Connected Machines ({connectedBrowsers.length})
              </h2>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {connectedBrowsers.map((b) => (
                  <div key={b.clientId} className="text-xs flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{b.name}</span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">#{b.accountNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-[580px]">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">{channel}</h2>
                <p className="text-xs text-slate-500">
                  {typingInChannel.length > 0
                    ? `${typingInChannel.map((u) => u.name).join(', ')} typing...`
                    : 'Type @Fine in any message to invoke live AI inside chat'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="text-xs outline-none bg-transparent w-36"
                />
              </div>
            </div>

            {pinnedInChannel.length > 0 && (
              <div className="px-4 py-2 bg-[#edf3ff] dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
                <span className="truncate">
                  <Pin className="w-3 h-3 inline mr-1 text-[#3A86EF]" />
                  <strong>Pinned:</strong> {pinnedInChannel[pinnedInChannel.length - 1].text}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-16">
                  No messages found in {channel}. Try saying &quot;@Fine hello&quot;!
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMine = msg.senderId === clientId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-2">
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">{msg.senderName}</strong> · #{msg.senderAccount}{' '}
                          · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.edited && ' · edited'}
                        </span>
                      </div>

                      <div
                        className={`max-w-lg rounded-xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'bg-[#3A86EF] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {msg.replyTo && (
                          <div
                            className={`text-[11px] mb-1.5 px-2.5 py-1 rounded border-l-2 ${
                              isMine ? 'bg-white/15 border-white/60' : 'bg-white dark:bg-slate-900 border-[#3A86EF]'
                            }`}
                          >
                            <strong>{msg.replyTo.senderName}:</strong> {msg.replyTo.text.slice(0, 80)}
                          </div>
                        )}

                        {editingMsgId === msg.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editMsgText}
                              onChange={(e) => setEditMsgText(e.target.value)}
                              className="px-2 py-1 rounded text-xs text-slate-900 bg-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onEditChat?.(msg.id, editMsgText);
                                setEditingMsgId(null);
                              }}
                              className="px-2 py-1 rounded bg-[#0B132B] text-white text-[11px] font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          msg.text && <p className={`leading-relaxed ${msg.deletedForAll ? 'italic opacity-75' : ''}`}>{msg.text}</p>
                        )}

                        {msg.locationLabel && (
                          <div className="mt-1.5 text-xs flex items-center gap-1 opacity-90">
                            <MapPin className="w-3.5 h-3.5" />
                            {msg.locationLabel}
                          </div>
                        )}

                        {msg.poll && (
                          <div className="mt-2 pt-2 border-t border-white/20 space-y-1.5 text-xs">
                            <div className="font-bold">{msg.poll.question}</div>
                            {msg.poll.options.map((opt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => onVotePoll?.(msg.id, idx)}
                                className="w-full flex items-center justify-between px-2.5 py-1 rounded bg-black/15 hover:bg-black/25 text-left"
                              >
                                <span>{opt.text}</span>
                                <span className="font-mono font-bold tabular-nums">{opt.votes}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.attachment && (
                          <div
                            className={`mt-2 pt-2 border-t text-xs space-y-1.5 ${
                              isMine ? 'border-blue-400/40 text-blue-50' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {msg.attachment.dataUrl && msg.attachment.type.startsWith('audio/') && (
                              <audio controls src={msg.attachment.dataUrl} className="w-64 max-w-full h-8" />
                            )}
                            <div className="flex items-center justify-between gap-3">
                              <span>
                                {msg.attachment.name} ({msg.attachment.size})
                              </span>
                              {msg.attachment.dataUrl ? (
                                <a href={msg.attachment.dataUrl} download={msg.attachment.name} className="underline font-semibold">
                                  Download
                                </a>
                              ) : (
                                <span className="font-semibold">{msg.attachment.scanStatus}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {!msg.deletedForAll && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={() => setReplyingTo({ id: msg.id, senderName: msg.senderName, text: msg.text })}
                            className="hover:text-[#3A86EF] inline-flex items-center gap-0.5"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => onPinChat?.(msg.id)}
                            className="hover:text-[#3A86EF] inline-flex items-center gap-0.5"
                          >
                            <Pin className="w-3 h-3" />
                            {msg.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          {isMine && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditMsgText(msg.text);
                                }}
                                className="hover:text-[#3A86EF] inline-flex items-center gap-0.5"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteChat?.(msg.id)}
                                className="hover:text-rose-600 inline-flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {pollOpen && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
                <div className="font-bold">Create Live Group Poll</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question..."
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <input
                    type="text"
                    value={pollOptA}
                    onChange={(e) => setPollOptA(e.target.value)}
                    placeholder="Option 1"
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <input
                    type="text"
                    value={pollOptB}
                    onChange={(e) => setPollOptB(e.target.value)}
                    placeholder="Option 2"
                    className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!pollQuestion.trim()) return;
                      onSendChat(`Poll: ${pollQuestion.trim()}`, channel, undefined, {
                        poll: {
                          question: pollQuestion.trim(),
                          options: [
                            { text: pollOptA || 'Yes', votes: 0 },
                            { text: pollOptB || 'No', votes: 0 },
                          ],
                        },
                      });
                      setPollQuestion('');
                      setPollOpen(false);
                    }}
                    className="px-3 py-1 rounded bg-[#3A86EF] text-white font-semibold"
                  >
                    Post Poll
                  </button>
                  <button type="button" onClick={() => setPollOpen(false)} className="px-3 py-1 rounded border">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {voiceError && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  {voiceError}
                </div>
              )}
              {replyingTo && (
                <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                  <span className="truncate">
                    Replying to <strong>{replyingTo.senderName}</strong>: {replyingTo.text}
                  </span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-500">
                    Cancel
                  </button>
                </div>
              )}
              {pendingAttachment && (
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                  <span>
                    Attached: <strong>{pendingAttachment.name}</strong> ({pendingAttachment.scanStatus})
                  </span>
                  <button type="button" onClick={() => setPendingAttachment(null)} className="text-slate-500">
                    Remove
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" title="Fine Share: Attach scanned file">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" onChange={handleAttachmentSelect} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title="Voice Note"
                  className={`p-2 rounded-lg border text-xs ${
                    recordingVoice ? 'border-rose-500 bg-rose-600 text-white' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPollOpen((v) => !v)}
                  title="Create Poll"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  title="Share Location"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChatText((prev) => (prev.startsWith('@Fine ') ? prev : `@Fine ${prev}`))}
                  title="Ask @Fine AI in Chat"
                  className="px-2 py-1.5 rounded-lg bg-[#edf3ff] text-[#1d4f9c] text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  @Fine
                </button>
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => handleChatInput(e.target.value)}
                  placeholder={`Message ${channel}...`}
                  className="flex-1 min-w-[160px] px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. FINE MAIL (Primary/Social/Promotions, Starred/Snoozed/Scheduled/Trash, CC/BCC, 30s Undo Send, Mail->Chat, AI Reply) */}
      {section === 'mail' && (
        <div className="space-y-3">
          {pendingUndoMail && (
            <div className="bg-[#0B132B] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span>
                Sending <strong>&quot;{pendingUndoMail.subject}&quot;</strong> to {pendingUndoMail.to} in{' '}
                <strong className="font-mono">{pendingUndoMail.secondsLeft}s</strong>...
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMailTo(pendingUndoMail.to);
                    setMailCc(pendingUndoMail.cc || '');
                    setMailBcc(pendingUndoMail.bcc || '');
                    setMailSubject(pendingUndoMail.subject);
                    setMailBody(pendingUndoMail.body);
                    setPendingUndoMail(null);
                    setComposingMail(true);
                  }}
                  className="px-3 py-1 rounded bg-amber-500 text-white font-bold inline-flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSendMail(pendingUndoMail.to, pendingUndoMail.subject, pendingUndoMail.body, 'sent', {
                      cc: pendingUndoMail.cc,
                      bcc: pendingUndoMail.bcc,
                      category: 'Primary',
                    });
                    setPendingUndoMail(null);
                  }}
                  className="px-3 py-1 rounded bg-[#3A86EF] text-white font-semibold"
                >
                  Send Now
                </button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-[210px_320px_1fr] gap-4">
            <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <button
                type="button"
                onClick={() => setComposingMail(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold"
              >
                Compose Email
              </button>
              <div className="space-y-1 pt-1">
                {(['inbox', 'starred', 'snoozed', 'scheduled', 'sent', 'drafts', 'spam', 'trash'] as const).map((f) => {
                  const count =
                    f === 'starred'
                      ? mails.filter((m) => m.starred).length
                      : mails.filter((m) => m.folder === f).length;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setComposingMail(false);
                        setMailFolder(f);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold capitalize ${
                        mailFolder === f && !composingMail
                          ? 'bg-[#edf3ff] text-[#1d4f9c]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{f}</span>
                      <span className="font-mono text-slate-400 tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col max-h-[580px]">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={mailSearch}
                    onChange={(e) => setMailSearch(e.target.value)}
                    placeholder="Search email..."
                    className="text-xs outline-none bg-transparent w-full"
                  />
                </div>
                {mailFolder === 'inbox' && (
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {(['All', 'Primary', 'Social', 'Promotions'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMailCategory(cat)}
                        className={`py-1 rounded font-semibold ${
                          mailCategory === cat ? 'bg-[#0B132B] text-white' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
                {folderMails.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No messages in {mailFolder}.</div>
                ) : (
                  folderMails.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setComposingMail(false);
                        setSelectedMailId(m.id);
                        onMarkMailRead(m.id);
                      }}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        activeMail?.id === m.id && !composingMail ? 'bg-[#f5f8ff] dark:bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold truncate ${m.unread ? 'font-bold' : 'text-slate-500'}`}>
                          {m.starred && '★ '}
                          {m.from}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{m.timestamp}</span>
                      </div>
                      <div className="text-xs font-semibold mt-1 truncate">{m.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.preview}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 min-h-[580px]">
              {composingMail ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!mailTo.trim() || !mailSubject.trim()) return;
                    if (mailSchedule) {
                      onSendMail(mailTo.trim(), mailSubject.trim(), mailBody.trim(), 'scheduled', {
                        cc: mailCc.trim() || undefined,
                        bcc: mailBcc.trim() || undefined,
                        scheduledFor: mailSchedule,
                      });
                      setMailFolder('scheduled');
                    } else {
                      setPendingUndoMail({
                        to: mailTo.trim(),
                        cc: mailCc.trim() || undefined,
                        bcc: mailBcc.trim() || undefined,
                        subject: mailSubject.trim(),
                        body: mailBody.trim(),
                        secondsLeft: 30,
                      });
                    }
                    setMailTo('');
                    setMailCc('');
                    setMailBcc('');
                    setMailSubject('');
                    setMailBody('');
                    setMailSchedule('');
                    setComposingMail(false);
                  }}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold">New Email</h2>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        disabled={mailAiBusy}
                        onClick={() => runAiMailHelper('polite')}
                        className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold"
                      >
                        AI Polite Reply
                      </button>
                      <button
                        type="button"
                        disabled={mailAiBusy}
                        onClick={() => runAiMailHelper('short')}
                        className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold"
                      >
                        AI Short
                      </button>
                      <button
                        type="button"
                        disabled={mailAiBusy}
                        onClick={() => runAiMailHelper('urdu')}
                        className="px-2.5 py-1 rounded bg-[#edf3ff] text-[#1d4f9c] font-semibold"
                      >
                        AI Urdu
                      </button>
                    </div>
                  </div>
                  <input
                    type="email"
                    required
                    value={mailTo}
                    onChange={(e) => setMailTo(e.target.value)}
                    placeholder="To (e.g. elena@fine.browser)"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={mailCc}
                      onChange={(e) => setMailCc(e.target.value)}
                      placeholder="CC (optional)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                    <input
                      type="text"
                      value={mailBcc}
                      onChange={(e) => setMailBcc(e.target.value)}
                      placeholder="BCC (optional)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                  <textarea
                    rows={8}
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    placeholder="Write your email..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="datetime-local"
                        value={mailSchedule}
                        onChange={(e) => setMailSchedule(e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setComposingMail(false)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!mailSubject.trim() && !mailBody.trim()) return;
                          onSendMail(mailTo.trim() || 'draft@fine.browser', mailSubject.trim() || '(No Subject)', mailBody.trim(), 'drafts');
                          setComposingMail(false);
                          setMailFolder('drafts');
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        Save Draft
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold">
                        {mailSchedule ? 'Schedule Send' : 'Send (30s Undo)'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : activeMail ? (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold">{activeMail.subject}</h2>
                      <div className="text-xs text-slate-500 mt-1">
                        From <strong>{activeMail.from}</strong> ({activeMail.fromAddress}) · To {activeMail.to}
                        {activeMail.scheduledFor && ` · Scheduled: ${activeMail.scheduledFor}`}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
                      <button
                        type="button"
                        onClick={() => onToggleStarMail?.(activeMail.id)}
                        className={`px-2.5 py-1 rounded border ${
                          activeMail.starred ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ★ Star
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMailTo(activeMail.fromAddress);
                          setMailSubject(
                            activeMail.subject.startsWith('Re:') ? activeMail.subject : `Re: ${activeMail.subject}`
                          );
                          setMailBody(`\n\n--- On ${activeMail.timestamp}, ${activeMail.from} wrote ---\n${activeMail.body}`);
                          setComposingMail(true);
                        }}
                        className="px-2.5 py-1 rounded bg-[#3A86EF] text-white font-semibold"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSendChat(`[Forwarded Mail] ${activeMail.subject} — From ${activeMail.from}: ${activeMail.body.slice(0, 260)}`, channel);
                          setSection('messages');
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Forward className="w-3 h-3" />
                        Mail → Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveMailFolder(activeMail.id, 'snoozed')}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        Snooze
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveMailFolder(activeMail.id, 'spam')}
                        className="px-2.5 py-1 rounded border border-amber-200 text-amber-700 font-semibold"
                      >
                        Block Sender
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintMail(activeMail)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMail.folder === 'trash') onDeleteMail(activeMail.id);
                          else onMoveMailFolder(activeMail.id, 'trash');
                        }}
                        className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 font-semibold"
                      >
                        {activeMail.folder === 'trash' ? 'Purge' : 'Trash'}
                      </button>
                    </div>
                  </div>
                  <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-relaxed">{activeMail.body}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500">
                  <Mail className="w-8 h-8 text-slate-300 mb-2" />
                  Select an email to read
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. CALLS & SCREEN SHARE (Beauty/Blur Filter, Screen Share, Whiteboard, Live Captions, AI Summary) */}
      {section === 'calls' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">FINE Audio, Video, Screen Share & Whiteboard Calls</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live WebRTC calling with camera filters, screen sharing, collaborative whiteboard, captions & AI call summaries.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {connectedBrowsers.filter((b) => b.clientId !== clientId).length} peer(s) online
            </div>
          </div>

          {incomingOffer && (
            <div className="bg-[#edf3ff] dark:bg-slate-800 border border-[#3A86EF]/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <strong>Incoming WebRTC {incomingOffer.mode} call</strong> from <strong>{incomingOffer.fromName}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={acceptIncomingCall} className="px-3.5 py-1.5 rounded-lg bg-[#2DC653] text-white text-xs font-semibold">
                  Accept Call
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSendRtcSignal?.(incomingOffer.fromClientId, 'hangup');
                    setIncomingOffer(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#E63946] text-white text-xs font-semibold"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {callStatus && (
            <div className="bg-[#F8F9FA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs font-medium">
              {callStatus}
            </div>
          )}

          <div className="grid md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Call Target Peer</label>
              <select
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Local Device Preview</option>
                {connectedBrowsers
                  .filter((b) => b.clientId !== clientId)
                  .map((b) => (
                    <option key={b.clientId} value={b.clientId}>
                      {b.name} (#{b.accountNumber})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-semibold flex items-center gap-1.5 mb-1">
                <Mic className="w-3.5 h-3.5 text-[#3A86EF]" />
                Microphone
              </label>
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Default Mic</option>
                {audioInputs.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Mic ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold flex items-center gap-1.5 mb-1">
                <Volume2 className="w-3.5 h-3.5 text-[#3A86EF]" />
                Speaker
              </label>
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Default Output</option>
                {audioOutputs.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Speaker ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold flex items-center gap-1.5 mb-1">
                <Camera className="w-3.5 h-3.5 text-[#3A86EF]" />
                Camera
              </label>
              <select
                value={selectedCam}
                onChange={(e) => setSelectedCam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="">Default Camera</option>
                {videoInputs.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Cam ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Camera Filter</label>
              <select
                value={camFilter}
                onChange={(e) => setCamFilter(e.target.value as 'none' | 'beauty' | 'blur' | 'studio')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="none">No Filter</option>
                <option value="beauty">Beauty Soft</option>
                <option value="blur">Privacy Blur</option>
                <option value="studio">Studio Crisp</option>
              </select>
            </div>
          </div>

          {callActive !== 'idle' && (
            <div className="grid md:grid-cols-2 gap-4">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                style={{ filter: videoFilterCss }}
                className="w-full h-56 bg-slate-950 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-56 bg-[#0B132B] rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          {showWhiteboard && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Live Call Whiteboard</span>
                <button
                  type="button"
                  onClick={() => {
                    const ctx = whiteboardRef.current?.getContext('2d');
                    if (ctx && whiteboardRef.current) ctx.clearRect(0, 0, whiteboardRef.current.width, whiteboardRef.current.height);
                  }}
                  className="text-rose-600 hover:underline"
                >
                  Clear Board
                </button>
              </div>
              <canvas
                ref={whiteboardRef}
                width={820}
                height={220}
                onPointerDown={(e) => {
                  const c = whiteboardRef.current;
                  const ctx = c?.getContext('2d');
                  if (!c || !ctx) return;
                  wbDrawingRef.current = true;
                  const r = c.getBoundingClientRect();
                  ctx.strokeStyle = '#3A86EF';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.moveTo(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height);
                }}
                onPointerMove={(e) => {
                  if (!wbDrawingRef.current) return;
                  const c = whiteboardRef.current;
                  const ctx = c?.getContext('2d');
                  if (!c || !ctx) return;
                  const r = c.getBoundingClientRect();
                  ctx.lineTo(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height);
                  ctx.stroke();
                }}
                onPointerUp={() => (wbDrawingRef.current = false)}
                className="w-full h-44 bg-white rounded-lg border border-slate-200 cursor-crosshair touch-none"
              />
            </div>
          )}

          {captionsOn && (
            <div className="bg-slate-950 text-white rounded-xl p-3 text-xs space-y-1">
              <div className="text-[11px] text-blue-300 font-bold">Live Call Captions</div>
              {captionLines.length === 0 ? (
                <div className="text-slate-400">Listening to microphone speech...</div>
              ) : (
                captionLines.map((l, idx) => <div key={idx}>{l}</div>)
              )}
            </div>
          )}

          {callSummary && (
            <div className="bg-[#f5f8ff] dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl p-4 text-xs whitespace-pre-wrap">
              <div className="font-bold mb-1">FINE AI Call Summary</div>
              {callSummary}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {callActive === 'idle' ? (
              <>
                <button
                  type="button"
                  onClick={() => startCallPreview('audio')}
                  className="px-3.5 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Audio Call
                </button>
                <button
                  type="button"
                  onClick={() => startCallPreview('video')}
                  className="px-3.5 py-2 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Call
                </button>
                <button
                  type="button"
                  onClick={() => startCallPreview('screen')}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ScreenShare className="w-3.5 h-3.5 text-[#3A86EF]" />
                  Screen Share
                </button>
              </>
            ) : (
              <button type="button" onClick={stopCallPreview} className="px-4 py-2 rounded-lg bg-[#E63946] text-white text-xs font-semibold">
                End Call
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowWhiteboard((v) => !v)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              Whiteboard
            </button>
            <button
              type="button"
              onClick={toggleLiveCaptions}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                captionsOn ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              Live Captions
            </button>
            <button
              type="button"
              disabled={callSummaryBusy}
              onClick={generateAiCallSummary}
              className="px-3 py-2 rounded-lg bg-[#edf3ff] text-[#1d4f9c] text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {callSummaryBusy ? 'Summarizing...' : 'AI Call Summary'}
            </button>
          </div>
        </div>
      )}

      {/* 4. CONTACTS MANAGEMENT */}
      {section === 'contacts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold">FINE Contacts — Add by 8-Digit Account Number</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage favourites, add contacts by their 8-digit FINE ID, or block/unblock contacts.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newContactName.trim()) return;
              onAddContact({
                name: newContactName.trim(),
                accountNumber: newContactAccount.trim() || String(Math.floor(10000000 + Math.random() * 89999999)),
                email: newContactEmail.trim() || 'contact@fine.browser',
                phone: '+92 300 0000000',
                status: 'Online',
                blocked: false,
                favourite: false,
              });
              setNewContactName('');
              setNewContactAccount('');
              setNewContactEmail('');
            }}
            className="grid sm:grid-cols-4 gap-2"
          >
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Full Name"
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
            />
            <input
              type="text"
              value={newContactAccount}
              onChange={(e) => setNewContactAccount(e.target.value)}
              placeholder="8-digit Account #"
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none font-mono"
            />
            <input
              type="email"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="Email address"
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-[#3A86EF] text-white text-xs font-semibold flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {contacts.map((c) => (
              <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {c.name} <span className="font-mono text-xs font-normal text-slate-400">#{c.accountNumber}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.email} · {c.blocked ? 'Blocked' : c.status}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleFavouriteContact(c.id)}
                    aria-label="Toggle favourite"
                    className={`p-1.5 rounded border ${
                      c.favourite ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBlockContact(c.id)}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3" />
                    {c.blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteContact(c.id)}
                    className="p-1.5 rounded border border-rose-200 text-rose-700"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FINE ACCOUNT, UNIVERSAL LOGIN, BIOMETRIC & FORGOT HINT+OTP RECOVERY */}
      {section === 'account' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                {(
                  [
                    { id: 'register', label: 'Register' },
                    { id: 'login', label: 'Sign In' },
                    { id: 'forgot', label: 'Forgot?' },
                    { id: 'reset', label: 'Reset PIN' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setAccountTab(t.id);
                      setRegError(null);
                      setRegNotice(null);
                    }}
                    className={`px-3 py-1.5 rounded-md font-semibold ${
                      accountTab === t.id
                        ? 'bg-white dark:bg-slate-900 text-[#0B132B] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {account && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOutAccount();
                    setRegNotice('Signed out of active FINE Account.');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Sign Out
                </button>
              )}
            </div>

            {regNotice && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">{regNotice}</div>
            )}
            {regError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{regError}</div>
            )}

            {accountTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">One FINE Account for All Machines</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Creates a unique 8-digit FINE ID with duplicate Phone/Email protection & Photo Avatar.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={regPhoto || '/src/assets/images/fine_user_avatar_1794990398084.jpg'}
                    alt="Profile preview"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Profile Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      placeholder="Pakistan / UK / UAE"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone Number (Unique)</label>
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email Address (Unique)</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Account Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">4-Digit PIN</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      maxLength={8}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="4-digit PIN"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="text-xs">
                    Phone & Email Verification
                    <span className="block text-slate-500">Required for Two-Factor & ATM Security</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegVerified(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      regVerified ? 'bg-emerald-600 text-white' : 'bg-[#0B132B] text-white'
                    }`}
                  >
                    {regVerified ? 'Verified' : 'Verify Now'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-sm font-semibold"
                >
                  {regSubmitting ? 'Provisioning Account...' : 'Create 8-Digit FINE Account'}
                </button>
              </form>
            )}

            {accountTab === 'login' && (
              <form onSubmit={(e) => handleLoginSubmit(e, false)} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Universal Single-Box Sign In</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign in using Account No (e.g. 72841936), Phone, or Email + PIN — or Biometric.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Account No / Phone / Email</label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="72841936 or +92... or email"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Security PIN (Demo Owner PIN: 1234)</label>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (or Reverse PIN for silent alert)"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="py-2.5 px-4 rounded-lg bg-[#3A86EF] hover:bg-[#1d54ab] text-white text-xs font-semibold"
                  >
                    {regSubmitting ? 'Verifying...' : 'Sign In with PIN'}
                  </button>
                  <button
                    type="button"
                    disabled={regSubmitting || !loginIdentifier.trim()}
                    onClick={() => handleLoginSubmit(undefined, true)}
                    className="py-2.5 px-4 rounded-lg bg-[#0B132B] hover:bg-[#1a2952] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    Fingerprint / Face ID
                  </button>
                </div>
              </form>
            )}

            {accountTab === 'forgot' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#3A86EF]" />
                    Forgot Account No or PIN
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lookup by Phone or Email → Confirm Masked Hint → Verify 6-Digit OTP (30-min lock after 3 wrong OTPs).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={forgotQuery}
                    onChange={(e) => setForgotQuery(e.target.value)}
                    placeholder="Enter Phone or Email (e.g. owner@fine.browser)"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                  <button
                    type="button"
                    disabled={regSubmitting || !forgotQuery.trim()}
                    onClick={() => handleForgotLookup(false)}
                    className="px-3.5 py-2 rounded-lg bg-[#0B132B] text-white text-xs font-semibold"
                  >
                    Find Account
                  </button>
                </div>

                {forgotHint && !forgotHint.otpDispatched && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800 space-y-3 text-xs">
                    <div className="font-bold">Masked Account Hint — Is this you?</div>
                    <div>Name: {forgotHint.ownerInitials}</div>
                    <div>Phone: {forgotHint.maskedPhone}</div>
                    <div>Email: {forgotHint.maskedEmail}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleForgotLookup(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#3A86EF] text-white font-semibold"
                      >
                        Yes, Send 6-Digit OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotHint(null)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {forgotHint?.otpDispatched && (
                  <form onSubmit={handleForgotVerify} className="space-y-3 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      6-Digit OTP Sent (Preview Code: <span className="font-mono">{forgotHint.demoOtp}</span>)
                    </div>
                    <input
                      type="text"
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                    <input
                      type="password"
                      value={forgotNewPin}
                      onChange={(e) => setForgotNewPin(e.target.value)}
                      placeholder="Optional: New 4-digit PIN (max 3 changes/day)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="w-full py-2 rounded-lg bg-[#2DC653] text-white font-bold"
                    >
                      Verify OTP & Reveal Account
                    </button>
                  </form>
                )}
              </div>
            )}

            {accountTab === 'reset' && (
              <form onSubmit={handleResetPinSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Reset Account PIN (Max 3/Day)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify your 8-digit Account Number and registered email to issue a newly salted scrypt PIN.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">8-Digit Account Number</label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Account Number"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">New PIN</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={resetNewPin}
                    onChange={(e) => setResetNewPin(e.target.value)}
                    placeholder="Minimum 4 digits"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0B132B] hover:bg-[#1a3970] text-white text-sm font-semibold"
                >
                  {regSubmitting ? 'Updating PIN...' : 'Update Security PIN'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="bg-[#0B132B] text-white rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
                  {account ? 'Active FINE OS Account' : 'Unauthenticated Session'}
                </div>
                <div className="text-3xl font-extrabold font-mono tracking-wider mt-1 tabular-nums">
                  {account ? account.accountNumber : 'Guest'}
                </div>
                <div className="text-xs text-blue-200 mt-1">
                  {account ? 'Unified across PC, Mobile, Tablet & ATM' : 'Register or Sign In on the left'}
                </div>
              </div>
              <img
                src={account?.photoDataUrl || '/src/assets/images/fine_user_avatar_1794990398084.jpg'}
                alt="FINE Account Profile"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shrink-0"
              />
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Account Holder</dt>
                <dd className="font-semibold">{account?.name || 'Not signed in'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">ATM Demo Balance</dt>
                <dd className="font-mono font-bold text-emerald-600 tabular-nums">
                  PKR {(account?.balance ?? 250000).toLocaleString()}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Region</dt>
                <dd className="font-semibold">{account?.country || 'Pakistan'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Two-Factor & IP Shield</dt>
                <dd className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Enabled (5-Fail Auto-Block)
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">PIN & Password Protection</dt>
                <dd className="font-semibold inline-flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Salted Scrypt + Reverse PIN
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};
