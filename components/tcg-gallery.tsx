"use client";

/* eslint-disable @next/next/no-img-element -- TCGdex liefert dynamische Kartenbilder. */

import { type FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Heart, Search, Sparkles } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type TcgCard = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

const cardCache = new Map<string, TcgCard[]>();

export function TcgGallery() {
  const [query, setQuery] = useState("Pikachu");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [status, setStatus] = useState("");
  const { toggleDiscovery, isDiscoverySaved } = useTrainer();

  async function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setStatus("Die holografischen Karten werden gerufen …");
    setCards([]);

    try {
      const cacheKey = term.toLocaleLowerCase("de");
      let result = cardCache.get(cacheKey);
      if (!result) {
        const response = await fetch(
          `https://api.tcgdex.net/v2/de/cards?name=${encodeURIComponent(term)}`,
        );
        if (!response.ok) throw new Error("request_failed");
        result = ((await response.json()) as TcgCard[])
          .filter((card) => card.image)
          .slice(0, 12);
        cardCache.set(cacheKey, result);
      }
      setCards(result);
      setStatus(result.length ? "" : "Keine Karte im Archiv gefunden.");
    } catch {
      setStatus("Das Kartenarchiv ist gerade nicht erreichbar.");
    }
  }

  return (
    <section className="explorer-panel tcg-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">HOLO-ARCHIV · TCGDEX</span>
          <h2>Finde Karten aus vielen Epochen.</h2>
        </div>
        <Sparkles />
      </div>

      <form className="magic-search" onSubmit={search}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pokémon auf einer Karte suchen"
          aria-label="Sammelkarte suchen"
        />
        <button type="submit">Archiv öffnen</button>
      </form>
      {status ? <p className="panel-status">{status}</p> : null}

      {cards.length ? (
        <div className="tcg-grid">
          {cards.map((card, index) => {
            const saved = isDiscoverySaved(`card-${card.id}`);
            return (
              <motion.article
                key={card.id}
                className="tcg-card"
                initial={{ opacity: 0, y: 24, rotateY: -8 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: index * 0.035 }}
                whileHover={{ y: -8, rotateY: 3, rotateX: -2 }}
              >
                <div className="tcg-shine" />
                <img src={`${card.image}/high.webp`} alt={card.name} />
                <div>
                  <span>{card.name}</span>
                  <button
                    className={saved ? "saved" : ""}
                    onClick={() =>
                      toggleDiscovery({
                        id: `card-${card.id}`,
                        name: card.name,
                        image: `${card.image}/high.webp`,
                        kind: "card",
                      })
                    }
                    aria-label={
                      saved
                        ? `${card.name} aus Favoriten entfernen`
                        : `${card.name} speichern`
                    }
                  >
                    <Heart fill={saved ? "currentColor" : "none"} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
