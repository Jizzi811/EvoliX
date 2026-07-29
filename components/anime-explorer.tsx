"use client";

/* eslint-disable @next/next/no-img-element -- Jikan returns dynamic third-party artwork URLs at runtime. */

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Heart, Search, Star } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type Anime = {
  mal_id: number;
  title: string;
  title_english?: string;
  images: { webp: { image_url: string } };
  score?: number;
  year?: number;
  rating?: string;
  synopsis?: string;
};

const blockedRatings = new Set(["Rx - Hentai", "R+ - Mild Nudity"]);

export function AnimeExplorer() {
  const [query, setQuery] = useState("Pokemon");
  const [results, setResults] = useState<Anime[]>([]);
  const [status, setStatus] = useState("");
  const { toggleDiscovery, isDiscoverySaved } = useTrainer();

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus("Die Sternenbibliothek öffnet sich …");
    setResults([]);

    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query.trim())}&sfw=true&limit=6`,
      );
      if (!response.ok) throw new Error("request_failed");
      const payload = (await response.json()) as { data: Anime[] };
      setResults(
        payload.data.filter((anime) => !blockedRatings.has(anime.rating ?? "")),
      );
      setStatus(payload.data.length ? "" : "Keine passende Serie gefunden.");
    } catch {
      setStatus("Die Anime-Bibliothek ist gerade nicht erreichbar.");
    }
  }

  return (
    <section className="explorer-panel anime-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">STERNENARCHIV</span>
          <h2>Finde dein nächstes Abenteuer</h2>
        </div>
        <Star />
      </div>

      <form className="magic-search" onSubmit={search}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Anime suchen"
          aria-label="Anime suchen"
        />
        <button type="submit">Suchen</button>
      </form>

      {status && <p className="panel-status">{status}</p>}

      {!!results.length && (
        <div className="anime-grid">
          {results.map((anime, index) => (
            <motion.article
              key={anime.mal_id}
              className="anime-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <img src={anime.images.webp.image_url} alt="" />
              <div>
                <small>
                  {anime.year ?? "Fantasy"} ·{" "}
                  {anime.score ? `★ ${anime.score}` : "neu"}
                </small>
                <h3>{anime.title_english || anime.title}</h3>
                <p>{anime.synopsis?.slice(0, 150) || "Kein Text verfügbar."}</p>
              </div>
              <button
                className={
                  isDiscoverySaved(`anime-${anime.mal_id}`) ? "saved" : ""
                }
                onClick={() =>
                  toggleDiscovery({
                    id: `anime-${anime.mal_id}`,
                    name: anime.title_english || anime.title,
                    image: anime.images.webp.image_url,
                    kind: "anime",
                  })
                }
                aria-label={`${anime.title_english || anime.title} speichern`}
              >
                <Heart
                  fill={
                    isDiscoverySaved(`anime-${anime.mal_id}`)
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
