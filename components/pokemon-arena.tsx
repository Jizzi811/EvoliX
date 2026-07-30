"use client";

/* eslint-disable @next/next/no-img-element -- PokéAPI liefert dynamische Pokémon-Artworks. */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Crown,
  Dices,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type ArenaUnit = {
  id: number;
  name: string;
  image: string;
  types: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

type LaneResult = {
  player: ArenaUnit;
  enemy: ArenaUnit;
  playerPower: number;
  enemyPower: number;
  winner: "player" | "enemy";
  note: string;
};

type BattleResult = {
  won: boolean;
  playerWins: number;
  enemyWins: number;
  lanes: LaneResult[];
  xp: number;
};

const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const starterUnits: ArenaUnit[] = [
  {
    id: 133,
    name: "Evoli",
    image: artwork(133),
    types: ["normal"],
    hp: 85,
    attack: 22,
    defense: 16,
    speed: 18,
  },
  {
    id: 25,
    name: "Pikachu",
    image: artwork(25),
    types: ["electric"],
    hp: 75,
    attack: 24,
    defense: 13,
    speed: 26,
  },
  {
    id: 1,
    name: "Bisasam",
    image: artwork(1),
    types: ["grass", "poison"],
    hp: 88,
    attack: 18,
    defense: 20,
    speed: 14,
  },
  {
    id: 4,
    name: "Glumanda",
    image: artwork(4),
    types: ["fire"],
    hp: 80,
    attack: 23,
    defense: 14,
    speed: 20,
  },
  {
    id: 7,
    name: "Schiggy",
    image: artwork(7),
    types: ["water"],
    hp: 94,
    attack: 16,
    defense: 24,
    speed: 12,
  },
  {
    id: 447,
    name: "Riolu",
    image: artwork(447),
    types: ["fighting"],
    hp: 82,
    attack: 22,
    defense: 15,
    speed: 19,
  },
];

const enemySquads: ArenaUnit[][] = [
  [
    {
      id: 52,
      name: "Mauzi",
      image: artwork(52),
      types: ["normal"],
      hp: 78,
      attack: 20,
      defense: 14,
      speed: 25,
    },
    {
      id: 74,
      name: "Kleinstein",
      image: artwork(74),
      types: ["rock", "ground"],
      hp: 98,
      attack: 21,
      defense: 28,
      speed: 8,
    },
    {
      id: 92,
      name: "Nebulak",
      image: artwork(92),
      types: ["ghost", "poison"],
      hp: 72,
      attack: 25,
      defense: 12,
      speed: 24,
    },
  ],
  [
    {
      id: 66,
      name: "Machollo",
      image: artwork(66),
      types: ["fighting"],
      hp: 92,
      attack: 25,
      defense: 18,
      speed: 13,
    },
    {
      id: 63,
      name: "Abra",
      image: artwork(63),
      types: ["psychic"],
      hp: 68,
      attack: 27,
      defense: 11,
      speed: 28,
    },
    {
      id: 41,
      name: "Zubat",
      image: artwork(41),
      types: ["poison", "flying"],
      hp: 76,
      attack: 18,
      defense: 14,
      speed: 27,
    },
  ],
  [
    {
      id: 147,
      name: "Dratini",
      image: artwork(147),
      types: ["dragon"],
      hp: 88,
      attack: 24,
      defense: 17,
      speed: 18,
    },
    {
      id: 37,
      name: "Vulpix",
      image: artwork(37),
      types: ["fire"],
      hp: 80,
      attack: 21,
      defense: 16,
      speed: 23,
    },
    {
      id: 54,
      name: "Enton",
      image: artwork(54),
      types: ["water"],
      hp: 94,
      attack: 20,
      defense: 19,
      speed: 15,
    },
  ],
];

const typeLabels: Record<string, string> = {
  bug: "Käfer",
  dark: "Unlicht",
  dragon: "Drache",
  electric: "Elektro",
  fairy: "Fee",
  fighting: "Kampf",
  fire: "Feuer",
  flying: "Flug",
  ghost: "Geist",
  grass: "Pflanze",
  ground: "Boden",
  ice: "Eis",
  normal: "Normal",
  poison: "Gift",
  psychic: "Psycho",
  rock: "Gestein",
  steel: "Stahl",
  water: "Wasser",
};

const advantages: Record<string, string[]> = {
  bug: ["grass", "psychic", "dark"],
  dark: ["psychic", "ghost"],
  dragon: ["dragon"],
  electric: ["water", "flying"],
  fairy: ["fighting", "dragon", "dark"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  fire: ["grass", "ice", "bug", "steel"],
  flying: ["grass", "fighting", "bug"],
  ghost: ["psychic", "ghost"],
  grass: ["water", "ground", "rock"],
  ground: ["electric", "fire", "poison", "rock", "steel"],
  ice: ["grass", "ground", "flying", "dragon"],
  poison: ["grass", "fairy"],
  psychic: ["fighting", "poison"],
  rock: ["fire", "ice", "flying", "bug"],
  steel: ["ice", "rock", "fairy"],
  water: ["fire", "ground", "rock"],
};

function createTrainerUnit(
  pokemon: {
    id: number;
    name: string;
    image: string;
    types: string[];
  },
): ArenaUnit {
  return {
    ...pokemon,
    hp: 80 + (pokemon.id % 23),
    attack: 18 + (pokemon.id % 9),
    defense: 14 + ((pokemon.id * 3) % 11),
    speed: 13 + ((pokemon.id * 5) % 14),
  };
}

function getSynergy(units: ArenaUnit[]) {
  const counts = new Map<string, number>();
  units.forEach((unit) =>
    unit.types.forEach((type) => counts.set(type, (counts.get(type) ?? 0) + 1)),
  );
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([type, count]) => ({ type, count, bonus: count * 6 }));
}

function hasAdvantage(attacker: ArenaUnit, defender: ArenaUnit) {
  return attacker.types.some((type) =>
    (advantages[type] ?? []).some((target) => defender.types.includes(target)),
  );
}

function lanePower(
  unit: ArenaUnit,
  opponent: ArenaUnit,
  synergyBonus: number,
) {
  const typeBonus = hasAdvantage(unit, opponent) ? 18 : 0;
  const typePenalty = hasAdvantage(opponent, unit) ? 10 : 0;
  const focus = (unit.id * 7 + opponent.id * 3) % 9;
  return Math.round(
    unit.attack * 1.7 +
      unit.defense +
      unit.speed * 0.8 +
      unit.hp * 0.18 +
      synergyBonus +
      typeBonus -
      typePenalty +
      focus,
  );
}

function resolveBattle(player: ArenaUnit[], enemy: ArenaUnit[]) {
  const playerSynergies = getSynergy(player);
  const enemySynergies = getSynergy(enemy);
  const playerBonus = playerSynergies.reduce(
    (total, synergy) => total + synergy.bonus,
    0,
  );
  const enemyBonus = enemySynergies.reduce(
    (total, synergy) => total + synergy.bonus,
    0,
  );

  const lanes = player.map((unit, index): LaneResult => {
    const opponent = enemy[index];
    const playerPower = lanePower(unit, opponent, playerBonus);
    const enemyPower = lanePower(opponent, unit, enemyBonus);
    const playerHasEdge = hasAdvantage(unit, opponent);
    const enemyHasEdge = hasAdvantage(opponent, unit);
    return {
      player: unit,
      enemy: opponent,
      playerPower,
      enemyPower,
      winner: playerPower >= enemyPower ? "player" : "enemy",
      note: playerHasEdge
        ? "Typvorteil für dein Team"
        : enemyHasEdge
          ? "Typvorteil beim Gegner"
          : "Werte und Synergien entscheiden",
    };
  });

  const playerWins = lanes.filter((lane) => lane.winner === "player").length;
  return {
    lanes,
    playerWins,
    enemyWins: lanes.length - playerWins,
    won: playerWins >= 2,
  };
}

function UnitToken({
  unit,
  side,
  winner,
}: {
  unit: ArenaUnit;
  side: "player" | "enemy";
  winner?: boolean;
}) {
  return (
    <motion.div
      className={`arena-unit ${side} ${winner ? "winner" : ""}`}
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <span className="arena-unit-aura" />
      <img src={unit.image} alt={unit.name} />
      <strong>{unit.name}</strong>
      <small>
        {unit.types.map((type) => typeLabels[type] ?? type).join(" · ")}
      </small>
    </motion.div>
  );
}

export function PokemonArena() {
  const { team, arenaWins, arenaBattles, completeArenaBattle } = useTrainer();
  const [selectedIds, setSelectedIds] = useState([133, 25, 1]);
  const [enemyRound, setEnemyRound] = useState(0);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const battleTimer = useRef<number | null>(null);

  const roster = useMemo(() => {
    const trainerUnits = team.map(createTrainerUnit);
    const known = new Set(trainerUnits.map((unit) => unit.id));
    return [
      ...trainerUnits,
      ...starterUnits.filter((unit) => !known.has(unit.id)),
    ];
  }, [team]);
  const selected = selectedIds
    .map((id) => roster.find((unit) => unit.id === id))
    .filter((unit): unit is ArenaUnit => Boolean(unit))
    .slice(0, 3);
  const enemies = enemySquads[enemyRound % enemySquads.length];
  const synergies = getSynergy(selected);

  useEffect(
    () => () => {
      if (battleTimer.current) window.clearTimeout(battleTimer.current);
    },
    [],
  );

  function toggleUnit(id: number) {
    if (fighting || result) return;
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }

  function startBattle() {
    if (selected.length !== 3 || fighting) return;
    setFighting(true);
    battleTimer.current = window.setTimeout(() => {
      const outcome = resolveBattle(selected, enemies);
      const xp = completeArenaBattle(outcome.won);
      setResult({ ...outcome, xp });
      setFighting(false);
      battleTimer.current = null;
    }, 1350);
  }

  function nextRound() {
    setEnemyRound((round) => round + 1);
    setResult(null);
  }

  return (
    <section className="explorer-panel arena-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">EVOLIX-ARENA · AUTO-TAKTIK</span>
          <h2>Aufstellen. Kombinieren. Kämpfen lassen.</h2>
        </div>
        <Crown />
      </div>

      <div className="arena-meta">
        <div>
          <Trophy />
          <span>
            <strong>{arenaWins}</strong>
            Siege
          </span>
        </div>
        <div>
          <Swords />
          <span>
            <strong>{arenaBattles}</strong>
            Kämpfe
          </span>
        </div>
        <div>
          <Zap />
          <span>
            <strong>{synergies.length}</strong>
            aktive Synergien
          </span>
        </div>
      </div>

      <div className="arena-layout">
        <div>
          <div className="arena-board">
            <div className="arena-board-glow" />
            <span className="arena-side-label enemy-label">SCHATTENTEAM</span>
            <div className="arena-row enemy-row">
              {enemies.map((unit, index) => (
                <UnitToken
                  key={`${enemyRound}-${unit.id}`}
                  unit={unit}
                  side="enemy"
                  winner={result?.lanes[index]?.winner === "enemy"}
                />
              ))}
            </div>
            <div className="arena-center-line">
              <span>VS</span>
            </div>
            <div className="arena-row player-row">
              {[0, 1, 2].map((lane) =>
                selected[lane] ? (
                  <UnitToken
                    key={selected[lane].id}
                    unit={selected[lane]}
                    side="player"
                    winner={result?.lanes[lane]?.winner === "player"}
                  />
                ) : (
                  <div className="arena-empty-slot" key={lane}>
                    <Sparkles />
                    <span>Einheit wählen</span>
                  </div>
                ),
              )}
            </div>
            <span className="arena-side-label player-label">DEIN TEAM</span>

            <AnimatePresence>
              {fighting ? (
                <motion.div
                  className="arena-battle-flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.35, 1] }}
                  exit={{ opacity: 0 }}
                >
                  <Swords />
                  <strong>Der Kampf läuft!</strong>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="arena-actions">
            {result ? (
              <button className="primary-action" onClick={nextRound}>
                <Dices /> Nächste Runde
              </button>
            ) : (
              <button
                className="primary-action"
                disabled={selected.length !== 3 || fighting}
                onClick={startBattle}
              >
                <Swords />
                {fighting
                  ? "Kampf wird berechnet …"
                  : selected.length !== 3
                    ? `${3 - selected.length} Einheit(en) fehlen`
                    : "Auto-Kampf starten"}
              </button>
            )}
            <p>
              Drei Bahnen, drei Duelle. Typvorteile, Werte und doppelte Typen
              als Synergie entscheiden die Runde.
            </p>
          </div>
        </div>

        <aside className="arena-sidebar">
          <div className="arena-roster-heading">
            <div>
              <span className="section-kicker">DEINE AUSWAHL</span>
              <h3>Wähle drei Einheiten.</h3>
            </div>
            <span>{selected.length}/3</span>
          </div>

          <div className="arena-roster">
            {roster.map((unit) => {
              const active = selectedIds.includes(unit.id);
              return (
                <button
                  key={unit.id}
                  className={active ? "active" : ""}
                  disabled={
                    fighting ||
                    Boolean(result) ||
                    (!active && selected.length >= 3)
                  }
                  onClick={() => toggleUnit(unit.id)}
                >
                  <img src={unit.image} alt="" />
                  <span>
                    <strong>{unit.name}</strong>
                    <small>
                      {unit.types
                        .map((type) => typeLabels[type] ?? type)
                        .join(" · ")}
                    </small>
                  </span>
                  {active ? <Check /> : <span className="arena-plus">+</span>}
                </button>
              );
            })}
          </div>

          <section className="arena-synergies">
            <h4>
              <Sparkles /> Synergien
            </h4>
            {synergies.length ? (
              synergies.map((synergy) => (
                <div key={synergy.type}>
                  <span>{typeLabels[synergy.type] ?? synergy.type}</span>
                  <strong>
                    {synergy.count} Einheiten · +{synergy.bonus} Kraft
                  </strong>
                </div>
              ))
            ) : (
              <p>
                Zwei Pokémon mit demselben Typ aktivieren einen Team-Bonus.
              </p>
            )}
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {result ? (
          <motion.section
            className={`arena-result ${result.won ? "victory" : "defeat"}`}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="arena-result-title">
              {result.won ? <Trophy /> : <Shield />}
              <div>
                <span>{result.won ? "ARENA-SIEG" : "RUNDE VERLOREN"}</span>
                <h3>
                  {result.playerWins}:{result.enemyWins} Bahnen
                </h3>
              </div>
              <strong>+{result.xp} XP</strong>
            </div>
            <div className="arena-lane-results">
              {result.lanes.map((lane, index) => (
                <div key={`${lane.player.id}-${lane.enemy.id}`}>
                  <small>Bahn {index + 1}</small>
                  <span>
                    <strong>{lane.player.name}</strong>
                    <b>{lane.playerPower}</b>
                  </span>
                  <i />
                  <span>
                    <strong>{lane.enemy.name}</strong>
                    <b>{lane.enemyPower}</b>
                  </span>
                  <p>{lane.note}</p>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
