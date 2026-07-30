"use client";

/* eslint-disable @next/next/no-img-element -- Bilder stammen aus gespeicherten Live-Ergebnissen. */

import { ListChecks, Trash2 } from "lucide-react";
import {
  type WatchStatus,
  useTrainer,
} from "@/lib/trainer-progress";

const statusCopy: Record<WatchStatus, string> = {
  planned: "Möchte ich sehen",
  watching: "Schaue ich gerade",
  completed: "Abgeschlossen",
};

export function AnimeWatchlist() {
  const { watchlist, setWatchStatus, removeFromWatchlist } = useTrainer();

  return (
    <div className="anime-module">
      <div className="anime-module-heading">
        <div>
          <span className="section-kicker">MEINE WATCHLIST</span>
          <h3>Deine persönlichen Serienreisen</h3>
        </div>
        <p>
          Plane neue Anime, markiere laufende Serien und behalte abgeschlossene
          Abenteuer im Blick. Alles bleibt lokal auf diesem Gerät.
        </p>
      </div>
      {watchlist.length ? (
        <div className="watchlist-grid">
          {watchlist.map((anime) => (
            <article key={anime.id}>
              <img src={anime.image} alt="" />
              <div>
                <small>
                  {anime.year ?? "Anime"} · {anime.episodes ?? "?"} Folgen
                </small>
                <h4>{anime.name}</h4>
                <select
                  value={anime.status}
                  onChange={(event) =>
                    setWatchStatus(
                      anime.id,
                      event.target.value as WatchStatus,
                    )
                  }
                  aria-label={`Status von ${anime.name}`}
                >
                  {(Object.keys(statusCopy) as WatchStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {statusCopy[status]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeFromWatchlist(anime.id)}
                aria-label={`${anime.name} von der Watchlist entfernen`}
              >
                <Trash2 />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="anime-empty">
          <ListChecks />
          <h4>Deine Watchlist ist noch leer.</h4>
          <p>
            Öffne unter „Entdecken“ einen Anime und wähle „Auf die Watchlist“.
          </p>
        </div>
      )}
    </div>
  );
}
