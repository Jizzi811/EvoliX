"use client";

/* eslint-disable @next/next/no-img-element -- Cover werden dynamisch über die EvoliX-Anime-API geladen. */

import { type FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  ExternalLink,
  Film,
  Heart,
  Play,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type Anime = {
  mal_id: number;
  url?: string;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images: {
    webp: { image_url?: string; large_image_url?: string };
  };
  trailer?: { youtube_id?: string | null } | null;
  score?: number | null;
  rank?: number | null;
  popularity?: number | null;
  year?: number | null;
  rating?: string | null;
  synopsis?: string | null;
  episodes?: number | null;
  status?: string | null;
  type?: string | null;
  duration?: string | null;
  source?: string | null;
  genres?: { name: string }[];
  themes?: { name: string }[];
  studios?: { name: string }[];
};

type AnimeResponse = {
  data: Anime[];
  source: "jikan" | "fallback";
  notice?: string;
};

const discoveryPortals = [
  { label: "Pokémon-Welten", query: "Pokemon", icon: "✦" },
  { label: "Fantasy", genre: "fantasy", icon: "ᛉ" },
  { label: "Abenteuer", genre: "abenteuer", icon: "⚔" },
  { label: "Comedy", genre: "comedy", icon: "☀" },
  { label: "Sport", genre: "sport", icon: "◆" },
];

function displayTitle(anime: Anime) {
  return anime.title_english || anime.title;
}

function coverFor(anime: Anime) {
  return (
    anime.images.webp.large_image_url ??
    anime.images.webp.image_url ??
    ""
  );
}

export function AnimeExplorer() {
  const [query, setQuery] = useState("Pokemon");
  const [results, setResults] = useState<Anime[]>([]);
  const [selected, setSelected] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { toggleDiscovery, isDiscoverySaved } = useTrainer();

  async function load(endpoint: string) {
    setLoading(true);
    setStatus("Die Sternenbibliothek öffnet ihre Portale …");
    setSelected(null);
    setRecommendations([]);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("request_failed");
      const payload = (await response.json()) as AnimeResponse;
      setResults(payload.data);
      setStatus(
        payload.notice ??
          (payload.data.length ? "" : "Keine passende Serie gefunden."),
      );
    } catch {
      setResults([]);
      setStatus(
        "Die Suche konnte nicht geladen werden. Versuch es gleich noch einmal.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    await load(`/api/anime?q=${encodeURIComponent(term)}`);
  }

  async function openAnime(anime: Anime) {
    setSelected(anime);
    setRecommendations([]);
    if (anime.mal_id < 1) return;
    try {
      const response = await fetch(
        `/api/anime?recommendations=${anime.mal_id}`,
      );
      if (!response.ok) return;
      const payload = (await response.json()) as AnimeResponse;
      setRecommendations(payload.data);
    } catch {
      // Empfehlungen sind optional; der gewählte Anime bleibt vollständig nutzbar.
    }
  }

  function saveAnime(anime: Anime) {
    const image = coverFor(anime);
    if (!image) return;
    toggleDiscovery({
      id: `anime-${anime.mal_id}`,
      name: displayTitle(anime),
      image,
      kind: "anime",
    });
  }

  return (
    <section className="explorer-panel anime-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">
            STERNENARCHIV · JUGENDGEFILTERT
          </span>
          <h2>Serien, Welten und neue Empfehlungen.</h2>
        </div>
        <Star />
      </div>

      <div className="anime-portals" aria-label="Anime-Kategorien">
        {discoveryPortals.map((portal) => (
          <button
            key={portal.label}
            onClick={() => {
              if (portal.query) setQuery(portal.query);
              void load(
                portal.query
                  ? `/api/anime?q=${encodeURIComponent(portal.query)}`
                  : `/api/anime?genre=${portal.genre}`,
              );
            }}
          >
            <span>{portal.icon}</span>
            {portal.label}
          </button>
        ))}
      </div>

      <form className="magic-search" onSubmit={search}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Anime oder Reihe suchen"
          aria-label="Anime suchen"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Suche läuft …" : "Suchen"}
        </button>
      </form>

      {status ? <p className="panel-status">{status}</p> : null}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.article
            key={`detail-${selected.mal_id}`}
            className="anime-detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="anime-detail-cover">
              {coverFor(selected) ? (
                <img src={coverFor(selected)} alt={displayTitle(selected)} />
              ) : (
                <div className="anime-cover-fallback">
                  <Sparkles />
                  <span>EVOLIX ARCHIV</span>
                </div>
              )}
            </div>
            <div className="anime-detail-copy">
              <button
                className="anime-back"
                onClick={() => setSelected(null)}
              >
                ← Zurück zu den Ergebnissen
              </button>
              <span className="anime-detail-kicker">
                {selected.type ?? "Anime"} ·{" "}
                {selected.year ?? "Zeitlos"} ·{" "}
                {selected.score ? `★ ${selected.score}` : "Neu entdeckt"}
              </span>
              <h3>{displayTitle(selected)}</h3>
              {selected.title_japanese ? (
                <small>{selected.title_japanese}</small>
              ) : null}
              <div className="anime-tags">
                {[...(selected.genres ?? []), ...(selected.themes ?? [])]
                  .slice(0, 7)
                  .map(({ name }) => (
                    <span key={name}>{name}</span>
                  ))}
              </div>
              <p>
                {selected.synopsis ??
                  "Für diesen Eintrag liegt aktuell keine Zusammenfassung vor."}
              </p>
              <div className="anime-facts">
                <span>
                  <Film /> {selected.episodes ?? "?"} Episoden
                </span>
                <span>
                  <Clock3 /> {selected.duration ?? "unbekannte Länge"}
                </span>
                <span>
                  <CalendarDays /> {selected.status ?? "Status unbekannt"}
                </span>
                <span>
                  <BookOpen /> Vorlage: {selected.source ?? "unbekannt"}
                </span>
                <span>
                  <Users />{" "}
                  {selected.studios?.map(({ name }) => name).join(", ") ||
                    "Studio unbekannt"}
                </span>
              </div>
              <div className="anime-detail-actions">
                {selected.trailer?.youtube_id ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${selected.trailer.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Play /> Trailer ansehen
                  </a>
                ) : null}
                {selected.url ? (
                  <a href={selected.url} target="_blank" rel="noreferrer">
                    <ExternalLink /> Voller Eintrag
                  </a>
                ) : null}
                {coverFor(selected) ? (
                  <button
                    className={
                      isDiscoverySaved(`anime-${selected.mal_id}`)
                        ? "saved"
                        : ""
                    }
                    onClick={() => saveAnime(selected)}
                  >
                    <Heart
                      fill={
                        isDiscoverySaved(`anime-${selected.mal_id}`)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {isDiscoverySaved(`anime-${selected.mal_id}`)
                      ? "Gespeichert"
                      : "Merken · +5 XP"}
                  </button>
                ) : null}
              </div>
            </div>

            {recommendations.length ? (
              <div className="anime-recommendations">
                <span className="detail-kicker">ÄHNLICHE WELTEN</span>
                <div>
                  {recommendations.map((anime) => (
                    <button
                      key={anime.mal_id}
                      onClick={() => void openAnime(anime)}
                    >
                      {coverFor(anime) ? (
                        <img src={coverFor(anime)} alt="" />
                      ) : null}
                      <span>{displayTitle(anime)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.article>
        ) : results.length ? (
          <motion.div
            key="results"
            className="anime-grid anime-grid-expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {results.map((anime, index) => {
              const saved = isDiscoverySaved(`anime-${anime.mal_id}`);
              return (
                <motion.article
                  key={anime.mal_id}
                  className="anime-card anime-card-expanded"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                >
                  <button
                    className="anime-open"
                    onClick={() => void openAnime(anime)}
                  >
                    {coverFor(anime) ? (
                      <img src={coverFor(anime)} alt="" />
                    ) : (
                      <span className="anime-cover-fallback small">
                        <Sparkles />
                      </span>
                    )}
                    <span className="anime-card-copy">
                      <small>
                        {anime.year ?? "Fantasy"} ·{" "}
                        {anime.score ? `★ ${anime.score}` : "neu"}
                      </small>
                      <strong>{displayTitle(anime)}</strong>
                      <span>
                        {anime.type ?? "Anime"} · {anime.episodes ?? "?"} Folgen
                      </span>
                      <span className="anime-card-genres">
                        {anime.genres
                          ?.slice(0, 3)
                          .map(({ name }) => name)
                          .join(" · ")}
                      </span>
                    </span>
                  </button>
                  {coverFor(anime) ? (
                    <button
                      className={`anime-save ${saved ? "saved" : ""}`}
                      onClick={() => saveAnime(anime)}
                      aria-label={`${displayTitle(anime)} ${
                        saved ? "aus Favoriten entfernen" : "speichern"
                      }`}
                    >
                      <Heart fill={saved ? "currentColor" : "none"} />
                    </button>
                  ) : null}
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            className="anime-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles />
            <h3>Öffne ein Entdeckungsportal.</h3>
            <p>
              Suche gezielt nach einer Serie oder starte mit Pokémon, Fantasy,
              Abenteuer, Comedy oder Sport.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
