"use client";

/* eslint-disable @next/next/no-img-element -- PokéAPI liefert dynamische Artwork-URLs. */

import { type FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, Search, Sparkles, Swords } from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type NamedResource = { name: string; url: string };

type PokemonData = {
  id: number;
  name: string;
  height: number;
  weight: number;
  species: NamedResource;
  sprites: {
    other?: { "official-artwork"?: { front_default?: string } };
  };
  types: { type: NamedResource }[];
  abilities: { ability: NamedResource }[];
  stats: { base_stat: number; stat: NamedResource }[];
  moves: {
    move: NamedResource;
    version_group_details: {
      level_learned_at: number;
      move_learn_method: NamedResource;
    }[];
  }[];
};

type SpeciesData = {
  names: { language: NamedResource; name: string }[];
  flavor_text_entries: {
    language: NamedResource;
    flavor_text: string;
  }[];
  evolution_chain: { url: string } | null;
};

type EvolutionNode = {
  species: NamedResource;
  evolves_to: EvolutionNode[];
  evolution_details: {
    min_level: number | null;
    item: NamedResource | null;
    trigger: NamedResource;
  }[];
};

type EvolutionData = { chain: EvolutionNode };

type PokemonView = PokemonData & {
  displayName: string;
  description: string;
  evolutions: { name: string; condition: string }[];
};

const requestCache = new Map<string, Promise<unknown>>();

function cachedJson<T>(url: string): Promise<T> {
  if (!requestCache.has(url)) {
    const request = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("request_failed");
        return response.json() as Promise<T>;
      })
      .catch((error: unknown) => {
        requestCache.delete(url);
        throw error;
      });
    requestCache.set(url, request);
  }
  return requestCache.get(url) as Promise<T>;
}

function label(value: string) {
  return value.replaceAll("-", " ");
}

function flattenEvolution(
  node: EvolutionNode,
  result: { name: string; condition: string }[] = [],
) {
  const detail = node.evolution_details[0];
  let condition = "Basisform";
  if (detail?.min_level) condition = `ab Level ${detail.min_level}`;
  else if (detail?.item) condition = `mit ${label(detail.item.name)}`;
  else if (detail?.trigger) condition = label(detail.trigger.name);
  result.push({ name: label(node.species.name), condition });
  node.evolves_to.forEach((child) => flattenEvolution(child, result));
  return result;
}

const statLabels: Record<string, string> = {
  hp: "KP",
  attack: "Angriff",
  defense: "Verteidigung",
  "special-attack": "Sp.-Angriff",
  "special-defense": "Sp.-Vert.",
  speed: "Initiative",
};

export function PokemonExplorer() {
  const [query, setQuery] = useState("eevee");
  const [pokemon, setPokemon] = useState<PokemonView | null>(null);
  const [status, setStatus] = useState("");
  const { addPokemon, team } = useTrainer();

  async function search(event: FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    setStatus("Die Runen durchsuchen den Kristall-Dex …");
    setPokemon(null);

    try {
      const base = await cachedJson<PokemonData>(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(normalized)}`,
      );
      const species = await cachedJson<SpeciesData>(base.species.url);
      const evolution = species.evolution_chain
        ? await cachedJson<EvolutionData>(species.evolution_chain.url)
        : null;
      const germanName =
        species.names.find((entry) => entry.language.name === "de")?.name ??
        label(base.name);
      const description =
        species.flavor_text_entries
          .find((entry) => entry.language.name === "de")
          ?.flavor_text.replaceAll(/\s+/g, " ") ??
        "Für dieses Pokémon ist noch kein deutscher Kristall-Eintrag verfügbar.";

      setPokemon({
        ...base,
        displayName: germanName,
        description,
        evolutions: evolution ? flattenEvolution(evolution.chain) : [],
      });
      setStatus("");
    } catch {
      setStatus("Dieses Pokémon hat sich im hohen Gras versteckt.");
    }
  }

  const inTeam = pokemon
    ? team.some((entry) => entry.id === pokemon.id)
    : false;

  return (
    <section className="explorer-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">KRISTALL-DEX · TEAMPLANER</span>
          <h2>Wissen sammeln. Team formen.</h2>
        </div>
        <Sparkles />
      </div>

      <form className="magic-search" onSubmit={search}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name oder Pokédex-Nummer"
          aria-label="Pokémon suchen"
        />
        <button type="submit">Beschwören</button>
      </form>

      {status ? <p className="panel-status">{status}</p> : null}

      {pokemon ? (
        <motion.article
          className="pokemon-result pokemon-result-expanded"
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="pokemon-art">
            <img
              src={
                pokemon.sprites.other?.["official-artwork"]?.front_default ?? ""
              }
              alt={pokemon.displayName}
            />
          </div>
          <div className="pokemon-copy">
            <small>#{String(pokemon.id).padStart(4, "0")}</small>
            <h3>{pokemon.displayName}</h3>
            <div className="type-row">
              {pokemon.types.map(({ type }) => (
                <span key={type.name}>{label(type.name)}</span>
              ))}
            </div>
            <p className="pokemon-description">{pokemon.description}</p>
            <dl>
              <div>
                <dt>Größe</dt>
                <dd>{(pokemon.height / 10).toLocaleString("de-DE")} m</dd>
              </div>
              <div>
                <dt>Gewicht</dt>
                <dd>{(pokemon.weight / 10).toLocaleString("de-DE")} kg</dd>
              </div>
              <div>
                <dt>Fähigkeiten</dt>
                <dd>
                  {pokemon.abilities
                    .slice(0, 2)
                    .map(({ ability }) => label(ability.name))
                    .join(" · ")}
                </dd>
              </div>
            </dl>
            <button
              className="primary-action"
              disabled={inTeam || team.length >= 6}
              onClick={() =>
                addPokemon({
                  id: pokemon.id,
                  name: pokemon.displayName,
                  image:
                    pokemon.sprites.other?.["official-artwork"]
                      ?.front_default ?? "",
                  types: pokemon.types.map(({ type }) => type.name),
                })
              }
            >
              {inTeam ? <Check /> : <Plus />}
              {inTeam
                ? "Im Team"
                : team.length >= 6
                  ? "Team ist vollständig"
                  : "Ins Team aufnehmen · +20 XP"}
            </button>
          </div>

          <div className="pokemon-details">
            <section>
              <span className="detail-kicker">BASISWERTE</span>
              <div className="stat-grid">
                {pokemon.stats.map(({ stat, base_stat }) => (
                  <div key={stat.name}>
                    <span>{statLabels[stat.name] ?? label(stat.name)}</span>
                    <strong>{base_stat}</strong>
                    <i style={{ width: `${Math.min(100, base_stat / 1.8)}%` }} />
                  </div>
                ))}
              </div>
            </section>
            <section>
              <span className="detail-kicker">ENTWICKLUNGSPFAD</span>
              <div className="evolution-path">
                {pokemon.evolutions.map((evolution, index) => (
                  <div key={`${evolution.name}-${index}`}>
                    <strong>{evolution.name}</strong>
                    <small>{evolution.condition}</small>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <span className="detail-kicker">
                <Swords /> ATTACKEN-AUSWAHL
              </span>
              <div className="move-cloud">
                {pokemon.moves
                  .filter((entry) =>
                    entry.version_group_details.some(
                      (detail) =>
                        detail.move_learn_method.name === "level-up",
                    ),
                  )
                  .slice(-8)
                  .map(({ move }) => (
                    <span key={move.name}>{label(move.name)}</span>
                  ))}
              </div>
            </section>
          </div>
        </motion.article>
      ) : null}
    </section>
  );
}
