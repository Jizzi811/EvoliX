"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "evolix-trainer-v1";

export type PokemonCompanion = {
  id: number;
  name: string;
  image: string;
  types: string[];
};

export type SavedDiscovery = {
  id: string;
  name: string;
  image: string;
  kind: "anime" | "card";
};

export type WatchStatus = "planned" | "watching" | "completed";

export type AnimeWatchItem = {
  id: number;
  name: string;
  image: string;
  episodes: number | null;
  year: number | null;
  status: WatchStatus;
};

type TrainerState = {
  trainerName: string;
  xp: number;
  team: PokemonCompanion[];
  favorites: SavedDiscovery[];
  quizBest: number;
  quizRounds: number;
  animeQuizBest: number;
  watchlist: AnimeWatchItem[];
  arenaWins: number;
  arenaBattles: number;
};

type TrainerContextValue = TrainerState & {
  level: number;
  levelXp: number;
  nextLevelXp: number;
  achievements: { title: string; detail: string; unlocked: boolean }[];
  setTrainerName: (name: string) => void;
  addPokemon: (pokemon: PokemonCompanion) => void;
  removePokemon: (id: number) => void;
  toggleDiscovery: (discovery: SavedDiscovery) => void;
  isDiscoverySaved: (id: string) => boolean;
  completeQuiz: (score: number, total: number) => number;
  completeAnimeQuiz: (score: number, total: number) => number;
  addToWatchlist: (anime: Omit<AnimeWatchItem, "status">) => void;
  setWatchStatus: (id: number, status: WatchStatus) => void;
  removeFromWatchlist: (id: number) => void;
  completeArenaBattle: (won: boolean) => number;
};

const initialState: TrainerState = {
  trainerName: "Trainer",
  xp: 0,
  team: [],
  favorites: [],
  quizBest: 0,
  quizRounds: 0,
  animeQuizBest: 0,
  watchlist: [],
  arenaWins: 0,
  arenaBattles: 0,
};

const TrainerContext = createContext<TrainerContextValue | null>(null);

function readStoredState(): TrainerState {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<TrainerState> | null;
    if (!stored) return initialState;
    return {
      trainerName:
        typeof stored.trainerName === "string"
          ? stored.trainerName.slice(0, 24)
          : initialState.trainerName,
      xp: typeof stored.xp === "number" ? Math.max(0, stored.xp) : 0,
      team: Array.isArray(stored.team) ? stored.team.slice(0, 6) : [],
      favorites: Array.isArray(stored.favorites)
        ? stored.favorites.slice(0, 30)
        : [],
      quizBest:
        typeof stored.quizBest === "number" ? Math.max(0, stored.quizBest) : 0,
      quizRounds:
        typeof stored.quizRounds === "number"
          ? Math.max(0, stored.quizRounds)
          : 0,
      animeQuizBest:
        typeof stored.animeQuizBest === "number"
          ? Math.max(0, stored.animeQuizBest)
          : 0,
      watchlist: Array.isArray(stored.watchlist)
        ? stored.watchlist.slice(0, 40)
        : [],
      arenaWins:
        typeof stored.arenaWins === "number"
          ? Math.max(0, stored.arenaWins)
          : 0,
      arenaBattles:
        typeof stored.arenaBattles === "number"
          ? Math.max(0, stored.arenaBattles)
          : 0,
    };
  } catch {
    return initialState;
  }
}

export function TrainerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrainerState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(readStoredState());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const setTrainerName = useCallback((trainerName: string) => {
    setState((current) => ({
      ...current,
      trainerName: trainerName.slice(0, 24),
    }));
  }, []);

  const addPokemon = useCallback((pokemon: PokemonCompanion) => {
    setState((current) => {
      if (
        current.team.length >= 6 ||
        current.team.some((entry) => entry.id === pokemon.id)
      ) {
        return current;
      }
      return {
        ...current,
        xp: current.xp + 20,
        team: [...current.team, pokemon],
      };
    });
  }, []);

  const removePokemon = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      team: current.team.filter((pokemon) => pokemon.id !== id),
    }));
  }, []);

  const toggleDiscovery = useCallback((discovery: SavedDiscovery) => {
    setState((current) => {
      const exists = current.favorites.some(
        (favorite) => favorite.id === discovery.id,
      );
      return {
        ...current,
        xp: exists ? current.xp : current.xp + 5,
        favorites: exists
          ? current.favorites.filter(
              (favorite) => favorite.id !== discovery.id,
            )
          : [discovery, ...current.favorites].slice(0, 30),
      };
    });
  }, []);

  const isDiscoverySaved = useCallback(
    (id: string) => state.favorites.some((favorite) => favorite.id === id),
    [state.favorites],
  );

  const completeQuiz = useCallback((score: number, total: number) => {
    const earned = score * 12 + (score === total ? 40 : 0);
    setState((current) => ({
      ...current,
      xp: current.xp + earned,
      quizBest: Math.max(current.quizBest, score),
      quizRounds: current.quizRounds + 1,
    }));
    return earned;
  }, []);

  const completeAnimeQuiz = useCallback((score: number, total: number) => {
    const earned = score * 10 + (score === total ? 35 : 0);
    setState((current) => ({
      ...current,
      xp: current.xp + earned,
      animeQuizBest: Math.max(current.animeQuizBest, score),
    }));
    return earned;
  }, []);

  const addToWatchlist = useCallback(
    (anime: Omit<AnimeWatchItem, "status">) => {
      setState((current) => {
        if (current.watchlist.some((entry) => entry.id === anime.id)) {
          return current;
        }
        return {
          ...current,
          xp: current.xp + 8,
          watchlist: [
            { ...anime, status: "planned" as const },
            ...current.watchlist,
          ].slice(0, 40),
        };
      });
    },
    [],
  );

  const setWatchStatus = useCallback(
    (id: number, status: WatchStatus) => {
      setState((current) => ({
        ...current,
        watchlist: current.watchlist.map((entry) =>
          entry.id === id ? { ...entry, status } : entry,
        ),
      }));
    },
    [],
  );

  const removeFromWatchlist = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      watchlist: current.watchlist.filter((entry) => entry.id !== id),
    }));
  }, []);

  const completeArenaBattle = useCallback((won: boolean) => {
    const earned = won ? 30 : 8;
    setState((current) => ({
      ...current,
      xp: current.xp + earned,
      arenaWins: current.arenaWins + (won ? 1 : 0),
      arenaBattles: current.arenaBattles + 1,
    }));
    return earned;
  }, []);

  const level = Math.floor(state.xp / 150) + 1;
  const levelXp = state.xp % 150;
  const achievements = useMemo(
    () => [
      {
        title: "Erste Bindung",
        detail: "Nimm ein Pokémon ins Team auf.",
        unlocked: state.team.length > 0,
      },
      {
        title: "Volles Team",
        detail: "Stelle ein Team aus sechs Pokémon zusammen.",
        unlocked: state.team.length === 6,
      },
      {
        title: "Kristallhirn",
        detail: "Erreiche eine perfekte Quizrunde.",
        unlocked: state.quizBest >= 8,
      },
      {
        title: "Weltenwanderer",
        detail: "Speichere fünf Karten oder Anime.",
        unlocked: state.favorites.length >= 5,
      },
      {
        title: "Holo-Sammler",
        detail: "Sammle fünf Pokémon-Karten im Karten-Labor.",
        unlocked:
          state.favorites.filter((entry) => entry.kind === "card").length >= 5,
      },
      {
        title: "Anime-Kenner",
        detail: "Meistere eine perfekte Anime-Quizrunde.",
        unlocked: state.animeQuizBest >= 6,
      },
      {
        title: "Serienreisender",
        detail: "Schließe drei Anime auf deiner Watchlist ab.",
        unlocked:
          state.watchlist.filter((entry) => entry.status === "completed")
            .length >= 3,
      },
      {
        title: "Arena-Stratege",
        detail: "Gewinne drei Kämpfe in der EvoliX-Arena.",
        unlocked: state.arenaWins >= 3,
      },
    ],
    [
      state.animeQuizBest,
      state.arenaWins,
      state.favorites,
      state.quizBest,
      state.team.length,
      state.watchlist,
    ],
  );

  const value = useMemo<TrainerContextValue>(
    () => ({
      ...state,
      level,
      levelXp,
      nextLevelXp: 150,
      achievements,
      setTrainerName,
      addPokemon,
      removePokemon,
      toggleDiscovery,
      isDiscoverySaved,
      completeQuiz,
      completeAnimeQuiz,
      addToWatchlist,
      setWatchStatus,
      removeFromWatchlist,
      completeArenaBattle,
    }),
    [
      achievements,
      addPokemon,
      addToWatchlist,
      completeAnimeQuiz,
      completeArenaBattle,
      completeQuiz,
      isDiscoverySaved,
      level,
      levelXp,
      removePokemon,
      removeFromWatchlist,
      setWatchStatus,
      setTrainerName,
      state,
      toggleDiscovery,
    ],
  );

  return (
    <TrainerContext.Provider value={value}>
      {children}
    </TrainerContext.Provider>
  );
}

export function useTrainer() {
  const context = useContext(TrainerContext);
  if (!context) {
    throw new Error("useTrainer muss innerhalb des TrainerProvider laufen.");
  }
  return context;
}
