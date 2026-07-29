"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  Compass,
  Gamepad2,
  Images,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { AnimeExplorer } from "@/components/anime-explorer";
import { HoloCard } from "@/components/holo-card";
import { PokemonExplorer } from "@/components/pokemon-explorer";
import { PokemonQuiz } from "@/components/pokemon-quiz";
import { TcgGallery } from "@/components/tcg-gallery";
import { TrainerDashboard } from "@/components/trainer-dashboard";
import { VoiceChat } from "@/components/voice-chat";
import type { EvoliXMode } from "@/lib/evolix-prompt";
import { TrainerProvider, useTrainer } from "@/lib/trainer-progress";

type Section =
  | "hub"
  | "pokemon"
  | "anime"
  | "quest"
  | "quiz"
  | "tcg"
  | "trainer";

const modeCopy: Record<
  EvoliXMode,
  { label: string; detail: string; color: string }
> = {
  companion: {
    label: "Begleiter",
    detail: "Reden, lernen & Ideen entwickeln",
    color: "violet",
  },
  pokemon: {
    label: "Pokémon",
    detail: "Pokédex, Typen & Strategien",
    color: "cyan",
  },
  anime: {
    label: "Anime",
    detail: "Serien, Figuren & Welten",
    color: "rose",
  },
  quest: {
    label: "Quest",
    detail: "Ziele werden zu Abenteuern",
    color: "amber",
  },
};

function EvoliXApp() {
  const [section, setSection] = useState<Section>("hub");
  const [mode, setMode] = useState<EvoliXMode>("companion");
  const [mobileNav, setMobileNav] = useState(false);
  const { level, levelXp, nextLevelXp } = useTrainer();

  function navigate(target: Section, nextMode?: EvoliXMode) {
    setSection(target);
    if (nextMode) setMode(nextMode);
    setMobileNav(false);
    window.setTimeout(
      () =>
        document
          .getElementById("content")
          ?.scrollIntoView({ behavior: "smooth" }),
      40,
    );
  }

  return (
    <main className="site-shell">
      <div className="fantasy-sky" aria-hidden="true">
        <div className="nebula nebula-one" />
        <div className="nebula nebula-two" />
        <div className="star-field stars-a" />
        <div className="star-field stars-b" />
        <div className="mountains mountain-back" />
        <div className="mountains mountain-front" />
      </div>

      <header className="site-header">
        <button className="brand" onClick={() => navigate("hub")}>
          <span className="brand-mark">
            <Sparkles />
          </span>
          <span>
            <strong>EVOLI<span>X</span></strong>
            <small>VOICE COMPANION</small>
          </span>
        </button>

        <nav className={mobileNav ? "open" : ""}>
          <button
            className={section === "hub" ? "active" : ""}
            onClick={() => navigate("hub")}
          >
            Nexus
          </button>
          <button
            className={section === "pokemon" ? "active" : ""}
            onClick={() => navigate("pokemon", "pokemon")}
          >
            Kristall-Dex
          </button>
          <button
            className={section === "anime" ? "active" : ""}
            onClick={() => navigate("anime", "anime")}
          >
            Anime
          </button>
          <button
            className={section === "quest" ? "active" : ""}
            onClick={() => navigate("quest", "quest")}
          >
            Quests
          </button>
          <button
            className={section === "quiz" ? "active" : ""}
            onClick={() => navigate("quiz", "pokemon")}
          >
            Quiz
          </button>
          <button
            className={section === "trainer" ? "active" : ""}
            onClick={() => navigate("trainer")}
          >
            Trainer
          </button>
        </nav>

        <div className="header-actions">
          <button
            className="level-pill"
            onClick={() => navigate("trainer")}
            title={`${levelXp}/${nextLevelXp} XP`}
          >
            <Zap /> LV. {String(level).padStart(2, "0")}
          </button>
          <button
            className="menu-button"
            onClick={() => setMobileNav((open) => !open)}
            aria-label="Navigation öffnen"
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="hero-kicker">
            <span />
            EIN BEGLEITER. UNENDLICHE FORMEN.
          </div>
          <h1>
            DEINE WELT.
            <br />
            <em>DEIN ABENTEUER.</em>
          </h1>
          <p>
            EvoliX hört zu, denkt mit und verwandelt Pokémon-Wissen,
            Anime-Welten, Schulstoff und deine Ideen in ein eigenes Abenteuer.
          </p>

          <div className="mode-picker">
            {(Object.keys(modeCopy) as EvoliXMode[]).map((item) => (
              <button
                key={item}
                className={`${mode === item ? "active" : ""} ${modeCopy[item].color}`}
                onClick={() => setMode(item)}
              >
                <span>{modeCopy[item].label}</span>
                <small>{modeCopy[item].detail}</small>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="hero-agent"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12 }}
        >
          <div className="sigil sigil-left">✦</div>
          <div className="sigil sigil-right">ᛉ</div>
          <VoiceChat mode={mode} />
        </motion.div>

        <button
          className="scroll-cue"
          onClick={() =>
            document
              .getElementById("content")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Welten entdecken <ChevronDown />
        </button>
      </section>

      <section id="content" className="content-section">
        <AnimatePresence mode="wait">
          {section === "hub" && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="section-heading">
                <div>
                  <span className="section-kicker">WÄHLE DEIN PORTAL</span>
                  <h2>Sieben Portale. Ein EvoliX.</h2>
                </div>
                <p>
                  Jede Welt verändert EvoliX&apos; Fokus – seine Persönlichkeit
                  und dein Gespräch bleiben dabei erhalten.
                </p>
              </div>

              <div className="portal-grid">
                <HoloCard
                  eyebrow="WISSEN"
                  title="Kristall-Dex"
                  text="Pokémon finden, Typen verstehen und Entwicklungen entdecken."
                  icon={<Gamepad2 />}
                  accent="cyan"
                  onClick={() => navigate("pokemon", "pokemon")}
                />
                <HoloCard
                  eyebrow="ENTDECKEN"
                  title="Anime-Archiv"
                  text="Jugendfreie Serien, Charaktere und neue Welten finden."
                  icon={<Star />}
                  accent="rose"
                  onClick={() => navigate("anime", "anime")}
                />
                <HoloCard
                  eyebrow="LEVEL UP"
                  title="Quest-Log"
                  text="Hausaufgaben und Ziele in kleine Missionen verwandeln."
                  icon={<Compass />}
                  accent="amber"
                  onClick={() => navigate("quest", "quest")}
                />
                <HoloCard
                  eyebrow="DEIN COMPANION"
                  title="Freies Gespräch"
                  text="Fragen stellen, Geschichten spinnen oder einfach reden."
                  icon={<MessageCircle />}
                  accent="violet"
                  onClick={() => setMode("companion")}
                />
                <HoloCard
                  eyebrow="SAMMELN"
                  title="Holo-Archiv"
                  text="Pokémon-Karten aus verschiedenen Epochen entdecken und merken."
                  icon={<Images />}
                  accent="cyan"
                  onClick={() => navigate("tcg", "pokemon")}
                />
                <HoloCard
                  eyebrow="XP VERDIENEN"
                  title="Kristall-Quiz"
                  text="Pokémon-Wissen testen, XP sammeln und Erfolge freischalten."
                  icon={<Trophy />}
                  accent="amber"
                  onClick={() => navigate("quiz", "pokemon")}
                />
                <HoloCard
                  eyebrow="DEIN FORTSCHRITT"
                  title="Trainer-Chronik"
                  text="Team, Level, Erfolge und gespeicherte Entdeckungen ansehen."
                  icon={<UserRound />}
                  accent="violet"
                  onClick={() => navigate("trainer")}
                />
              </div>

              <div className="feature-strip">
                <div>
                  <Brain />
                  <span>
                    <strong>Intelligent</strong>
                    Denkt im Kontext mit
                  </span>
                </div>
                <div>
                  <ShieldCheck />
                  <span>
                    <strong>Jugendgerecht</strong>
                    Mit klaren Schutzregeln
                  </span>
                </div>
                <div>
                  <BookOpen />
                  <span>
                    <strong>Wandelbar</strong>
                    Vier spezialisierte Modi
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {section === "pokemon" && (
            <motion.div
              key="pokemon"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <PokemonExplorer />
            </motion.div>
          )}

          {section === "anime" && (
            <motion.div
              key="anime"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <AnimeExplorer />
            </motion.div>
          )}

          {section === "quest" && (
            <motion.div
              key="quest"
              className="quest-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="section-heading">
                <div>
                  <span className="section-kicker">QUEST-SCHMIEDE</span>
                  <h2>Mach aus einem Ziel eine Mission.</h2>
                </div>
                <p>
                  Sag EvoliX, was du schaffen willst. Er zerlegt es in faire
                  Etappen – ohne Fake-Motivation und ohne Endgegner am Montagmorgen.
                </p>
              </div>
              <div className="quest-board">
                <div className="quest-decoration">
                  <span>Ⅰ</span>
                  <i />
                  <span>Ⅱ</span>
                  <i />
                  <span>Ⅲ</span>
                </div>
                <VoiceChat mode="quest" compact />
                <div className="quest-examples">
                  <button
                    onClick={() => setMode("quest")}
                  >
                    „Hilf mir, für die Mathearbeit zu lernen.“
                  </button>
                  <button
                    onClick={() => setMode("quest")}
                  >
                    „Ich will meine eigene Pokémon-Welt schreiben.“
                  </button>
                  <button
                    onClick={() => setMode("quest")}
                  >
                    „Mach mir eine Wochen-Challenge.“
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {section === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <PokemonQuiz />
            </motion.div>
          )}

          {section === "tcg" && (
            <motion.div
              key="tcg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <TcgGallery />
            </motion.div>
          )}

          {section === "trainer" && (
            <motion.div
              key="trainer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <TrainerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">
            <Sparkles />
          </span>
          <span>
            <strong>EVOLI<span>X</span></strong>
            <small>BY NADJ.AI</small>
          </span>
        </div>
        <p>
          Inoffizielles Fanprojekt. Nicht verbunden mit Nintendo, The Pokémon
          Company, Game Freak, AniList oder MyAnimeList.
        </p>
        <span>Entwickelt für Neugier, Kreativität & sichere Abenteuer.</span>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <TrainerProvider>
      <EvoliXApp />
    </TrainerProvider>
  );
}
