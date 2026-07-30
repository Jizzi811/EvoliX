"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";

const characters = [
  {
    name: "Pikachu",
    series: "Pokémon",
    role: "Partner",
    power: "Elektrizität",
    symbol: "⚡",
    text: "Ashs treuer Partner: neugierig, mutig und deutlich stärker, als seine Größe vermuten lässt.",
  },
  {
    name: "Ash Ketchum",
    series: "Pokémon",
    role: "Trainer",
    power: "Teamgeist",
    symbol: "◉",
    text: "Ein ausdauernder Trainer, der Niederlagen als nächste Trainingsstufe versteht.",
  },
  {
    name: "Naruto Uzumaki",
    series: "Naruto",
    role: "Shinobi",
    power: "Rasengan",
    symbol: "🌀",
    text: "Vom Außenseiter zum Anführer – angetrieben von Loyalität und einem ziemlich stabilen Dickkopf.",
  },
  {
    name: "Anya Forger",
    series: "SPY x FAMILY",
    role: "Telepathin",
    power: "Gedankenlesen",
    symbol: "✦",
    text: "Kann Gedanken lesen, liebt Erdnüsse und rettet Familienmissionen auf herrlich chaotische Weise.",
  },
  {
    name: "Shoyo Hinata",
    series: "Haikyu!!",
    role: "Volleyballer",
    power: "Sprungkraft",
    symbol: "◆",
    text: "Beweist, dass Körpergröße kein Endgegner ist, wenn Tempo, Technik und Wille stimmen.",
  },
  {
    name: "Senku Ishigami",
    series: "Dr. Stone",
    role: "Wissenschaftler",
    power: "Wissen",
    symbol: "⚗",
    text: "Baut mit Wissenschaft eine ganze Zivilisation neu auf – zehn Milliarden Prozent logisch.",
  },
  {
    name: "Monkey D. Luffy",
    series: "One Piece",
    role: "Kapitän",
    power: "Gum-Gum-Kräfte",
    symbol: "☠",
    text: "Freiheitsliebender Kapitän mit großem Traum, riesigem Appetit und absoluter Loyalität.",
  },
  {
    name: "Frieren",
    series: "Frieren",
    role: "Magierin",
    power: "Magie",
    symbol: "ᛉ",
    text: "Eine Elfenmagierin, die erst nach der großen Reise versteht, wie wertvoll gemeinsame Zeit ist.",
  },
  {
    name: "Sailor Moon",
    series: "Sailor Moon",
    role: "Kriegerin",
    power: "Mondkraft",
    symbol: "☾",
    text: "Beschützt Freunde und Welt mit Mitgefühl, Mut und der Kraft des Mondes.",
  },
  {
    name: "Izuku Midoriya",
    series: "My Hero Academia",
    role: "Held",
    power: "One For All",
    symbol: "✺",
    text: "Analysiert Helden bis ins Detail und wächst vom Beobachter zum echten Beschützer.",
  },
];

export function AnimeCharacters() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("de");
  const filtered = normalized
    ? characters.filter((character) =>
        `${character.name} ${character.series} ${character.role} ${character.power}`
          .toLocaleLowerCase("de")
          .includes(normalized),
      )
    : characters;

  return (
    <div className="anime-module">
      <div className="anime-module-heading">
        <div>
          <span className="section-kicker">FIGUREN-KODEX</span>
          <h3>Helden, Partner und Rivalen</h3>
        </div>
        <p>
          Nicht nur Namen: EvoliX erklärt Rolle, Fähigkeiten und warum eine
          Figur für ihre Geschichte wichtig ist.
        </p>
      </div>
      <label className="character-search">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Figur, Serie oder Fähigkeit suchen"
        />
      </label>
      <div className="character-grid">
        {filtered.map((character, index) => (
          <motion.article
            key={character.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
          >
            <span className="character-symbol">{character.symbol}</span>
            <small>{character.series}</small>
            <h4>{character.name}</h4>
            <div>
              <span>{character.role}</span>
              <span>{character.power}</span>
            </div>
            <p>{character.text}</p>
          </motion.article>
        ))}
      </div>
      {!filtered.length ? (
        <div className="anime-empty">
          <Sparkles />
          <p>Noch kein Eintrag – versuch eine Serie oder Fähigkeit.</p>
        </div>
      ) : null}
    </div>
  );
}
