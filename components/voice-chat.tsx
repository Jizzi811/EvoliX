"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, Send, Square, Volume2, X } from "lucide-react";
import type { EvoliXMode } from "@/lib/evolix-prompt";
import { EvoliXOrb } from "./evolix-orb";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const welcome: Message = {
  role: "assistant",
  content:
    "Hey Trainer. Ich bin EvoliX – wandelbar, neugierig und bereit für dein nächstes Abenteuer. Was wollen wir entdecken?",
};

export function VoiceChat({
  mode,
  compact = false,
}: {
  mode: EvoliXMode;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState("");
  const [conversationActive, setConversationActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef(messages);
  const conversationActiveRef = useRef(false);
  const processingRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startListeningRef = useRef<() => void>(() => {});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const scheduleListening = useCallback((delay = 350) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (
        conversationActiveRef.current &&
        !processingRef.current &&
        !audioRef.current
      ) {
        startListeningRef.current();
      }
    }, delay);
  }, []);

  const speak = useCallback(async (text: string) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setState("thinking");

    const finishSpeaking = () => {
      audioRef.current = null;
      processingRef.current = false;
      setState("idle");
      scheduleListening();
    };

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("elevenlabs_unavailable");

      const audioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setState("speaking");
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        finishSpeaking();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        finishSpeaking();
      };
      await audio.play();
      return;
    } catch {
      if (!("speechSynthesis" in window)) {
        finishSpeaking();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = 0.98;
      utterance.pitch = 1.05;
      utterance.onstart = () => setState("speaking");
      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;
      window.speechSynthesis.speak(utterance);
    }
  }, [scheduleListening]);

  const send = useCallback(
    async (content: string, useVoice = false) => {
      const clean = content.trim();
      if (!clean || processingRef.current) return;
      processingRef.current = true;
      setError("");
      const nextMessages = [
        ...messagesRef.current,
        { role: "user" as const, content: clean },
      ];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setInput("");
      setState("thinking");
      const requestController = new AbortController();
      requestAbortRef.current = requestController;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, mode }),
          signal: requestController.signal,
        });
        const payload = (await response.json()) as {
          message?: string;
          error?: string;
        };
        if (!response.ok || !payload.message) {
          throw new Error(payload.error || "Keine Antwort");
        }
        const answer = { role: "assistant" as const, content: payload.message };
        const answeredMessages = [...messagesRef.current, answer];
        requestAbortRef.current = null;
        messagesRef.current = answeredMessages;
        setMessages(answeredMessages);
        if (useVoice) void speak(answer.content);
        else {
          processingRef.current = false;
          setState("idle");
          scheduleListening();
        }
      } catch (requestError) {
        requestAbortRef.current = null;
        processingRef.current = false;
        setState("idle");
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Die Verbindung ist unterbrochen.",
        );
        scheduleListening(900);
      }
    },
    [mode, scheduleListening, speak],
  );

  const startListening = useCallback(() => {
    if (
      !conversationActiveRef.current ||
      processingRef.current ||
      recognitionRef.current
    ) {
      return;
    }

    setError("");

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      conversationActiveRef.current = false;
      setConversationActive(false);
      setError(
        "Spracherkennung wird in diesem Browser nicht unterstützt. Chrome oder Edge funktionieren am besten.",
      );
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = true;
    let receivedFinalResult = false;
    setState("listening");

    recognition.onresult = (event) => {
      let transcript = "";
      let finalTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript += event.results[index][0].transcript;
        }
      }
      setInput(transcript);
      if (finalTranscript.trim()) {
        receivedFinalResult = true;
        recognitionRef.current = null;
        void send(finalTranscript, true);
      }
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setState("idle");
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        conversationActiveRef.current = false;
        setConversationActive(false);
        setError("Bitte erlaube den Mikrofonzugriff, damit EvoliX zuhören kann.");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setError("Ich konnte dich nicht verstehen. Versuch es bitte noch einmal.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setState((current) => (current === "listening" ? "idle" : current));
      if (!receivedFinalResult) scheduleListening(250);
    };
    recognition.start();
  }, [scheduleListening, send]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(
    () => () => {
      conversationActiveRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      requestAbortRef.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function toggleConversation() {
    if (conversationActiveRef.current) {
      stopConversation();
      return;
    }

    conversationActiveRef.current = true;
    setConversationActive(true);
    startListeningRef.current();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input, conversationActiveRef.current);
  }

  function stopConversation() {
    conversationActiveRef.current = false;
    setConversationActive(false);
    processingRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setState("idle");
  }

  return (
    <div className={`voice-chat ${compact ? "compact" : ""}`}>
      {!compact && <EvoliXOrb state={state} />}

      <div className="voice-console">
        <div className="console-topline">
          <span className={`status-dot ${state}`} />
          <span>
            {state === "listening"
              ? "EvoliX hört zu"
              : state === "thinking"
                ? "EvoliX denkt nach"
                : state === "speaking"
                  ? "EvoliX spricht"
                  : conversationActive
                    ? "Gespräch läuft"
                  : "EvoliX ist bereit"}
          </span>
          {conversationActive && (
            <button onClick={stopConversation} aria-label="Gespräch beenden">
              <X />
            </button>
          )}
        </div>

        {!compact && (
          <div className="message-stream">
            <AnimatePresence initial={false}>
              {messages.slice(-5).map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                  className={`message ${message.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message.content}
                  {message.role === "assistant" && (
                    <button
                      onClick={() => void speak(message.content)}
                      aria-label="Antwort vorlesen"
                    >
                      <Volume2 />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
        )}

        <form className="chat-composer" onSubmit={submit}>
          <button
            type="button"
            className={`mic-button ${state}`}
            onClick={toggleConversation}
            aria-pressed={conversationActive}
            aria-label={
              conversationActive
                ? "Gespräch beenden"
                : "Dauergespräch mit EvoliX starten"
            }
          >
            {conversationActive ? <Square /> : <Mic />}
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              state === "listening"
                ? "Ich höre dir zu …"
                : conversationActive
                  ? "Gespräch läuft – ich höre gleich wieder zu …"
                : "Frag EvoliX oder sprich mit ihm …"
            }
            disabled={state === "thinking"}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || state === "thinking"}
            aria-label="Nachricht senden"
          >
            <Send />
          </button>
        </form>
        {error && <p className="voice-error">{error}</p>}
      </div>
    </div>
  );
}
