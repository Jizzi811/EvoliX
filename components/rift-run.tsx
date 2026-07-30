"use client";

/* eslint-disable @next/next/no-img-element -- PokéAPI liefert dynamische Pokémon-Artworks. */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Castle,
  Cross,
  Crown,
  Gem,
  Heart,
  Map,
  Shield,
  Sparkles,
  Swords,
  TentTree,
  Trophy,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type Screen =
  | "setup"
  | "map"
  | "battle"
  | "reward"
  | "event"
  | "victory"
  | "gameover";
type RoomType = "battle" | "elite" | "treasure" | "rest" | "mystery" | "boss";

type Room = {
  id: string;
  type: RoomType;
  title: string;
  detail: string;
};

type Fighter = {
  id: number;
  name: string;
  image: string;
  types: string[];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  energy: number;
  shield: number;
};

type Enemy = {
  id: number;
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  boss?: boolean;
};

const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const roomRows: Room[][] = [
  [
    {
      id: "r1-battle",
      type: "battle",
      title: "Flüsterhain",
      detail: "Ein wilder Wächter versperrt den Weg.",
    },
    {
      id: "r1-treasure",
      type: "treasure",
      title: "Verlorener Schrein",
      detail: "Ein frühes Relikt – aber keine Kampferfahrung.",
    },
  ],
  [
    {
      id: "r2-rest",
      type: "rest",
      title: "Mondlager",
      detail: "Heile 35 % deiner maximalen Lebenspunkte.",
    },
    {
      id: "r2-mystery",
      type: "mystery",
      title: "Nebelportal",
      detail: "Eine unbekannte Kraft verändert den Lauf.",
    },
  ],
  [
    {
      id: "r3-battle",
      type: "battle",
      title: "Kristallpfad",
      detail: "Ein stärkerer Gegner bewacht den Aufstieg.",
    },
    {
      id: "r3-elite",
      type: "elite",
      title: "Elite-Riss",
      detail: "Hohes Risiko, stärkeres Relikt.",
    },
  ],
  [
    {
      id: "r4-rest",
      type: "rest",
      title: "Sternenquelle",
      detail: "Eine letzte Rast vor dem Wächter.",
    },
    {
      id: "r4-treasure",
      type: "treasure",
      title: "Gewölbe",
      detail: "Noch ein Relikt – dafür keine Heilung.",
    },
  ],
  [
    {
      id: "r5-boss",
      type: "boss",
      title: "Zitadelle des Risses",
      detail: "Der Rift-Wächter wartet.",
    },
  ],
];

const fallbackCompanions = [
  { id: 133, name: "Evoli", image: artwork(133), types: ["normal"] },
  { id: 25, name: "Pikachu", image: artwork(25), types: ["electric"] },
  { id: 447, name: "Riolu", image: artwork(447), types: ["fighting"] },
];

const enemyPool = [
  { id: 19, name: "Rattfratz" },
  { id: 23, name: "Rettan" },
  { id: 46, name: "Paras" },
  { id: 96, name: "Traumato" },
  { id: 198, name: "Kramurx" },
];

const roomIcons: Record<RoomType, typeof Swords> = {
  battle: Swords,
  elite: Crown,
  treasure: Gem,
  rest: TentTree,
  mystery: Sparkles,
  boss: Castle,
};

function createFighter(companion: (typeof fallbackCompanions)[number]): Fighter {
  const maxHp = 118 + (companion.id % 17);
  return {
    ...companion,
    hp: maxHp,
    maxHp,
    attack: 24 + (companion.id % 6),
    defense: 11 + ((companion.id * 3) % 6),
    energy: 0,
    shield: 0,
  };
}

function createEnemy(room: Room, stage: number): Enemy {
  if (room.type === "boss") {
    return {
      id: 6,
      name: "Rift-Glurak",
      image: artwork(6),
      hp: 154,
      maxHp: 154,
      attack: 23,
      defense: 12,
      boss: true,
    };
  }
  const base = enemyPool[(stage * 2 + (room.type === "elite" ? 1 : 0)) % enemyPool.length];
  const elite = room.type === "elite";
  const maxHp = (elite ? 105 : 68) + stage * 12;
  return {
    ...base,
    image: artwork(base.id),
    hp: maxHp,
    maxHp,
    attack: (elite ? 19 : 13) + stage * 2,
    defense: (elite ? 10 : 6) + stage,
  };
}

function boundedDamage(value: number) {
  return Math.max(3, Math.round(value));
}

function HealthBar({
  value,
  max,
  enemy = false,
}: {
  value: number;
  max: number;
  enemy?: boolean;
}) {
  return (
    <div className={`rift-health ${enemy ? "enemy" : ""}`}>
      <span style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
      <small>
        {Math.max(0, value)} / {max}
      </small>
    </div>
  );
}

export function RiftRun() {
  const { team, riftBosses, riftRuns, completeRiftRun } = useTrainer();
  const companions = useMemo(
    () => (team.length ? team.slice(0, 6) : fallbackCompanions),
    [team],
  );
  const [selectedId, setSelectedId] = useState(companions[0]?.id ?? 133);
  const [screen, setScreen] = useState<Screen>("setup");
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [stage, setStage] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const [combatLog, setCombatLog] = useState("Der Riss beobachtet euch …");
  const [turn, setTurn] = useState(0);
  const [eventText, setEventText] = useState("");
  const [runXp, setRunXp] = useState(0);

  const selectedCompanion =
    companions.find((companion) => companion.id === selectedId) ??
    companions[0] ??
    fallbackCompanions[0];

  function startRun() {
    setFighter(createFighter(selectedCompanion));
    setEnemy(null);
    setStage(0);
    setVisited([]);
    setTurn(0);
    setRunXp(0);
    setCombatLog("Wähle deinen ersten Pfad.");
    setScreen("map");
  }

  function advance() {
    setStage((current) => current + 1);
    setScreen("map");
    setEnemy(null);
  }

  function enterRoom(room: Room) {
    if (!fighter) return;
    setVisited((current) => [...current, room.id]);

    if (room.type === "battle" || room.type === "elite" || room.type === "boss") {
      setEnemy(createEnemy(room, stage));
      setTurn(0);
      setCombatLog(
        room.type === "boss"
          ? "Der Rift-Wächter entfesselt seine Flammen."
          : `${room.title}: Der Kampf beginnt.`,
      );
      setScreen("battle");
      return;
    }

    if (room.type === "rest") {
      const healing = Math.round(fighter.maxHp * 0.35);
      setFighter((current) =>
        current
          ? { ...current, hp: Math.min(current.maxHp, current.hp + healing) }
          : current,
      );
      setEventText(`Die Quelle stellt ${healing} Lebenspunkte wieder her.`);
      setScreen("event");
      return;
    }

    if (room.type === "mystery") {
      const blessing = fighter.id % 2 === 0;
      setFighter((current) =>
        current
          ? blessing
            ? { ...current, attack: current.attack + 3 }
            : {
                ...current,
                hp: Math.min(current.maxHp, current.hp + 24),
                energy: Math.min(3, current.energy + 1),
              }
          : current,
      );
      setEventText(
        blessing
          ? "Eine violette Rune schenkt dauerhaft +3 Angriff."
          : "Der Nebel heilt 24 LP und füllt eine Energieladung.",
      );
      setScreen("event");
      return;
    }

    setScreen("reward");
  }

  function finishDefeat() {
    const xp = completeRiftRun(false);
    setRunXp(xp);
    setScreen("gameover");
  }

  function finishVictory() {
    const xp = completeRiftRun(true);
    setRunXp(xp);
    setScreen("victory");
  }

  function enemyStrike(current: Fighter, currentEnemy: Enemy, nextTurn: number) {
    const raw = currentEnemy.attack + (nextTurn % 4) - Math.round(current.defense / 3);
    const incoming = boundedDamage(raw);
    const absorbed = Math.min(current.shield, incoming);
    const damage = incoming - absorbed;
    const nextFighter = {
      ...current,
      hp: Math.max(0, current.hp - damage),
      shield: Math.max(0, current.shield - incoming),
    };
    return { nextFighter, damage, absorbed };
  }

  function act(action: "attack" | "guard" | "special") {
    if (!fighter || !enemy || fighter.hp <= 0 || enemy.hp <= 0) return;
    const nextTurn = turn + 1;
    let nextFighter = { ...fighter };
    const nextEnemy = { ...enemy };
    let message = "";

    if (action === "guard") {
      nextFighter.shield = fighter.defense + 10;
      nextFighter.energy = Math.min(3, fighter.energy + 1);
      message = `${fighter.name} errichtet einen Schild.`;
    } else {
      const special = action === "special";
      if (special && fighter.energy < 2) return;
      const base = special ? fighter.attack * 2.05 : fighter.attack;
      const damage = boundedDamage(
        base + (nextTurn % 5) - enemy.defense * 0.45,
      );
      nextEnemy.hp = Math.max(0, enemy.hp - damage);
      nextFighter.energy = special
        ? fighter.energy - 2
        : Math.min(3, fighter.energy + 1);
      message = special
        ? `Rift-Impuls trifft mit ${damage} Schaden!`
        : `${fighter.name} verursacht ${damage} Schaden.`;
    }

    if (nextEnemy.hp <= 0) {
      setFighter(nextFighter);
      setEnemy(nextEnemy);
      setCombatLog(`${message} Der Gegner ist besiegt.`);
      if (enemy.boss) finishVictory();
      else setScreen("reward");
      return;
    }

    const retaliation = enemyStrike(nextFighter, nextEnemy, nextTurn);
    nextFighter = retaliation.nextFighter;
    message += ` ${enemy.name} kontert für ${retaliation.damage} Schaden.`;
    if (retaliation.absorbed) {
      message += ` Der Schild fängt ${retaliation.absorbed} ab.`;
    }

    setTurn(nextTurn);
    setFighter(nextFighter);
    setEnemy(nextEnemy);
    setCombatLog(message);
    if (nextFighter.hp <= 0) finishDefeat();
  }

  function takeReward(kind: "attack" | "heart" | "defense") {
    setFighter((current) => {
      if (!current) return current;
      if (kind === "attack") return { ...current, attack: current.attack + 4 };
      if (kind === "defense") {
        return { ...current, defense: current.defense + 4 };
      }
      return {
        ...current,
        maxHp: current.maxHp + 16,
        hp: Math.min(current.maxHp + 16, current.hp + 28),
      };
    });
    advance();
  }

  function resetRun() {
    setScreen("setup");
    setFighter(null);
    setEnemy(null);
    setStage(0);
  }

  return (
    <section className="explorer-panel rift-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">RIFT RUN · BROWSER-ROGUELITE</span>
          <h2>Jeder Weg verändert dein Abenteuer.</h2>
        </div>
        <Map />
      </div>

      <div className="rift-meta">
        <div>
          <Crown />
          <span>
            <strong>{riftBosses}</strong>
            Rift-Wächter besiegt
          </span>
        </div>
        <div>
          <Map />
          <span>
            <strong>{riftRuns}</strong>
            abgeschlossene Runs
          </span>
        </div>
        <div>
          <Sparkles />
          <span>
            <strong>{fighter ? stage + 1 : 0}/5</strong>
            aktuelle Tiefe
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "setup" ? (
          <motion.div
            className="rift-setup"
            key="setup"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="rift-setup-copy">
              <span className="section-kicker">WÄHLE DEINEN GEFÄHRTEN</span>
              <h3>Fünf Räume. Ein Leben. Ungewisser Ausgang.</h3>
              <p>
                Wähle deinen Weg, überstehe Kämpfe und sammle Relikte. Wenn dein
                Gefährte fällt, beginnt der nächste Run wieder am Portal.
              </p>
              <div className="rift-rules">
                <span>
                  <Swords /> taktische Kämpfe
                </span>
                <span>
                  <Gem /> zufällige Verbesserungen
                </span>
                <span>
                  <Castle /> ein Rift-Boss
                </span>
              </div>
            </div>
            <div className="rift-companions">
              {companions.map((companion) => (
                <button
                  key={companion.id}
                  className={selectedCompanion.id === companion.id ? "active" : ""}
                  onClick={() => setSelectedId(companion.id)}
                >
                  <img src={companion.image} alt="" />
                  <span>
                    <strong>{companion.name}</strong>
                    <small>{companion.types.join(" · ")}</small>
                  </span>
                </button>
              ))}
              <button className="rift-start" onClick={startRun}>
                Portal betreten <Zap />
              </button>
            </div>
          </motion.div>
        ) : null}

        {screen === "map" && fighter ? (
          <motion.div
            className="rift-map-shell"
            key={`map-${stage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="rift-runner-status">
              <img src={fighter.image} alt={fighter.name} />
              <div>
                <span>
                  <strong>{fighter.name}</strong>
                  <small>
                    Angriff {fighter.attack} · Verteidigung {fighter.defense}
                  </small>
                </span>
                <HealthBar value={fighter.hp} max={fighter.maxHp} />
              </div>
            </div>

            <div className="rift-map">
              <div className="rift-map-line" />
              {roomRows.map((row, rowIndex) => (
                <div
                  className={`rift-map-stage ${
                    rowIndex === stage ? "current" : ""
                  } ${rowIndex < stage ? "passed" : ""}`}
                  key={rowIndex}
                >
                  <small>RISS {rowIndex + 1}</small>
                  {row.map((room) => {
                    const Icon = roomIcons[room.type];
                    const wasVisited = visited.includes(room.id);
                    return (
                      <button
                        key={room.id}
                        disabled={rowIndex !== stage}
                        className={`${room.type} ${wasVisited ? "visited" : ""}`}
                        onClick={() => enterRoom(room)}
                      >
                        <Icon />
                        <span>
                          <strong>{room.title}</strong>
                          <small>{room.detail}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {screen === "battle" && fighter && enemy ? (
          <motion.div
            className="rift-battle"
            key={`battle-${enemy.id}-${stage}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="rift-combatant enemy">
              <span className="rift-combat-label">
                {enemy.boss ? "RIFT-WÄCHTER" : "RISS-GEGNER"}
              </span>
              <motion.img
                key={`${enemy.id}-${enemy.hp}`}
                src={enemy.image}
                alt={enemy.name}
                initial={{ x: 12 }}
                animate={{ x: 0 }}
              />
              <h3>{enemy.name}</h3>
              <HealthBar value={enemy.hp} max={enemy.maxHp} enemy />
            </div>

            <div className="rift-combat-core">
              <span>RUNDE {turn + 1}</span>
              <Swords />
              <p>{combatLog}</p>
            </div>

            <div className="rift-combatant player">
              <span className="rift-combat-label">DEIN GEFÄHRTE</span>
              <motion.img
                key={`${fighter.id}-${fighter.hp}`}
                src={fighter.image}
                alt={fighter.name}
                initial={{ x: -12 }}
                animate={{ x: 0 }}
              />
              <h3>{fighter.name}</h3>
              <HealthBar value={fighter.hp} max={fighter.maxHp} />
              <div className="rift-energy">
                {[0, 1, 2].map((charge) => (
                  <i
                    key={charge}
                    className={fighter.energy > charge ? "charged" : ""}
                  />
                ))}
              </div>
            </div>

            <div className="rift-actions">
              <button onClick={() => act("attack")}>
                <Swords />
                <span>
                  <strong>Angriff</strong>
                  <small>Energie +1</small>
                </span>
              </button>
              <button onClick={() => act("guard")}>
                <Shield />
                <span>
                  <strong>Schutzwall</strong>
                  <small>Schild + Energie</small>
                </span>
              </button>
              <button
                onClick={() => act("special")}
                disabled={fighter.energy < 2}
              >
                <WandSparkles />
                <span>
                  <strong>Rift-Impuls</strong>
                  <small>benötigt 2 Energie</small>
                </span>
              </button>
            </div>
          </motion.div>
        ) : null}

        {screen === "reward" && fighter ? (
          <motion.div
            className="rift-reward"
            key={`reward-${stage}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Gem />
            <span className="section-kicker">RELIKT GEFUNDEN</span>
            <h3>Wähle eine Verbesserung für diesen Run.</h3>
            <div>
              <button onClick={() => takeReward("attack")}>
                <Swords />
                <strong>Klinge des Risses</strong>
                <small>Angriff dauerhaft +4</small>
              </button>
              <button onClick={() => takeReward("heart")}>
                <Heart />
                <strong>Lebenskristall</strong>
                <small>Max-LP +16 und 28 LP heilen</small>
              </button>
              <button onClick={() => takeReward("defense")}>
                <Shield />
                <strong>Sternenschild</strong>
                <small>Verteidigung dauerhaft +4</small>
              </button>
            </div>
          </motion.div>
        ) : null}

        {screen === "event" ? (
          <motion.div
            className="rift-event"
            key={`event-${stage}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Sparkles />
            <span className="section-kicker">DER RISS REAGIERT</span>
            <h3>{eventText}</h3>
            <button className="primary-action" onClick={advance}>
              Weiter zum nächsten Riss
            </button>
          </motion.div>
        ) : null}

        {screen === "victory" || screen === "gameover" ? (
          <motion.div
            className={`rift-ending ${screen}`}
            key={screen}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {screen === "victory" ? <Trophy /> : <Cross />}
            <span className="section-kicker">
              {screen === "victory" ? "RIFT GESCHLOSSEN" : "RUN BEENDET"}
            </span>
            <h3>
              {screen === "victory"
                ? "Der Wächter ist besiegt."
                : "Der Riss war diesmal stärker."}
            </h3>
            <p>
              {screen === "victory"
                ? "Dein Gefährte hat alle fünf Räume überstanden."
                : "Dein Fortschritt bleibt in der Trainer-Chronik vermerkt."}
            </p>
            <strong>+{runXp} XP</strong>
            <button className="primary-action" onClick={resetRun}>
              Neuen Run beginnen
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
