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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const speak = useCallback(async (text: string) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setState("thinking");

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
        audioRef.current = null;
        setState("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setState("idle");
      };
      await audio.play();
      return;
    } catch {
      if (!("speechSynthesis" in window)) {
        setState("idle");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = 0.98;
      utterance.pitch = 1.05;
      utterance.onstart = () => setState("speaking");
      utterance.onend = () => setState("idle");
      utterance.onerror = () => setState("idle");
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const send = useCallback(
    async (content: string, useVoice = false) => {
      const clean = content.trim();
      if (!clean || state === "thinking") return;
      setError("");
      const nextMessages = [...messages, { role: "user" as const, content: clean }];
      setMessages(nextMessages);
      setInput("");
      setState("thinking");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, mode }),
        });
        const payload = (await response.json()) as {
          message?: string;
          error?: string;
        };
        if (!response.ok || !payload.message) {
          throw new Error(payload.error || "Keine Antwort");
        }
        const answer = { role: "assistant" as const, content: payload.message };
        setMessages((current) => [...current, answer]);
        if (useVoice) void speak(answer.content);
        else setState("idle");
      } catch (requestError) {
        setState("idle");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Die Verbindung ist unterbrochen.",
        );
      }
    },
    [messages, mode, speak, state],
  );

  function startListening() {
    setError("");
    if (state === "speaking") {
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis?.cancel();
      setState("idle");
      return;
    }
    if (state === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
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
        void send(finalTranscript, true);
      }
    };
    recognition.onerror = (event) => {
      setState("idle");
      if (event.error !== "aborted") {
        setError("Ich konnte dich nicht verstehen. Versuch es bitte noch einmal.");
      }
    };
    recognition.onend = () => {
      setState((current) => (current === "listening" ? "idle" : current));
    };
    recognition.start();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function stopAudio() {
    recognitionRef.current?.abort();
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
                  : "EvoliX ist bereit"}
          </span>
          {state !== "idle" && (
            <button onClick={stopAudio} aria-label="Sprachausgabe stoppen">
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
            onClick={startListening}
            aria-label={state === "listening" ? "Aufnahme stoppen" : "Sprechen"}
          >
            {state === "listening" ? <Square /> : <Mic />}
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              state === "listening"
                ? "Ich höre dir zu …"
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
