"use client";

/* eslint-disable @next/next/no-img-element -- PokéAPI returns dynamic artwork URLs at runtime. */

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";

type PokemonData = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other?: {
      "official-artwork"?: { front_default?: string };
    };
  };
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
};

export function PokemonExplorer() {
  const [query, setQuery] = useState("eevee");
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [status, setStatus] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    setStatus("Die Runen suchen …");
    setPokemon(null);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(normalized)}`,
      );
      if (!response.ok) throw new Error("not_found");
      setPokemon((await response.json()) as PokemonData);
      setStatus("");
    } catch {
      setStatus("Dieses Pokémon hat sich im hohen Gras versteckt.");
    }
  }

  return (
    <section className="explorer-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">KRISTALL-DEX</span>
          <h2>Entdecke jedes Pokémon</h2>
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

      {status && <p className="panel-status">{status}</p>}

      {pokemon && (
        <motion.article
          className="pokemon-result"
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="pokemon-art">
            {/* PokeAPI artwork is loaded remotely and is not stored in this repo. */}
            <img
              src={
                pokemon.sprites.other?.["official-artwork"]?.front_default ?? ""
              }
              alt={pokemon.name}
            />
          </div>
          <div className="pokemon-copy">
            <small>#{String(pokemon.id).padStart(4, "0")}</small>
            <h3>{pokemon.name.replaceAll("-", " ")}</h3>
            <div className="type-row">
              {pokemon.types.map(({ type }) => (
                <span key={type.name}>{type.name}</span>
              ))}
            </div>
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
                    .map(({ ability }) => ability.name.replaceAll("-", " "))
                    .join(" · ")}
                </dd>
              </div>
            </dl>
          </div>
        </motion.article>
      )}
    </section>
  );
}
