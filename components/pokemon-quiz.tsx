"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, RotateCcw, Trophy, Zap } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

const questionBank = [
  {
    question: "Welcher Typ ist sehr effektiv gegen Wasser?",
    options: ["Feuer", "Pflanze", "Gestein", "Drache"],
    answer: 1,
    fact: "Pflanzen- und Elektro-Attacken treffen Wasser besonders effektiv.",
  },
  {
    question: "In welches Pokémon kann sich Evoli mit einem Donnerstein entwickeln?",
    options: ["Aquana", "Blitza", "Psiana", "Feelinara"],
    answer: 1,
    fact: "Mit einem Donnerstein wird Evoli zu Blitza.",
  },
  {
    question: "Welche Nummer trägt Pikachu im nationalen Pokédex?",
    options: ["#001", "#025", "#039", "#133"],
    answer: 1,
    fact: "Pikachu ist Pokémon Nummer 25.",
  },
  {
    question: "Welcher Typ ist immun gegen Elektro-Attacken?",
    options: ["Boden", "Flug", "Stahl", "Eis"],
    answer: 0,
    fact: "Boden-Pokémon nehmen durch Elektro-Attacken keinen Schaden.",
  },
  {
    question: "Was ist die letzte Entwicklungsstufe von Glumanda?",
    options: ["Glutexo", "Dragoran", "Glurak", "Magmar"],
    answer: 2,
    fact: "Glumanda entwickelt sich zu Glutexo und anschließend zu Glurak.",
  },
  {
    question: "Welches Pokémon gehört zum Typ Geist?",
    options: ["Relaxo", "Gengar", "Lapras", "Simsala"],
    answer: 1,
    fact: "Gengar besitzt die Typen Geist und Gift.",
  },
  {
    question: "Wie viele Pokémon passen in ein klassisches Trainer-Team?",
    options: ["Vier", "Fünf", "Sechs", "Acht"],
    answer: 2,
    fact: "Ein vollständiges Trainer-Team besteht aus höchstens sechs Pokémon.",
  },
  {
    question: "Welches Item löst viele Entwicklungen aus?",
    options: ["Trank", "Pokéball", "Sonderbonbon", "Entwicklungsstein"],
    answer: 3,
    fact: "Feuer-, Wasser- oder Donnersteine lösen bestimmte Entwicklungen aus.",
  },
  {
    question: "Welcher Typ ist sehr effektiv gegen Drache?",
    options: ["Fee", "Normal", "Käfer", "Gift"],
    answer: 0,
    fact: "Feen-Attacken treffen Drachen sehr effektiv und sind gegen sie immun.",
  },
  {
    question: "Welches dieser Pokémon ist eine Evoli-Entwicklung?",
    options: ["Nachtara", "Zoroark", "Absol", "Lucario"],
    answer: 0,
    fact: "Nachtara ist Evolis Unlicht-Entwicklung.",
  },
];

const ROUND_SIZE = 8;

function buildRound() {
  return [...questionBank]
    .sort(() => Math.random() - 0.5)
    .slice(0, ROUND_SIZE);
}

export function PokemonQuiz() {
  const [round, setRound] = useState(() =>
    questionBank.slice(0, ROUND_SIZE),
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [earned, setEarned] = useState<number | null>(null);
  const { completeQuiz, quizBest } = useTrainer();
  const current = round[index];
  const finished = index >= round.length;
  const progress = useMemo(
    () => (finished ? 100 : (index / round.length) * 100),
    [finished, index, round.length],
  );

  function answer(option: number) {
    if (selected !== null) return;
    setSelected(option);
    if (option === current.answer) setScore((value) => value + 1);
  }

  function next() {
    if (selected === null) return;
    if (index === round.length - 1) {
      const finalScore = score + (selected === current.answer ? 1 : 0);
      setEarned(completeQuiz(finalScore, round.length));
      setIndex(round.length);
    } else {
      setIndex((value) => value + 1);
      setSelected(null);
    }
  }

  function restart() {
    setRound(buildRound());
    setIndex(0);
    setScore(0);
    setSelected(null);
    setEarned(null);
  }

  return (
    <section className="explorer-panel quiz-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">KRISTALL-PRÜFUNG</span>
          <h2>Acht Fragen. Neue Trainer-XP.</h2>
        </div>
        <Brain />
      </div>

      <div className="quiz-shell">
        <div className="quiz-meta">
          <span>
            RUNDE {Math.min(index + 1, round.length)} / {round.length}
          </span>
          <span>
            <Trophy /> Rekord {quizBest}/{ROUND_SIZE}
          </span>
        </div>
        <div className="xp-track" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>

        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={index}
              className="quiz-question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <span>FRAGE {index + 1}</span>
              <h3>{current.question}</h3>
              <div className="answer-grid">
                {current.options.map((option, optionIndex) => {
                  const revealed = selected !== null;
                  const className = revealed
                    ? optionIndex === current.answer
                      ? "correct"
                      : optionIndex === selected
                        ? "wrong"
                        : ""
                    : "";
                  return (
                    <button
                      key={option}
                      className={className}
                      onClick={() => answer(optionIndex)}
                      disabled={revealed}
                    >
                      <small>{String.fromCharCode(65 + optionIndex)}</small>
                      {option}
                    </button>
                  );
                })}
              </div>
              {selected !== null ? (
                <div className="quiz-reveal">
                  <p>{current.fact}</p>
                  <button onClick={next}>
                    {index === round.length - 1
                      ? "Ergebnis enthüllen"
                      : "Nächste Rune"}
                  </button>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              className="quiz-result"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Zap />
              <span>PRÜFUNG BEENDET</span>
              <h3>
                {score}/{round.length} richtig
              </h3>
              <p>
                +{earned ?? 0} XP gespeichert.{" "}
                {score === round.length
                  ? "Perfekt – Kristallhirn freigeschaltet!"
                  : "Jede Runde macht dein Trainerprofil stärker."}
              </p>
              <button className="primary-action" onClick={restart}>
                <RotateCcw /> Neue Prüfung
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
