"use client";

import {
  FormEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  type ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  CheckCheck,
  ChevronRight,
  History,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import Image from "next/image";

import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkSupportTicketAvailabilityApi,
  createSupportTicketApi,
  getSupportTicketHistoryApi,
  isSupportTicketApiError,
  type SupportContactMethod,
  type SupportTicketHistoryItem,
} from "@/lib/api/support/support-tickets.api";
import { useAuthStore } from "@/lib/auth/auth.store";
import { cn, getErrorMessage } from "@/lib/utils";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqOption = {
  id: string;
  content: string;
  action: "select-faq" | "start-support-flow";
  faqId?: string;
};

type Message = {
  id: string;
  role: "bot" | "user" | "system";
  content: string;
  options?: FaqOption[];
};

type SupportStep =
  | "initial"
  | "faq"
  | "faq-resolution"
  | "login-required"
  | "contact-preference"
  | "name"
  | "mobile"
  | "description"
  | "submitting"
  | "success"
  | "ended";

type SupportDraft = {
  contactMethod: SupportContactMethod | "";
  name: string;
  phoneNumber: string;
  problem: string;
};

type ChatPosition = {
  x: number;
  y: number;
};

type SupportState = {
  open: boolean;
  started: boolean;
  step: SupportStep;
  messages: Message[];
  draft: SupportDraft;
  error: string;
  ticketNumber: string;
};

type SupportAction =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "RESET" }
  | { type: "SEND_INITIAL_MESSAGE"; value: string }
  | { type: "SELECT_FAQ"; faq: FaqItem }
  | { type: "FAQ_SOLVED" }
  | { type: "START_SUPPORT_FLOW" }
  | { type: "LOGIN_REQUIRED" }
  | { type: "SET_CONTACT"; value: SupportContactMethod }
  | { type: "SET_NAME"; value: string }
  | { type: "SET_MOBILE"; value: string }
  | { type: "MOBILE_VALIDATION_REPLY"; value: string; error: string }
  | { type: "MOBILE_REPLY_ERROR"; value: string; error: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; ticketNumber: string }
  | { type: "VALIDATION_ERROR"; error: string }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "SUBMIT_REPLY_ERROR"; error: string }
  | { type: "CLEAR_ERROR" };

const MITRA_AVATAR_SRC =
  "https://pub-b562a1837efa4ecd9355514d86041756.r2.dev/assets/mitra-bot.avif";
const LOGIN_REQUIRED_MESSAGE =
  "Please login first so we can save your seva request details securely.";

const faqs: FaqItem[] = [
  {
    id: "booking-status",
    question: "How do I check my pooja booking status?",
    answer:
      "With devotion, you can view your active and completed pooja bookings from My Poojas after signing in with the same WhatsApp number used during booking.",
  },
  {
    id: "payment-confirmation",
    question: "I paid, but my booking is not confirmed",
    answer:
      "Payment confirmation may take a few minutes. If the amount was deducted and the booking still does not appear, share the details and our seva team will verify it with care.",
  },
  {
    id: "change-date",
    question: "Can I change my pooja date?",
    answer:
      "Date changes depend on temple availability and the pooja schedule. Our seva team can check the available options for your booking.",
  },
  {
    id: "prasad-delivery",
    question: "When will I receive prasad?",
    answer:
      "Prasad dispatch timelines vary by temple and location. You will receive sacred prasad updates on the mobile number linked to your booking.",
  },
  {
    id: "login-help",
    question: "I cannot log in with WhatsApp OTP",
    answer:
      "Please confirm the number is active and able to receive messages. If the OTP still does not arrive, Mitra can help guide your access request.",
  },
];

const initialDraft: SupportDraft = {
  contactMethod: "",
  name: "",
  phoneNumber: "",
  problem: "",
};

const initialState: SupportState = {
  open: false,
  started: false,
  step: "initial",
  messages: [],
  draft: initialDraft,
  error: "",
  ticketNumber: "",
};

function createMessage(
  role: Message["role"],
  content: string,
  options?: Pick<Message, "options">,
): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ...options,
  };
}

function getFaqOptionMessage() {
  return createMessage("bot", "", {
    options: [
      ...faqs.map((faq) => ({
        id: faq.id,
        content: faq.question,
        action: "select-faq" as const,
        faqId: faq.id,
      })),
      {
        id: "start-support-flow",
        content: "My concern is not listed",
        action: "start-support-flow" as const,
      },
    ],
  });
}

function getGreetingMessages() {
  return [
    createMessage(
      "bot",
      "Namaste \uD83D\uDE4F I am Mitra, your devotional support companion. How may I help you today? Please choose one of the options below.",
    ),
    getFaqOptionMessage(),
  ];
}

function removeSubmittingMessage(messages: Message[]) {
  return messages.filter(
    (message) => message.content !== "Submitting your seva request...",
  );
}

function supportReducer(
  state: SupportState,
  action: SupportAction,
): SupportState {
  switch (action.type) {
    case "OPEN":
      if (state.started) return { ...state, open: true };

      return {
        ...initialState,
        open: true,
        started: true,
        messages: [],
      };

    case "CLOSE":
      return { ...state, open: false };

    case "RESET":
      return {
        ...initialState,
        open: true,
        started: true,
        messages: [],
      };

    case "SEND_INITIAL_MESSAGE":
      return {
        ...state,
        step: "faq",
        error: "",
        messages: [
          ...state.messages,
          createMessage("user", action.value.trim()),
          ...getGreetingMessages(),
        ],
      };

    case "SELECT_FAQ":
      return {
        ...state,
        step: "faq-resolution",
        error: "",
        messages: [
          ...state.messages,
          createMessage("user", action.faq.question),
          createMessage("bot", action.faq.answer),
          createMessage("bot", "Did this bring clarity to your concern?"),
        ],
      };

    case "FAQ_SOLVED":
      return {
        ...state,
        step: "ended",
        error: "",
        messages: [
          ...state.messages,
          createMessage("user", "Yes"),
          createMessage(
            "bot",
            "Glad to help. May your seva continue smoothly \uD83D\uDE4F",
          ),
        ],
      };

    case "LOGIN_REQUIRED":
      return {
        ...state,
        step: "login-required",
        error: "",
        messages: [
          ...state.messages,
          createMessage(
            "user",
            state.step === "faq-resolution" ? "No" : "My concern is not listed",
          ),
          createMessage("bot", LOGIN_REQUIRED_MESSAGE),
        ],
      };
    case "START_SUPPORT_FLOW":
      return {
        ...state,
        step: "contact-preference",
        error: "",
        messages: [
          ...state.messages,
          createMessage(
            "user",
            state.step === "faq-resolution" ? "No" : "My concern is not listed",
          ),
          createMessage(
            "bot",
            "How would you like our seva team to contact you?",
          ),
        ],
      };

    case "SET_CONTACT":
      return {
        ...state,
        step: "name",
        error: "",
        draft: { ...state.draft, contactMethod: action.value },
        messages: [
          ...state.messages,
          createMessage(
            "user",
            action.value === "WHATSAPP" ? "WhatsApp" : "Call",
          ),
          createMessage("bot", "Please share your name."),
        ],
      };

    case "SET_NAME":
      return {
        ...state,
        step: "mobile",
        error: "",
        draft: { ...state.draft, name: action.value.trim() },
        messages: [
          ...state.messages,
          createMessage("user", action.value.trim()),
          createMessage(
            "bot",
            "Please enter your mobile number so we can reach you.",
          ),
        ],
      };

    case "SET_MOBILE":
      return {
        ...state,
        step: "description",
        error: "",
        draft: { ...state.draft, phoneNumber: action.value },
        messages: [
          ...state.messages,
          createMessage("user", action.value),
          createMessage(
            "bot",
            "Please describe your concern. Mitra is listening.",
          ),
        ],
      };

    case "MOBILE_VALIDATION_REPLY":
      return {
        ...state,
        step: "mobile",
        error: "",
        messages: [
          ...state.messages,
          ...(action.value ? [createMessage("user", action.value)] : []),
          createMessage("bot", action.error),
        ],
      };

    case "MOBILE_REPLY_ERROR":
      return {
        ...state,
        step: "ended",
        error: "",
        draft: { ...state.draft, phoneNumber: action.value },
        messages: [
          ...state.messages,
          createMessage("user", action.value),
          createMessage("bot", action.error),
        ],
      };

    case "SET_DESCRIPTION":
      return {
        ...state,
        error: "",
        draft: { ...state.draft, problem: action.value.trim() },
        messages: [
          ...state.messages,
          createMessage("user", action.value.trim()),
        ],
      };

    case "SUBMIT_START":
      return {
        ...state,
        step: "submitting",
        error: "",
        messages: [
          ...state.messages,
          createMessage("system", "Submitting your seva request..."),
        ],
      };

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        step: "success",
        error: "",
        ticketNumber: action.ticketNumber,
        messages: [
          ...removeSubmittingMessage(state.messages),
          createMessage(
            "bot",
            `Our seva team will contact you within 24 hours.${
              action.ticketNumber
                ? `\n\nTicket number: ${action.ticketNumber}`
                : ""
            }`,
          ),
        ],
      };

    case "VALIDATION_ERROR":
      return { ...state, error: action.error };

    case "SUBMIT_ERROR":
      return {
        ...state,
        step: "description",
        error: action.error,
        messages: removeSubmittingMessage(state.messages),
      };

    case "SUBMIT_REPLY_ERROR":
      return {
        ...state,
        step: "ended",
        error: "",
        messages: [
          ...removeSubmittingMessage(state.messages),
          createMessage("bot", action.error),
        ],
      };

    case "CLEAR_ERROR":
      return { ...state, error: "" };

    default:
      return state;
  }
}

function isValidIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

function getMessageTypingDelay(content: string) {
  return Math.min(1600, Math.max(700, content.length * 14));
}

function getMessageRevealDelays(messages: Message[]) {
  const revealDelays = new Map<string, number>();
  let botSequenceDelay = 0;

  messages.forEach((message) => {
    if (message.role !== "bot") {
      botSequenceDelay = 0;
      revealDelays.set(message.id, 0);
      return;
    }

    botSequenceDelay += getMessageTypingDelay(message.content);
    revealDelays.set(message.id, botSequenceDelay);
  });

  return revealDelays;
}

function getTrailingBotRevealDelay(messages: Message[]) {
  let delay = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== "bot") break;

    delay += getMessageTypingDelay(message.content);
  }

  return delay;
}

function MitraAvatar({ className }: { className?: string }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-saffron text-sm font-extrabold text-white",
          className,
        )}
      >
        M
      </span>
    );
  }

  return (
    <Image
      src={MITRA_AVATAR_SRC}
      alt="Mitra"
      width={80}
      height={80}
      unoptimized
      onError={() => setHasImageError(true)}
      className={cn("rounded-full object-cover", className)}
    />
  );
}

function playMitraNotificationSound() {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    920,
    audioContext.currentTime + 0.08,
  );
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.045,
    audioContext.currentTime + 0.02,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.16,
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.18);
  window.setTimeout(() => void audioContext.close(), 260);
}
function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Mitra is typing">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45" />
    </span>
  );
}

function MessageBubble({
  message,
  revealDelayMs,
  disabled = false,
  alreadyRevealed = false,
  onReveal,
  onSelectFaq,
  onStartSupportFlow,
  onLoginSuccess,
}: {
  message: Message;
  revealDelayMs: number;
  disabled?: boolean;
  alreadyRevealed?: boolean;
  onReveal?: (messageId: string) => void;
  onSelectFaq?: (faqId: string) => void;
  onStartSupportFlow?: () => void;
  onLoginSuccess?: () => void;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const shouldDelayReply = message.role === "bot" && !alreadyRevealed;
  const hasOptions = Boolean(message.options?.length);
  const [showContent, setShowContent] = useState(!shouldDelayReply);
  const hasPlayedNotificationRef = useRef(!shouldDelayReply);

  useEffect(() => {
    if (!shouldDelayReply) return;

    const timeout = window.setTimeout(
      () => setShowContent(true),
      revealDelayMs,
    );

    return () => window.clearTimeout(timeout);
  }, [revealDelayMs, shouldDelayReply]);

  useEffect(() => {
    if (message.role !== "bot" || !showContent) return;

    onReveal?.(message.id);

    if (hasPlayedNotificationRef.current) return;

    hasPlayedNotificationRef.current = true;
    playMitraNotificationSound();
  }, [message.id, message.role, onReveal, showContent]);

  function handleOptionClick(option: FaqOption) {
    if (disabled || !showContent) return;

    if (option.action === "select-faq" && option.faqId) {
      onSelectFaq?.(option.faqId);
      return;
    }

    if (option.action === "start-support-flow") {
      onStartSupportFlow?.();
    }
  }

  const bubbleClassName = cn(
    "max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm text-wrap-safe",
    isUser && "rounded-br-md bg-saffron text-white shadow-orange-900/10",
    !isUser &&
      !isSystem &&
      "rounded-bl-md border border-black/10 bg-white text-text-primary",
    hasOptions && "w-[86%] space-y-2",
    isSystem &&
      "rounded-full border border-saffron/20 bg-[#fff4e8] text-xs text-text-primary/70",
  );
  const messageContent =
    message.content === LOGIN_REQUIRED_MESSAGE ? (
      <>
        Please{" "}
        <WhatsAppLoginModal
          triggerVariant="link"
          triggerContent="login"
          onLoginSuccess={onLoginSuccess}
        />{" "}
        first so we can save your seva request details securely.
      </>
    ) : (
      message.content
    );

  const content = showContent ? (
    <>
      {hasOptions ? (
        <div className="grid gap-2">
          {message.options?.map((option) => (
            <button
              key={option.id}
              type="button"
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#fff8f0] px-3 py-2 text-left text-sm font-bold leading-5 text-text-primary transition-colors hover:border-saffron/45 hover:bg-[#fff1df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => handleOptionClick(option)}
              disabled={disabled || !showContent}
            >
              <span>{option.content}</span>
              <ChevronRight className="motion-arrow-right h-4 w-4 shrink-0 text-saffron" />
            </button>
          ))}
        </div>
      ) : (
        messageContent
      )}
      {isUser && (
        <span
          className="mt-1 flex justify-end text-white/80"
          aria-label="Message sent"
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  ) : (
    <TypingIndicator />
  );

  return (
    <div
      className={cn(
        "support-chat-message flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className={bubbleClassName}>{content}</div>
    </div>
  );
}

function formatSupportHistoryDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatSupportStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function supportHistoryStatusClass(status: SupportTicketHistoryItem["status"]) {
  if (status === "RESOLVED") return "bg-[#e7f8ee] text-[#1f9b52]";
  if (status === "IN_PROGRESS") return "bg-[#fff1dc] text-[#e67e22]";

  return "bg-[#e9f1ff] text-[#2463d5]";
}

function SupportHistorySection({
  error,
  isAuthenticated,
  isLoading,
  onLoginSuccess,
  onRefresh,
  tickets,
}: {
  error: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  onLoginSuccess: () => void;
  onRefresh: () => void;
  tickets: SupportTicketHistoryItem[];
}) {
  return (
    <section className="border-b border-black/10 bg-[#fffaf5] px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="inline-flex min-w-0 items-center gap-2 text-sm font-extrabold text-text-primary">
          <History className="h-4 w-4 shrink-0 text-saffron" />
          <span className="truncate">Recent seva requests</span>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isAuthenticated || isLoading}
          className="text-xs font-extrabold text-saffron transition-colors hover:text-[#c96c1a] disabled:cursor-not-allowed disabled:opacity-55"
        >
          Refresh
        </button>
      </div>

      {!isAuthenticated ? (
        <p className="text-xs font-bold leading-5 text-text-primary/55">
          <WhatsAppLoginModal
            triggerVariant="link"
            triggerContent="Login"
            onLoginSuccess={onLoginSuccess}
          />{" "}
          to check your seva request history.
        </p>
      ) : isLoading ? (
        <p className="inline-flex items-center gap-2 text-xs font-bold text-text-primary/55">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-saffron" />
          Loading seva history
        </p>
      ) : error ? (
        <p className="text-xs font-bold leading-5 text-red-600">{error}</p>
      ) : tickets.length === 0 ? (
        <p className="text-xs font-bold leading-5 text-text-primary/55">
          No seva history yet.
        </p>
      ) : (
        <div className="space-y-2">
          {tickets.slice(0, 5).map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-xl border border-black/10 bg-[#fffaf5] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-text-primary">
                    {ticket.ticketNumber || "Seva request"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-text-primary/45">
                    {formatSupportHistoryDate(ticket.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${supportHistoryStatusClass(
                    ticket.status,
                  )}`}
                >
                  {formatSupportStatus(ticket.status)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-text-primary/65">
                {ticket.problem}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function FooterGate({
  children,
  readyDelayMs,
}: {
  children: ReactNode;
  readyDelayMs: number;
}) {
  const [isReady, setIsReady] = useState(readyDelayMs === 0);

  useEffect(() => {
    if (readyDelayMs === 0) return;

    const timeout = window.setTimeout(() => setIsReady(true), readyDelayMs);

    return () => window.clearTimeout(timeout);
  }, [readyDelayMs]);

  if (!isReady) return <div className="min-h-11" />;

  return <>{children}</>;
}

export function SupportChatWidget() {
  const [state, dispatch] = useReducer(supportReducer, initialState);
  const [initialInput, setInitialInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [mobileAvailabilityMessage, setMobileAvailabilityMessage] =
    useState("");
  const [supportHistory, setSupportHistory] = useState<
    SupportTicketHistoryItem[]
  >([]);
  const [isSupportHistoryLoading, setIsSupportHistoryLoading] = useState(false);
  const [supportHistoryError, setSupportHistoryError] = useState("");
  const [supportHistoryReloadKey, setSupportHistoryReloadKey] = useState(0);
  const [isSupportHistoryOpen, setIsSupportHistoryOpen] = useState(false);
  const [isCheckingMobileAvailability, setIsCheckingMobileAvailability] =
    useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
    isLauncherHandle: boolean;
  } | null>(null);
  const suppressNextLauncherClickRef = useRef(false);
  const [chatPosition, setChatPosition] = useState<ChatPosition | null>(null);
  const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const isAuthenticated = useAuthStore(
    (authState) => authState.isAuthenticated,
  );

  const messageRevealDelays = useMemo(
    () => getMessageRevealDelays(state.messages),
    [state.messages],
  );
  const footerReadyDelay = useMemo(
    () => getTrailingBotRevealDelay(state.messages),
    [state.messages],
  );
  const footerGateKey = `${state.step}-${state.messages.at(-1)?.id ?? "empty"}`;
  const faqById = useMemo(() => new Map(faqs.map((faq) => [faq.id, faq])), []);
  const getClampedChatPosition = useCallback((position: ChatPosition) => {
    if (typeof window === "undefined") return position;

    const margin = 12;
    const rect = widgetRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 64;
    const height = rect?.height ?? 64;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);

    return {
      x: Math.min(Math.max(position.x, margin), maxX),
      y: Math.min(Math.max(position.y, margin), maxY),
    };
  }, []);
  const getDefaultChatPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 12, y: 12 };

    const rect = widgetRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 64;
    const height = rect?.height ?? 64;
    const rightOffset = window.innerWidth >= 640 ? 16 : 12;
    const bottomOffset = window.innerWidth >= 640 ? 24 : 64;

    return getClampedChatPosition({
      x: window.innerWidth - width - rightOffset,
      y: window.innerHeight - height - bottomOffset,
    });
  }, [getClampedChatPosition]);
  const markMessageRevealed = useCallback((messageId: string) => {
    setRevealedMessageIds((current) => {
      if (current.has(messageId)) return current;

      const next = new Set(current);
      next.add(messageId);
      return next;
    });
  }, []);

  useEffect(() => {
    function syncChatPosition() {
      setChatPosition((current) =>
        getClampedChatPosition(current ?? getDefaultChatPosition()),
      );
    }

    syncChatPosition();
    window.addEventListener("resize", syncChatPosition);

    return () => window.removeEventListener("resize", syncChatPosition);
  }, [getClampedChatPosition, getDefaultChatPosition, state.open]);

  useEffect(() => {
    if (!state.open) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [state.messages, state.open, state.error]);

  useEffect(() => {
    if (!state.open) return;

    const activeInput =
      state.step === "initial"
        ? initialInputRef.current
        : state.step === "name"
          ? nameInputRef.current
          : state.step === "mobile"
            ? mobileInputRef.current
            : state.step === "description"
              ? descriptionInputRef.current
              : null;

    window.setTimeout(() => activeInput?.focus(), 80);
  }, [state.open, state.step]);

  useEffect(() => {
    if (!state.open) return;

    let cancelled = false;

    async function loadSupportHistory() {
      setIsSupportHistoryLoading(true);
      setSupportHistoryError("");

      try {
        const history = await getSupportTicketHistoryApi();

        if (!cancelled) setSupportHistory(history);
      } catch (error: unknown) {
        if (!cancelled) {
          if (isSupportTicketApiError(error) && error.status === 401) {
            setSupportHistoryError("Sign in to view your seva history.");
          } else {
            setSupportHistoryError(
              getErrorMessage(error, "Unable to load seva history."),
            );
          }
          setSupportHistory([]);
        }
      } finally {
        if (!cancelled) setIsSupportHistoryLoading(false);
      }
    }

    void loadSupportHistory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, state.open, supportHistoryReloadKey]);
  useEffect(() => {
    if (state.step !== "mobile" || !isValidIndianMobile(mobileInput)) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsCheckingMobileAvailability(true);

      try {
        const availability =
          await checkSupportTicketAvailabilityApi(mobileInput);

        if (cancelled) return;

        setMobileAvailabilityMessage(
          availability.canCreate ? "" : (availability.message ?? ""),
        );
      } catch {
        if (!cancelled) {
          setMobileAvailabilityMessage("");
        }
      } finally {
        if (!cancelled) {
          setIsCheckingMobileAvailability(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [mobileInput, state.step]);
  function openWidget() {
    setIsSupportHistoryOpen(false);
    dispatch({ type: "OPEN" });
  }

  function closeWidget() {
    setIsSupportHistoryOpen(false);
    dispatch({ type: "CLOSE" });
  }

  function sendChatAction(action: SupportAction) {
    setIsSupportHistoryOpen(false);
    dispatch(action);
  }

  function requestSupportFlow() {
    sendChatAction({
      type: isAuthenticated ? "START_SUPPORT_FLOW" : "LOGIN_REQUIRED",
    });
  }
  function handleInitialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = initialInput.trim();

    if (!message) {
      sendChatAction({
        type: "VALIDATION_ERROR",
        error: "Please enter a message.",
      });
      return;
    }

    sendChatAction({ type: "SEND_INITIAL_MESSAGE", value: message });
    setInitialInput("");
  }

  function handleFaqMessageSelect(faqId: string) {
    const faq = faqById.get(faqId);

    if (!faq || state.step !== "faq") return;

    sendChatAction({ type: "SELECT_FAQ", faq });
  }

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = nameInput.trim();

    if (normalizedName.length < 2) {
      sendChatAction({
        type: "VALIDATION_ERROR",
        error: "Please enter your name.",
      });
      return;
    }

    sendChatAction({ type: "SET_NAME", value: normalizedName });
    setNameInput("");
  }

  function handleMobileChange(value: string) {
    setMobileInput(value.replace(/\D/g, "").slice(0, 10));
    setMobileAvailabilityMessage("");
    setIsCheckingMobileAvailability(false);
    sendChatAction({ type: "CLEAR_ERROR" });
  }

  async function handleMobileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidIndianMobile(mobileInput)) {
      sendChatAction({
        type: "MOBILE_VALIDATION_REPLY",
        value: mobileInput,
        error: "Please enter a valid 10-digit mobile number.",
      });
      setMobileInput("");
      setMobileAvailabilityMessage("");
      return;
    }

    if (mobileAvailabilityMessage) {
      sendChatAction({
        type: "MOBILE_REPLY_ERROR",
        value: mobileInput,
        error: mobileAvailabilityMessage,
      });
      setMobileInput("");
      setMobileAvailabilityMessage("");
      return;
    }

    setIsCheckingMobileAvailability(true);

    try {
      const availability = await checkSupportTicketAvailabilityApi(mobileInput);

      if (!availability.canCreate) {
        const message = availability.message ?? "";
        sendChatAction({
          type: "MOBILE_REPLY_ERROR",
          value: mobileInput,
          error: message,
        });
        setMobileInput("");
        setMobileAvailabilityMessage("");
        return;
      }

      sendChatAction({ type: "SET_MOBILE", value: mobileInput });
      setMobileInput("");
      setMobileAvailabilityMessage("");
    } catch (error: unknown) {
      sendChatAction({
        type: "VALIDATION_ERROR",
        error: getErrorMessage(
          error,
          "Unable to check your existing seva request. Please try again.",
        ),
      });
    } finally {
      setIsCheckingMobileAvailability(false);
    }
  }

  function handleChatPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    const target = event.target instanceof HTMLElement ? event.target : null;
    const dragHandle = target?.closest("[data-chat-drag-handle]");

    if (!dragHandle) return;

    const isLauncherHandle = Boolean(
      target?.closest("[data-chat-launcher-handle]"),
    );

    if (
      !isLauncherHandle &&
      target?.closest("button, a, input, textarea, select")
    ) {
      return;
    }

    const rect = widgetRef.current?.getBoundingClientRect();

    if (!rect) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
      isLauncherHandle,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleChatPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const movedDistance = Math.hypot(
      event.clientX - dragState.startX,
      event.clientY - dragState.startY,
    );

    if (movedDistance > 4) {
      dragState.hasMoved = true;
    }

    setChatPosition(
      getClampedChatPosition({
        x: event.clientX - dragState.offsetX,
        y: event.clientY - dragState.offsetY,
      }),
    );
  }

  function handleChatPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragState.isLauncherHandle) {
      suppressNextLauncherClickRef.current = true;

      if (!dragState.hasMoved) {
        if (state.open) {
          closeWidget();
        } else {
          openWidget();
        }
      }
    }
  }

  async function handleDescriptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = descriptionInput.trim();

    if (problem.length < 10) {
      sendChatAction({
        type: "VALIDATION_ERROR",
        error: "Please describe your concern in at least 10 characters.",
      });
      return;
    }

    if (problem.length > 1000) {
      sendChatAction({
        type: "VALIDATION_ERROR",
        error: "Please keep the concern description under 1000 characters.",
      });
      return;
    }

    sendChatAction({ type: "SET_DESCRIPTION", value: problem });
    sendChatAction({ type: "SUBMIT_START" });

    try {
      const ticket = await createSupportTicketApi({
        contactMethod: state.draft.contactMethod || "WHATSAPP",
        name: state.draft.name,
        phoneNumber: state.draft.phoneNumber,
        problem,
      });

      sendChatAction({
        type: "SUBMIT_SUCCESS",
        ticketNumber: ticket.ticketNumber,
      });
      setDescriptionInput("");
      setSupportHistoryReloadKey((current) => current + 1);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Unable to submit your seva request. Please try again.",
      );

      if (
        isSupportTicketApiError(error) &&
        error.status !== undefined &&
        error.status < 500
      ) {
        sendChatAction({ type: "SUBMIT_REPLY_ERROR", error: errorMessage });
        setDescriptionInput("");
        return;
      }

      sendChatAction({
        type: "SUBMIT_ERROR",
        error: errorMessage,
      });
    }
  }

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-90 scrollbar-thumb-saffron",
        !chatPosition && "bottom-16 right-3 sm:bottom-6 sm:right-4",
      )}
      style={
        chatPosition ? { left: chatPosition.x, top: chatPosition.y } : undefined
      }
      onPointerDown={handleChatPointerDown}
      onPointerMove={handleChatPointerMove}
      onPointerUp={handleChatPointerUp}
      onPointerCancel={handleChatPointerUp}
    >
      {state.open && (
        <section
          className="support-chat-panel mb-2 flex h-[min(560px,calc(100svh-10rem))] w-[calc(100vw-1.5rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-app-bg shadow-2xl shadow-[#071535]/20 sm:mb-3 sm:h-[min(640px,calc(100svh-7rem))] sm:w-[400px] sm:max-w-none"
          aria-label="Mitra support chat"
        >
          <header
            className="flex touch-none cursor-move select-none items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3"
            data-chat-drag-handle
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron text-white shadow-md shadow-orange-900/15">
                <MitraAvatar className="h-10 w-10" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold leading-6 text-text-primary">
                  Mitra
                </h2>
                <p className="truncate text-xs font-semibold text-text-primary/55">
                  Devotional support companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-text-primary/60 transition-colors hover:bg-saffron/10 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
                  isSupportHistoryOpen && "bg-saffron/10 text-saffron",
                )}
                onClick={() => setIsSupportHistoryOpen((current) => !current)}
                aria-label="View seva history"
                aria-pressed={isSupportHistoryOpen}
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/60 transition-colors hover:bg-saffron/10 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                onClick={() => {
                  setIsSupportHistoryOpen(false);
                  sendChatAction({ type: "RESET" });
                }}
                aria-label="Restart support chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/60 transition-colors hover:bg-saffron/10 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                onClick={closeWidget}
                aria-label="Close Mitra chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {isSupportHistoryOpen && (
            <SupportHistorySection
              error={supportHistoryError}
              isAuthenticated={isAuthenticated}
              isLoading={isSupportHistoryLoading}
              onLoginSuccess={() =>
                setSupportHistoryReloadKey((current) => current + 1)
              }
              onRefresh={() =>
                setSupportHistoryReloadKey((current) => current + 1)
              }
              tickets={supportHistory}
            />
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {state.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  revealDelayMs={messageRevealDelays.get(message.id) ?? 0}
                  alreadyRevealed={revealedMessageIds.has(message.id)}
                  onReveal={markMessageRevealed}
                  disabled={state.step !== "faq"}
                  onSelectFaq={handleFaqMessageSelect}
                  onStartSupportFlow={requestSupportFlow}
                  onLoginSuccess={() => {
                    setSupportHistoryReloadKey((current) => current + 1);
                    sendChatAction({ type: "START_SUPPORT_FLOW" });
                  }}
                />
              ))}

              {state.error && (
                <p
                  role="alert"
                  className="support-chat-message rounded-xl border border-red-200 bg-[#fff0ee] px-4 py-3 text-sm font-bold leading-6 text-red-700"
                >
                  {state.error}
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {state.step !== "faq" && (
            <div className="border-t border-black/10 bg-white p-3">
              <FooterGate key={footerGateKey} readyDelayMs={footerReadyDelay}>
                {state.step === "initial" && (
                  <form
                    className="flex gap-2"
                    onSubmit={handleInitialSubmit}
                    noValidate
                  >
                    <Input
                      ref={initialInputRef}
                      value={initialInput}
                      onChange={(event) => {
                        setInitialInput(event.target.value);
                        sendChatAction({ type: "CLEAR_ERROR" });
                      }}
                      placeholder="Type your message"
                      aria-label="Message to Mitra"
                      aria-invalid={Boolean(state.error)}
                      className="h-11 rounded-xl"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                )}

                {state.step === "faq-resolution" && (
                  <div className="grid h-11 grid-cols-2 overflow-hidden rounded-full border border-saffron/25 bg-white p-1 shadow-sm shadow-orange-900/10">
                    <button
                      type="button"
                      className="flex h-full items-center justify-center rounded-full bg-saffron px-4 text-sm font-extrabold leading-none text-white transition-colors hover:bg-[#c96c1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                      onClick={() => sendChatAction({ type: "FAQ_SOLVED" })}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className="flex h-full items-center justify-center rounded-full px-4 text-sm font-extrabold leading-none text-text-primary/55 transition-colors hover:bg-[#fff4e8] hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                      onClick={requestSupportFlow}
                    >
                      No
                    </button>
                  </div>
                )}

                {state.step === "contact-preference" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className="h-11 rounded-xl font-bold"
                      onClick={() =>
                        sendChatAction({
                          type: "SET_CONTACT",
                          value: "WHATSAPP",
                        })
                      }
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl font-bold"
                      onClick={() =>
                        sendChatAction({ type: "SET_CONTACT", value: "CALL" })
                      }
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                )}

                {state.step === "name" && (
                  <form
                    className="flex gap-2"
                    onSubmit={handleNameSubmit}
                    noValidate
                  >
                    <Input
                      ref={nameInputRef}
                      value={nameInput}
                      onChange={(event) => {
                        setNameInput(event.target.value);
                        sendChatAction({ type: "CLEAR_ERROR" });
                      }}
                      placeholder="Your name"
                      autoComplete="name"
                      aria-label="Your name"
                      aria-invalid={Boolean(state.error)}
                      className="h-11 rounded-xl"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Continue</span>
                    </Button>
                  </form>
                )}

                {state.step === "mobile" && (
                  <div className="space-y-2">
                    <form
                      className="flex gap-2"
                      onSubmit={handleMobileSubmit}
                      noValidate
                    >
                      <Input
                        ref={mobileInputRef}
                        value={mobileInput}
                        onChange={(event) =>
                          handleMobileChange(event.target.value)
                        }
                        placeholder="10-digit mobile number"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        aria-label="Mobile number"
                        aria-invalid={Boolean(state.error)}
                        className="h-11 rounded-xl"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-xl"
                        disabled={isCheckingMobileAvailability}
                      >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Continue</span>
                      </Button>
                    </form>

                    {isCheckingMobileAvailability && (
                      <p className="text-xs font-bold text-text-primary/55">
                        Checking existing seva request...
                      </p>
                    )}
                  </div>
                )}

                {state.step === "description" && (
                  <form
                    className="flex gap-2"
                    onSubmit={handleDescriptionSubmit}
                    noValidate
                  >
                    <Input
                      ref={descriptionInputRef}
                      value={descriptionInput}
                      onChange={(event) => {
                        setDescriptionInput(event.target.value);
                        sendChatAction({ type: "CLEAR_ERROR" });
                      }}
                      placeholder="Describe your concern"
                      maxLength={1000}
                      aria-label="Concern description"
                      aria-invalid={Boolean(state.error)}
                      className="h-11 rounded-xl"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Submit seva request</span>
                    </Button>
                  </form>
                )}

                {state.step === "submitting" && (
                  <Button className="h-11 w-full rounded-xl font-bold" disabled>
                    Submitting...
                  </Button>
                )}

                {(state.step === "success" || state.step === "ended") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl font-bold"
                    onClick={() => {
                      setIsSupportHistoryOpen(false);
                      sendChatAction({ type: "RESET" });
                    }}
                  >
                    Start a new conversation
                  </Button>
                )}
              </FooterGate>
            </div>
          )}
        </section>
      )}

      <div className="relative flex justify-end">
        <Button
          type="button"
          size="xl"
          className="support-chat-trigger h-14 w-14 touch-none cursor-move rounded-full p-0 shadow-xl shadow-orange-900/20 sm:h-auto sm:w-auto sm:px-6"
          data-chat-drag-handle
          data-chat-launcher-handle
          onClick={(event) => {
            if (suppressNextLauncherClickRef.current) {
              suppressNextLauncherClickRef.current = false;
              event.preventDefault();
              return;
            }

            if (state.open) {
              closeWidget();
            } else {
              openWidget();
            }
          }}
          aria-expanded={state.open}
          aria-label={state.open ? "Close Mitra chat" : "Open Mitra chat"}
        >
          {state.open ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MitraAvatar className="h-6 w-6 sm:mr-2" />
              <span className="hidden sm:inline">Chat with Mitra</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
