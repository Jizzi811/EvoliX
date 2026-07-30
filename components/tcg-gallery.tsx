"use client";

/* eslint-disable @next/next/no-img-element -- TCGdex liefert dynamische Karten- und Setbilder. */

import { type FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Coins,
  Heart,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { useTrainer } from "@/lib/trainer-progress";

type TcgCard = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

type TcgCardDetail = TcgCard & {
  category?: string;
  hp?: number;
  types?: string[];
  rarity?: string;
  illustrator?: string;
  description?: string;
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: { official?: number; total?: number };
  };
  variants?: {
    firstEdition?: boolean;
    holo?: boolean;
    normal?: boolean;
    reverse?: boolean;
    wPromo?: boolean;
  };
  attacks?: {
    cost?: string[];
    name: string;
    effect?: string;
    damage?: number | string;
  }[];
  pricing?: {
    cardmarket?: {
      updated?: string;
      unit?: string;
      low?: number;
      trend?: number;
      avg?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
    };
  };
};

type ApiResponse<T> = {
  data: T;
  notice?: string;
};

const quickSearches = ["Pikachu", "Evoli", "Glurak", "Mew"];
const cardCache = new Map<string, Promise<TcgCard[]>>();
const detailCache = new Map<string, Promise<TcgCardDetail>>();

async function getCards(term: string) {
  const key = term.toLocaleLowerCase("de");
  if (!cardCache.has(key)) {
    const request = fetch(`/api/cards?q=${encodeURIComponent(term)}`)
      .then(async (response) => {
        const payload = (await response.json()) as ApiResponse<TcgCard[]>;
        if (!response.ok) throw new Error(payload.notice ?? "request_failed");
        return payload.data;
      })
      .catch((error: unknown) => {
        cardCache.delete(key);
        throw error;
      });
    cardCache.set(key, request);
  }
  return cardCache.get(key) as Promise<TcgCard[]>;
}

async function getCardDetail(id: string) {
  if (!detailCache.has(id)) {
    const request = fetch(`/api/cards?id=${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = (await response.json()) as ApiResponse<TcgCardDetail>;
        if (!response.ok) throw new Error(payload.notice ?? "request_failed");
        return payload.data;
      })
      .catch((error: unknown) => {
        detailCache.delete(id);
        throw error;
      });
    detailCache.set(id, request);
  }
  return detailCache.get(id) as Promise<TcgCardDetail>;
}

function formatPrice(value: number | undefined, unit = "EUR") {
  if (typeof value !== "number") return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: unit,
    maximumFractionDigits: 2,
  }).format(value);
}

function CardTile({
  card,
  saved,
  onOpen,
  onToggle,
}: {
  card: TcgCard;
  saved: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <motion.article
      className="tcg-card"
      layout
      initial={{ opacity: 0, y: 24, rotateY: -8 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      whileHover={{ y: -8, rotateY: 3, rotateX: -2 }}
    >
      <div className="tcg-shine" />
      <button className="tcg-card-open" onClick={onOpen}>
        <img src={`${card.image}/high.webp`} alt={card.name} />
        <span>
          <small>#{card.localId}</small>
          <strong>{card.name}</strong>
        </span>
      </button>
      <button
        className={`tcg-save ${saved ? "saved" : ""}`}
        onClick={onToggle}
        aria-label={
          saved
            ? `${card.name} aus der Sammlung entfernen`
            : `${card.name} sammeln`
        }
      >
        <Heart fill={saved ? "currentColor" : "none"} />
      </button>
    </motion.article>
  );
}

export function TcgGallery() {
  const [query, setQuery] = useState("Pikachu");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [status, setStatus] = useState("Das Karten-Labor erwacht …");
  const [tab, setTab] = useState<"discover" | "collection">("discover");
  const [detail, setDetail] = useState<TcgCardDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState("");
  const { favorites, toggleDiscovery, isDiscoverySaved } = useTrainer();
  const savedCards = favorites.filter((entry) => entry.kind === "card");

  useEffect(() => {
    let active = true;
    void getCards("Pikachu")
      .then((result) => {
        if (!active) return;
        setCards(result);
        setStatus(result.length ? "" : "Keine Pikachu-Karte gefunden.");
      })
      .catch(() => {
        if (active) setStatus("Das Kartenarchiv ist gerade nicht erreichbar.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function runSearch(term: string) {
    const normalized = term.trim();
    if (!normalized) return;
    setStatus("Die holografischen Karten werden gerufen …");
    setDetail(null);
    try {
      const result = await getCards(normalized);
      setCards(result);
      setStatus(
        result.length ? "" : `Keine Karte für „${normalized}“ gefunden.`,
      );
    } catch {
      setCards([]);
      setStatus("Das Kartenarchiv ist gerade nicht erreichbar.");
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    void runSearch(query);
  }

  async function openCard(id: string) {
    setDetail(null);
    setDetailStatus("Kartendetails werden entschlüsselt …");
    try {
      const result = await getCardDetail(id.replace(/^card-/, ""));
      setDetail(result);
      setDetailStatus("");
    } catch {
      setDetailStatus("Die Details dieser Karte sind gerade nicht erreichbar.");
    }
  }

  const market = detail?.pricing?.cardmarket;
  const marketUnit = market?.unit ?? "EUR";
  const dayComparedToWeek =
    typeof market?.avg1 === "number" && typeof market.avg7 === "number"
      ? market.avg1 - market.avg7
      : null;

  return (
    <section className="explorer-panel tcg-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">KARTEN-LABOR · TCGDEX</span>
          <h2>Finden. Prüfen. Sammlung aufbauen.</h2>
        </div>
        <Sparkles />
      </div>

      <div className="card-lab-intro">
        <div>
          <Layers3 />
          <span>
            <strong>Deutsches Archiv</strong>
            Karten aus vielen Generationen
          </span>
        </div>
        <div>
          <Coins />
          <span>
            <strong>Preis-Kompass</strong>
            Aktuelle Cardmarket-Richtwerte
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Private Sammlung</strong>
            Bleibt nur in diesem Browser
          </span>
        </div>
      </div>

      <div className="anime-subnav tcg-subnav" aria-label="Kartenbereiche">
        <button
          className={tab === "discover" ? "active" : ""}
          onClick={() => setTab("discover")}
        >
          <Search /> Entdecken
        </button>
        <button
          className={tab === "collection" ? "active" : ""}
          onClick={() => setTab("collection")}
        >
          <Heart /> Meine Sammlung
          <span>{savedCards.length}</span>
        </button>
      </div>

      {tab === "discover" ? (
        <>
          <form className="magic-search" onSubmit={search}>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pokémon auf einer Karte suchen"
              aria-label="Sammelkarte suchen"
            />
            <button type="submit">Karten rufen</button>
          </form>

          <div className="tcg-quick-searches">
            <span>Schnellzugriff</span>
            {quickSearches.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setQuery(name);
                  void runSearch(name);
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <p className="panel-status" role="status" aria-live="polite">
            {status ||
              `${cards.length} Karten gefunden · Tippe eine Karte für Details an.`}
          </p>

          <div className={`card-lab-body ${detail || detailStatus ? "detail-open" : ""}`}>
            {cards.length ? (
              <div className="tcg-grid">
                {cards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    saved={isDiscoverySaved(`card-${card.id}`)}
                    onOpen={() => void openCard(card.id)}
                    onToggle={() =>
                      toggleDiscovery({
                        id: `card-${card.id}`,
                        name: card.name,
                        image: `${card.image}/high.webp`,
                        kind: "card",
                      })
                    }
                  />
                ))}
              </div>
            ) : null}

            <AnimatePresence>
              {detail || detailStatus ? (
                <motion.aside
                  className="tcg-detail"
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 22 }}
                >
                  <button
                    className="tcg-detail-close"
                    onClick={() => {
                      setDetail(null);
                      setDetailStatus("");
                    }}
                    aria-label="Kartendetails schließen"
                  >
                    <X />
                  </button>

                  {detail ? (
                    <>
                      <div className="tcg-detail-art">
                        <div className="tcg-shine" />
                        <img
                          src={`${detail.image}/high.webp`}
                          alt={detail.name}
                        />
                      </div>
                      <div className="tcg-detail-copy">
                        <small>
                          {detail.set?.name ?? "Unbekanntes Set"} · #
                          {detail.localId}
                        </small>
                        <h3>{detail.name}</h3>
                        <div className="tcg-detail-tags">
                          {detail.types?.map((type) => (
                            <span key={type}>{type}</span>
                          ))}
                          {detail.rarity ? <span>{detail.rarity}</span> : null}
                          {detail.variants?.holo ? <span>Holo</span> : null}
                          {detail.variants?.reverse ? (
                            <span>Reverse</span>
                          ) : null}
                        </div>

                        <dl className="tcg-facts">
                          <div>
                            <dt>KP</dt>
                            <dd>{detail.hp ?? "–"}</dd>
                          </div>
                          <div>
                            <dt>Illustration</dt>
                            <dd>{detail.illustrator ?? "–"}</dd>
                          </div>
                          <div>
                            <dt>Setgröße</dt>
                            <dd>
                              {detail.set?.cardCount?.official ??
                                detail.set?.cardCount?.total ??
                                "–"}{" "}
                              Karten
                            </dd>
                          </div>
                        </dl>

                        {detail.attacks?.length ? (
                          <section className="tcg-attacks">
                            <h4>
                              <Swords /> Attacken
                            </h4>
                            {detail.attacks.map((attack, index) => (
                              <div key={`${attack.name}-${index}`}>
                                <span>
                                  <strong>{attack.name}</strong>
                                  <small>{attack.cost?.join(" · ")}</small>
                                </span>
                                <b>{attack.damage ?? "–"}</b>
                                {attack.effect ? <p>{attack.effect}</p> : null}
                              </div>
                            ))}
                          </section>
                        ) : null}

                        <section className="tcg-market">
                          <h4>
                            <Coins /> Preis-Kompass
                          </h4>
                          {market ? (
                            <>
                              <div className="tcg-price-grid">
                                <span>
                                  <small>Ab-Preis</small>
                                  <strong>
                                    {formatPrice(market.low, marketUnit)}
                                  </strong>
                                </span>
                                <span>
                                  <small>Trendpreis</small>
                                  <strong>
                                    {formatPrice(market.trend, marketUnit)}
                                  </strong>
                                </span>
                                <span>
                                  <small>Ø 7 Tage</small>
                                  <strong>
                                    {formatPrice(market.avg7, marketUnit)}
                                  </strong>
                                </span>
                              </div>
                              {dayComparedToWeek !== null ? (
                                <p
                                  className={
                                    dayComparedToWeek <= 0 ? "down" : "up"
                                  }
                                >
                                  Der Tageswert liegt{" "}
                                  {formatPrice(
                                    Math.abs(dayComparedToWeek),
                                    marketUnit,
                                  )}{" "}
                                  {dayComparedToWeek <= 0 ? "unter" : "über"} dem
                                  7-Tage-Mittel.
                                </p>
                              ) : null}
                              <small>
                                Richtwerte, keine Kaufempfehlung. Zustand und
                                Variante können den echten Preis stark verändern.
                              </small>
                            </>
                          ) : (
                            <p>Für diese Karte liegen keine Marktdaten vor.</p>
                          )}
                        </section>
                      </div>
                    </>
                  ) : (
                    <div className="tcg-detail-loading">
                      <BookOpen />
                      <p>{detailStatus}</p>
                    </div>
                  )}
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </>
      ) : savedCards.length ? (
        <div className="tcg-collection">
          <div className="section-heading compact-heading">
            <div>
              <span className="section-kicker">DEIN KARTENORDNER</span>
              <h3>{savedCards.length} holografische Entdeckungen</h3>
            </div>
            <p>
              Die Sammlung bleibt auf diesem Gerät gespeichert und gibt beim
              ersten Merken einer Karte Trainer-XP.
            </p>
          </div>
          <div className="tcg-grid">
            {savedCards.map((card) => (
              <CardTile
                key={card.id}
                card={{
                  id: card.id.replace(/^card-/, ""),
                  localId: card.id.split("-").at(-1) ?? "–",
                  name: card.name,
                  image: card.image.replace(/\/high\.webp$/, ""),
                }}
                saved
                onOpen={() => {
                  setTab("discover");
                  void openCard(card.id);
                }}
                onToggle={() => toggleDiscovery(card)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="tcg-empty">
          <Heart />
          <h3>Dein Kartenordner wartet.</h3>
          <p>
            Entdecke eine Karte und tippe auf das Herz. Sie erscheint dann hier.
          </p>
          <button onClick={() => setTab("discover")}>Karten entdecken</button>
        </div>
      )}
    </section>
  );
}
