"use client";

/* eslint-disable @next/next/no-img-element -- Bilder stammen aus den gewählten API-Ergebnissen. */

import { Award, Heart, Shield, Trash2, UserRound, Zap } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

export function TrainerDashboard() {
  const trainer = useTrainer();

  return (
    <section className="explorer-panel trainer-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">TRAINER-CHRONIK</span>
          <h2>Dein Abenteuer bleibt bei dir.</h2>
        </div>
        <Shield />
      </div>

      <div className="trainer-hero">
        <div className="trainer-avatar">
          <UserRound />
        </div>
        <div>
          <span>LEVEL {String(trainer.level).padStart(2, "0")}</span>
          <h3>{trainer.trainerName || "Trainer"}</h3>
          <p>{trainer.xp} gesammelte XP</p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="trainer-name">Trainername</label>
          <div>
            <input
              id="trainer-name"
              value={trainer.trainerName}
              onChange={(event) => trainer.setTrainerName(event.target.value)}
              maxLength={24}
            />
            <button>Speichern</button>
          </div>
        </form>
      </div>
      <div className="trainer-progress">
        <span>
          <Zap /> {trainer.levelXp} / {trainer.nextLevelXp} XP bis zum nächsten
          Level
        </span>
        <div className="xp-track">
          <i
            style={{
              width: `${(trainer.levelXp / trainer.nextLevelXp) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="trainer-grid">
        <section>
          <div className="subheading">
            <span>DEIN TEAM</span>
            <small>{trainer.team.length}/6</small>
          </div>
          <div className="team-grid">
            {trainer.team.map((pokemon) => (
              <article key={pokemon.id}>
                <img src={pokemon.image} alt={pokemon.name} />
                <strong>{pokemon.name}</strong>
                <small>{pokemon.types.join(" · ")}</small>
                <button
                  onClick={() => trainer.removePokemon(pokemon.id)}
                  aria-label={`${pokemon.name} aus dem Team entfernen`}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
            {Array.from({ length: 6 - trainer.team.length }, (_, index) => (
              <div className="team-slot" key={`empty-${index}`}>
                <span>+</span>
                <small>freier Platz</small>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="subheading">
            <span>ERFOLGE</span>
            <Award />
          </div>
          <div className="achievement-list">
            {trainer.achievements.map((achievement) => (
              <article
                key={achievement.title}
                className={achievement.unlocked ? "unlocked" : ""}
              >
                <Award />
                <div>
                  <strong>{achievement.title}</strong>
                  <small>{achievement.detail}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="favorites-section">
        <div className="subheading">
          <span>GESPEICHERTE ENTDECKUNGEN</span>
          <Heart />
        </div>
        {trainer.favorites.length ? (
          <div className="favorite-row">
            {trainer.favorites.map((favorite) => (
              <article key={favorite.id}>
                <img src={favorite.image} alt="" />
                <div>
                  <small>{favorite.kind === "card" ? "KARTE" : "ANIME"}</small>
                  <strong>{favorite.name}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">
            Noch leer – markiere Karten und Anime mit dem Herz.
          </p>
        )}
      </section>
      <p className="privacy-note">
        Die Chronik wird nur lokal in diesem Browser gespeichert – ohne Konto
        und ohne Upload persönlicher Profildaten.
      </p>
    </section>
  );
}
