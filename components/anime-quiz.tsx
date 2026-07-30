"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Brain, RotateCcw, Trophy } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

const questions = [
  {
    question: "Wie heißt Pikachus bekanntester Trainer?",
    options: ["Ash", "Brock", "Gary", "Tracey"],
    answer: 0,
    fact: "Ash Ketchum und Pikachu bilden seit ihrer ersten Reise ein Team.",
  },
  {
    question: "Was möchte Naruto werden?",
    options: ["Piratenkönig", "Hokage", "Pokémon-Meister", "Magier"],
    answer: 1,
    fact: "Narutos großes Ziel ist es, Hokage seines Dorfes zu werden.",
  },
  {
    question: "Welche Sportart steht in Haikyu!! im Mittelpunkt?",
    options: ["Fußball", "Basketball", "Volleyball", "Tennis"],
    answer: 2,
    fact: "Haikyu!! erzählt von Teams, Rivalität und Wachstum im Volleyball.",
  },
  {
    question: "Welche Fähigkeit besitzt Anya Forger?",
    options: ["Zeitreise", "Gedankenlesen", "Unsichtbarkeit", "Fliegen"],
    answer: 1,
    fact: "Anya ist Telepathin und kann die Gedanken anderer hören.",
  },
  {
    question: "Womit baut Senku in Dr. Stone die Welt neu auf?",
    options: ["Magie", "Wissenschaft", "Ninjutsu", "Pokémon"],
    answer: 1,
    fact: "Senku löst Probleme mit Experimenten, Logik und Wissenschaft.",
  },
  {
    question: "Wie heißt die Hauptfigur aus One Piece?",
    options: ["Luffy", "Ichigo", "Tanjiro", "Saitama"],
    answer: 0,
    fact: "Monkey D. Luffy sucht mit seiner Crew nach dem One Piece.",
  },
  {
    question: "Was ist Frieren?",
    options: ["Eine Elfenmagierin", "Eine Ninja", "Eine Trainerin", "Eine Spionin"],
    answer: 0,
    fact: "Frieren ist eine langlebige Elfenmagierin auf einer besonderen Reise.",
  },
  {
    question: "Wofür steht „Opening“ bei einem Anime meist?",
    options: ["Abspann", "Vorspann", "Werbepause", "Untertitel"],
    answer: 1,
    fact: "Das Opening ist der musikalisch gestaltete Vorspann einer Serie.",
  },
];

const round = questions.slice(0, 6);

export function AnimeQuiz() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [earned, setEarned] = useState<number | null>(null);
  const { animeQuizBest, completeAnimeQuiz } = useTrainer();
  const finished = index >= round.length;
  const current = round[index];

  function choose(option: number) {
    if (selected !== null) return;
    setSelected(option);
    if (option === current.answer) setScore((value) => value + 1);
  }

  function next() {
    if (selected === null) return;
    if (index === round.length - 1) {
      const finalScore = score;
      setEarned(completeAnimeQuiz(finalScore, round.length));
      setIndex(round.length);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setEarned(null);
  }

  return (
    <div className="anime-module anime-quiz-module">
      <div className="anime-module-heading">
        <div>
          <span className="section-kicker">ANIME-PRÜFUNG</span>
          <h3>Teste dein Weltenwissen</h3>
        </div>
        <p>
          Sechs Fragen bringen Trainer-XP. Eine perfekte Runde schaltet den
          Erfolg „Anime-Kenner“ frei.
        </p>
      </div>
      <div className="anime-quiz-box">
        <div className="quiz-meta">
          <span>
            <Brain /> {finished ? "FERTIG" : `FRAGE ${index + 1}/6`}
          </span>
          <span>
            <Trophy /> REKORD {animeQuizBest}/6
          </span>
        </div>
        {!finished ? (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h4>{current.question}</h4>
            <div className="anime-answer-grid">
              {current.options.map((option, optionIndex) => (
                <button
                  key={option}
                  className={
                    selected === null
                      ? ""
                      : optionIndex === current.answer
                        ? "correct"
                        : selected === optionIndex
                          ? "wrong"
                          : ""
                  }
                  onClick={() => choose(optionIndex)}
                  disabled={selected !== null}
                >
                  {option}
                </button>
              ))}
            </div>
            {selected !== null ? (
              <div className="anime-quiz-fact">
                <p>{current.fact}</p>
                <button onClick={next}>
                  {index === round.length - 1 ? "Auswerten" : "Weiter"}
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <div className="anime-quiz-result">
            <Trophy />
            <h4>{score}/6 richtig</h4>
            <p>+{earned ?? 0} XP wurden deiner Chronik hinzugefügt.</p>
            <button onClick={restart}>
              <RotateCcw /> Noch eine Runde
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
