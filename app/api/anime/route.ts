import { NextRequest, NextResponse } from "next/server";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const KITSU_BASE = "https://kitsu.io/api/edge";
const allowedGenres = new Map([
  ["abenteuer", "2"],
  ["comedy", "4"],
  ["fantasy", "10"],
  ["sport", "30"],
]);
const kitsuGenres = new Map([
  ["abenteuer", "adventure"],
  ["comedy", "comedy"],
  ["fantasy", "fantasy"],
  ["sport", "sports"],
]);

const fallbackAnime = [
  {
    mal_id: -1,
    title: "Pokémon",
    title_english: "Pokémon",
    title_japanese: "ポケットモンスター",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 7.4,
    year: 1997,
    rating: "PG - Children",
    synopsis:
      "Ash und Pikachu reisen durch eine Welt voller Pokémon, Arenen und neuer Freundschaften.",
    episodes: 276,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Game",
    genres: [{ name: "Adventure" }, { name: "Fantasy" }],
    studios: [{ name: "OLM" }],
    trailer: null,
  },
  {
    mal_id: -2,
    title: "Digimon Adventure",
    title_english: "Digimon Adventure",
    title_japanese: "デジモンアドベンチャー",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 7.8,
    year: 1999,
    rating: "PG - Children",
    synopsis:
      "Eine Gruppe Kinder landet in einer digitalen Welt und wächst gemeinsam mit ihren Digimon-Partnern.",
    episodes: 54,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Original",
    genres: [{ name: "Adventure" }, { name: "Fantasy" }],
    studios: [{ name: "Toei Animation" }],
    trailer: null,
  },
  {
    mal_id: -3,
    title: "Little Witch Academia",
    title_english: "Little Witch Academia",
    title_japanese: "リトルウィッチアカデミア",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 7.8,
    year: 2017,
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Akko beginnt ihre Ausbildung an einer magischen Akademie und gleicht fehlendes Talent mit riesigem Mut aus.",
    episodes: 25,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Original",
    genres: [{ name: "Adventure" }, { name: "Comedy" }, { name: "Fantasy" }],
    studios: [{ name: "Trigger" }],
    trailer: null,
  },
  {
    mal_id: -4,
    title: "Haikyuu!!",
    title_english: "Haikyu!!",
    title_japanese: "ハイキュー!!",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 8.4,
    year: 2014,
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Hinata will trotz seiner Größe ein großartiger Volleyballspieler werden und entdeckt die Kraft eines echten Teams.",
    episodes: 25,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Manga",
    genres: [{ name: "Sports" }],
    studios: [{ name: "Production I.G" }],
    trailer: null,
  },
  {
    mal_id: -5,
    title: "Dr. Stone",
    title_english: "Dr. Stone",
    title_japanese: "Dr.STONE",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 8.3,
    year: 2019,
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Senku baut nach einer weltweiten Versteinerung die Zivilisation mit Wissenschaft Schritt für Schritt neu auf.",
    episodes: 24,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Manga",
    genres: [{ name: "Adventure" }, { name: "Comedy" }, { name: "Sci-Fi" }],
    studios: [{ name: "TMS Entertainment" }],
    trailer: null,
  },
  {
    mal_id: -6,
    title: "Spy x Family",
    title_english: "SPY x FAMILY",
    title_japanese: "SPY×FAMILY",
    images: { webp: { image_url: "", large_image_url: "" } },
    score: 8.5,
    year: 2022,
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Ein Spion, eine Auftragskillerin und ein gedankenlesendes Kind bilden eine ziemlich ungewöhnliche Familie.",
    episodes: 12,
    status: "Finished Airing",
    type: "TV",
    duration: "24 min per ep",
    source: "Manga",
    genres: [{ name: "Action" }, { name: "Comedy" }],
    studios: [{ name: "Wit Studio" }, { name: "CloverWorks" }],
    trailer: null,
  },
];

type JikanAnime = (typeof fallbackAnime)[number] & {
  mal_id: number;
  url?: string;
  rank?: number;
  popularity?: number;
};

function isYouthSuitable(anime: JikanAnime) {
  const rating = anime.rating ?? "";
  return (
    !rating.startsWith("R") &&
    !anime.genres?.some(({ name }) =>
      ["Ecchi", "Erotica", "Hentai"].includes(name),
    )
  );
}

async function fetchJikan(url: string) {
  let lastStatus = 503;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "EvoliX/1.0 (youth-safe anime explorer)",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(9000),
    });
    lastStatus = response.status;
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
  throw new Error(`jikan_${lastStatus}`);
}

type KitsuResource = {
  id: string;
  type: string;
  attributes: {
    canonicalTitle?: string;
    title?: string;
    slug?: string;
    titles?: { en?: string; en_jp?: string; ja_jp?: string };
    synopsis?: string;
    averageRating?: string;
    startDate?: string;
    ageRating?: string | null;
    ageRatingGuide?: string | null;
    episodeCount?: number | null;
    episodeLength?: number | null;
    status?: string;
    subtype?: string;
    posterImage?: { small?: string; medium?: string; large?: string };
  };
  relationships?: {
    categories?: { data?: { id: string }[] };
  };
};

async function fetchKitsu(query?: string, genre?: string) {
  const params = new URLSearchParams({
    "page[limit]": "12",
    include: "categories",
  });
  if (query) params.set("filter[text]", query);
  const category = genre ? kitsuGenres.get(genre) : null;
  if (category) params.set("filter[categories]", category);

  const response = await fetch(`${KITSU_BASE}/anime?${params}`, {
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "User-Agent": "EvoliX/1.0 (youth-safe anime explorer)",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`kitsu_${response.status}`);
  const payload = (await response.json()) as {
    data: KitsuResource[];
    included?: KitsuResource[];
  };
  const categoryNames = new Map(
    (payload.included ?? [])
      .filter((entry) => entry.type === "categories")
      .map((entry) => [
        entry.id,
        entry.attributes.canonicalTitle ??
          entry.attributes.title ??
          entry.attributes.slug ??
          "Anime",
      ]),
  );

  return payload.data
    .filter(({ attributes }) => {
      const rating = attributes.ageRating ?? "";
      return rating !== "R" && rating !== "R18";
    })
    .map(({ id, attributes, relationships }) => ({
      mal_id: -100000 - Number(id),
      title:
        attributes.canonicalTitle ??
        attributes.titles?.en_jp ??
        attributes.titles?.en ??
        "Unbekannter Anime",
      title_english:
        attributes.titles?.en ?? attributes.titles?.en_jp ?? null,
      title_japanese: attributes.titles?.ja_jp ?? null,
      images: {
        webp: {
          image_url:
            attributes.posterImage?.medium ??
            attributes.posterImage?.small ??
            "",
          large_image_url:
            attributes.posterImage?.large ??
            attributes.posterImage?.medium ??
            "",
        },
      },
      score: attributes.averageRating
        ? Math.round(Number(attributes.averageRating)) / 10
        : null,
      year: attributes.startDate
        ? Number(attributes.startDate.slice(0, 4))
        : null,
      rating:
        attributes.ageRatingGuide ??
        attributes.ageRating ??
        "Nicht eingestuft",
      synopsis: attributes.synopsis ?? null,
      episodes: attributes.episodeCount ?? null,
      status: attributes.status ?? null,
      type: attributes.subtype?.toUpperCase() ?? "Anime",
      duration: attributes.episodeLength
        ? `${attributes.episodeLength} min pro Folge`
        : null,
      source: "Kitsu",
      genres: (relationships?.categories?.data ?? [])
        .map(({ id: categoryId }) => categoryNames.get(categoryId))
        .filter((name): name is string => Boolean(name))
        .map((name) => ({ name })),
      studios: [],
      trailer: null,
    }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80);
  const genre = request.nextUrl.searchParams.get("genre")?.toLowerCase();
  const recommendationsFor = Number(
    request.nextUrl.searchParams.get("recommendations"),
  );

  if (Number.isInteger(recommendationsFor) && recommendationsFor > 0) {
    try {
      const response = await fetchJikan(
        `${JIKAN_BASE}/anime/${recommendationsFor}/recommendations`,
      );
      const payload = (await response.json()) as {
        data: { entry: JikanAnime; votes: number }[];
      };
      return NextResponse.json({
        data: payload.data
          .map(({ entry }) => entry)
          .filter(isYouthSuitable)
          .slice(0, 6),
        source: "jikan",
      });
    } catch {
      return NextResponse.json({ data: [], source: "fallback" });
    }
  }

  if (!query && !genre) {
    return NextResponse.json(
      { error: "search_required" },
      { status: 400 },
    );
  }

  const genreId = genre ? allowedGenres.get(genre) : null;
  const params = new URLSearchParams({
    sfw: "true",
    limit: "12",
    order_by: "score",
    sort: "desc",
  });
  if (query) params.set("q", query);
  if (genreId) params.set("genres", genreId);

  try {
    const response = await fetchJikan(`${JIKAN_BASE}/anime?${params}`);
    const payload = (await response.json()) as { data: JikanAnime[] };
    return NextResponse.json({
      data: payload.data.filter(isYouthSuitable),
      source: "jikan",
    });
  } catch {
    try {
      const kitsuData = await fetchKitsu(query, genre);
      if (kitsuData.length) {
        return NextResponse.json({
          data: kitsuData,
          source: "kitsu",
          notice:
            "Jikan macht gerade Pause – die Live-Ergebnisse kommen automatisch aus dem Kitsu-Archiv.",
        });
      }
    } catch {
      // Die kuratierte, bildunabhängige Auswahl bleibt als letzte Sicherung.
    }

    const normalized = `${query ?? ""} ${genre ?? ""}`.toLowerCase();
    const matches = fallbackAnime.filter((anime) => {
      const searchText = [
        anime.title,
        anime.title_english,
        ...anime.genres.map(({ name }) => name),
      ]
        .join(" ")
        .toLowerCase();
      return normalized
        .split(/\s+/)
        .filter(Boolean)
        .some((term) => searchText.includes(term));
    });
    return NextResponse.json({
      data: matches.length ? matches : fallbackAnime,
      source: "fallback",
      notice:
        "Die Live-Bibliothek antwortet gerade nicht. EvoliX zeigt eine sichere Notfallauswahl.",
    });
  }
}
