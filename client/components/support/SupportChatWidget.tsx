"use client";

import {
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  CheckCheck,
  CheckCircle2,
  Headphones,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkSupportTicketAvailabilityApi,
  createSupportTicketApi,
  isSupportTicketApiError,
  type SupportContactMethod,
} from "@/lib/api/support/support-tickets.api";
import { cn, getErrorMessage } from "@/lib/utils";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type Message = {
  id: string;
  role: "bot" | "user" | "system";
  content: string;
};

type SupportStep =
  | "faq"
  | "faq-resolution"
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
  | { type: "SELECT_FAQ"; faq: FaqItem }
  | { type: "FAQ_SOLVED" }
  | { type: "START_SUPPORT_FLOW" }
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

const faqs: FaqItem[] = [
  {
    id: "booking-status",
    question: "How do I check my pooja booking status?",
    answer:
      "You can view your active and completed bookings from My Poojas after signing in with the same WhatsApp number used during booking.",
  },
  {
    id: "payment-confirmation",
    question: "I paid, but my booking is not confirmed",
    answer:
      "Payment confirmation can take a few minutes. If the amount was deducted and the booking still does not appear, share the details with support so we can verify it.",
  },
  {
    id: "change-date",
    question: "Can I change my pooja date?",
    answer:
      "Date changes depend on temple availability and the pooja schedule. Our team can check the available options for your booking.",
  },
  {
    id: "prasad-delivery",
    question: "When will I receive prasad?",
    answer:
      "Prasad dispatch timelines vary by temple and location. You will receive updates on the mobile number linked to your booking.",
  },
  {
    id: "login-help",
    question: "I cannot log in with WhatsApp OTP",
    answer:
      "Please confirm the number is active and able to receive messages. If the OTP still does not arrive, support can help verify your access.",
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
  step: "faq",
  messages: [],
  draft: initialDraft,
  error: "",
  ticketNumber: "",
};

function createMessage(role: Message["role"], content: string): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function getInitialMessages() {
  return [
    createMessage(
      "bot",
      "Namaste. How can we help you today? Please choose one of the options below.",
    ),
  ];
}

function removeSubmittingMessage(messages: Message[]) {
  return messages.filter(
    (message) => message.content !== "Submitting your support request...",
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
        messages: getInitialMessages(),
      };

    case "CLOSE":
      return { ...state, open: false };

    case "RESET":
      return {
        ...initialState,
        open: true,
        started: true,
        messages: getInitialMessages(),
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
          createMessage("bot", "Did this solve your issue?"),
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
          createMessage("bot", "Happy to help \uD83D\uDE4F"),
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
            state.step === "faq-resolution" ? "No" : "My issue isn't listed",
          ),
          createMessage("bot", "How would you like us to contact you?"),
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
          createMessage("bot", "Please tell us your name."),
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
          createMessage("bot", "Please enter your mobile number."),
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
          createMessage("bot", "Please describe the problem."),
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
          createMessage("system", "Submitting your support request..."),
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
            `Thank you.\n\nYour request has been submitted successfully.\n\nOur support team will contact you within 24 hours.${
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

function TypingIndicator() {
  return (
    <span
      className="flex items-center gap-1 py-1"
      aria-label="Support is typing"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-primary/45" />
    </span>
  );
}

function MessageBubble({
  message,
  revealDelayMs,
}: {
  message: Message;
  revealDelayMs: number;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const shouldDelayReply = message.role === "bot";
  const [showContent, setShowContent] = useState(!shouldDelayReply);

  useEffect(() => {
    if (!shouldDelayReply) return;

    const timeout = window.setTimeout(
      () => setShowContent(true),
      revealDelayMs,
    );

    return () => window.clearTimeout(timeout);
  }, [revealDelayMs, shouldDelayReply]);

  return (
    <div
      className={cn(
        "support-chat-message flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm text-wrap-safe",
          isUser && "rounded-br-md bg-saffron text-white shadow-orange-900/10",
          !isUser &&
            !isSystem &&
            "rounded-bl-md border border-black/10 bg-white text-text-primary",
          isSystem &&
            "rounded-full border border-saffron/20 bg-[#fff4e8] text-xs text-text-primary/70",
        )}
      >
        {showContent ? (
          <>
            {message.content}
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
        )}
      </div>
    </div>
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
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [mobileAvailabilityMessage, setMobileAvailabilityMessage] =
    useState("");
  const [isCheckingMobileAvailability, setIsCheckingMobileAvailability] =
    useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const activeFaqs = useMemo(() => faqs, []);
  const messageRevealDelays = useMemo(
    () => getMessageRevealDelays(state.messages),
    [state.messages],
  );
  const footerReadyDelay = useMemo(
    () => getTrailingBotRevealDelay(state.messages),
    [state.messages],
  );
  const footerGateKey = `${state.step}-${state.messages.at(-1)?.id ?? "empty"}`;

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
      state.step === "name"
        ? nameInputRef.current
        : state.step === "mobile"
          ? mobileInputRef.current
          : state.step === "description"
            ? descriptionInputRef.current
            : null;

    window.setTimeout(() => activeInput?.focus(), 80);
  }, [state.open, state.step]);

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
    dispatch({ type: "OPEN" });
  }

  function closeWidget() {
    dispatch({ type: "CLOSE" });
  }

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = nameInput.trim();

    if (normalizedName.length < 2) {
      dispatch({ type: "VALIDATION_ERROR", error: "Please enter your name." });
      return;
    }

    dispatch({ type: "SET_NAME", value: normalizedName });
    setNameInput("");
  }

  function handleMobileChange(value: string) {
    setMobileInput(value.replace(/\D/g, "").slice(0, 10));
    setMobileAvailabilityMessage("");
    setIsCheckingMobileAvailability(false);
    dispatch({ type: "CLEAR_ERROR" });
  }

  async function handleMobileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidIndianMobile(mobileInput)) {
      dispatch({
        type: "MOBILE_VALIDATION_REPLY",
        value: mobileInput,
        error: "Please enter a valid 10-digit mobile number.",
      });
      setMobileInput("");
      setMobileAvailabilityMessage("");
      return;
    }

    if (mobileAvailabilityMessage) {
      dispatch({
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
        dispatch({
          type: "MOBILE_REPLY_ERROR",
          value: mobileInput,
          error: message,
        });
        setMobileInput("");
        setMobileAvailabilityMessage("");
        return;
      }

      dispatch({ type: "SET_MOBILE", value: mobileInput });
      setMobileInput("");
      setMobileAvailabilityMessage("");
    } catch (error: unknown) {
      dispatch({
        type: "VALIDATION_ERROR",
        error: getErrorMessage(
          error,
          "Unable to check your existing support request. Please try again.",
        ),
      });
    } finally {
      setIsCheckingMobileAvailability(false);
    }
  }

  async function handleDescriptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = descriptionInput.trim();

    if (problem.length < 10) {
      dispatch({
        type: "VALIDATION_ERROR",
        error: "Please describe the problem in at least 10 characters.",
      });
      return;
    }

    if (problem.length > 1000) {
      dispatch({
        type: "VALIDATION_ERROR",
        error: "Please keep the problem description under 1000 characters.",
      });
      return;
    }

    dispatch({ type: "SET_DESCRIPTION", value: problem });
    dispatch({ type: "SUBMIT_START" });

    try {
      const ticket = await createSupportTicketApi({
        contactMethod: state.draft.contactMethod || "WHATSAPP",
        name: state.draft.name,
        phoneNumber: state.draft.phoneNumber,
        problem,
      });

      dispatch({
        type: "SUBMIT_SUCCESS",
        ticketNumber: ticket.ticketNumber,
      });
      setDescriptionInput("");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Unable to submit your support request. Please try again.",
      );

      if (
        isSupportTicketApiError(error) &&
        error.status !== undefined &&
        error.status < 500
      ) {
        dispatch({ type: "SUBMIT_REPLY_ERROR", error: errorMessage });
        setDescriptionInput("");
        return;
      }

      dispatch({
        type: "SUBMIT_ERROR",
        error: errorMessage,
      });
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-90 sm:bottom-6 sm:right-6 scrollbar-thumb-saffron">
      {state.open && (
        <section
          className="support-chat-panel mb-3 flex h-[min(640px,calc(100svh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-app-bg shadow-2xl shadow-[#071535]/20 sm:w-[400px]"
          aria-label="Support chat"
        >
          <header className="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron text-white shadow-md shadow-orange-900/15">
                <Headphones className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold leading-6 text-text-primary">
                  Yaagam Support
                </h2>
                <p className="truncate text-xs font-semibold text-text-primary/55">
                  Guided support assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/60 transition-colors hover:bg-saffron/10 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                onClick={() => dispatch({ type: "RESET" })}
                aria-label="Restart support chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-primary/60 transition-colors hover:bg-saffron/10 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                onClick={closeWidget}
                aria-label="Close support chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {state.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  revealDelayMs={messageRevealDelays.get(message.id) ?? 0}
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

          <div className="border-t border-black/10 bg-white p-3">
            <FooterGate key={footerGateKey} readyDelayMs={footerReadyDelay}>
            {state.step === "faq" && (
              <div className="grid gap-2">
                {activeFaqs.map((faq) => (
                  <Button
                    key={faq.id}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start whitespace-normal rounded-xl px-4 py-3 text-left text-sm font-bold leading-5"
                    onClick={() => dispatch({ type: "SELECT_FAQ", faq })}
                  >
                    {faq.question}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="gradient"
                  className="h-auto whitespace-normal rounded-xl px-4 py-3 text-sm font-bold leading-5"
                  onClick={() => dispatch({ type: "START_SUPPORT_FLOW" })}
                >
                  My issue isn&apos;t listed
                </Button>
              </div>
            )}

            {state.step === "faq-resolution" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="h-11 rounded-xl font-bold"
                  onClick={() => dispatch({ type: "FAQ_SOLVED" })}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl font-bold"
                  onClick={() => dispatch({ type: "START_SUPPORT_FLOW" })}
                >
                  No
                </Button>
              </div>
            )}

            {state.step === "contact-preference" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="h-11 rounded-xl font-bold"
                  onClick={() =>
                    dispatch({ type: "SET_CONTACT", value: "WHATSAPP" })
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
                    dispatch({ type: "SET_CONTACT", value: "CALL" })
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
                    dispatch({ type: "CLEAR_ERROR" });
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
                    onChange={(event) => handleMobileChange(event.target.value)}
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
                    Checking existing support request...
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
                    dispatch({ type: "CLEAR_ERROR" });
                  }}
                  placeholder="Describe the problem"
                  maxLength={1000}
                  aria-label="Problem description"
                  aria-invalid={Boolean(state.error)}
                  className="h-11 rounded-xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Submit support request</span>
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
                onClick={() => dispatch({ type: "RESET" })}
              >
                Start a new conversation
              </Button>
            )}
            </FooterGate>
          </div>
        </section>
      )}

      <Button
        type="button"
        size="xl"
        className="support-chat-trigger h-14 w-14 rounded-full p-0 shadow-xl shadow-orange-900/20 sm:h-auto sm:w-auto sm:px-6"
        onClick={state.open ? closeWidget : openWidget}
        aria-expanded={state.open}
        aria-label={state.open ? "Close support chat" : "Open support chat"}
      >
        {state.open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6 sm:mr-2" />
            <span className="hidden sm:inline">Support</span>
          </>
        )}
      </Button>
    </div>
  );
}
