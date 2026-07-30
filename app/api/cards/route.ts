import { NextRequest, NextResponse } from "next/server";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/de";

type CardBrief = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

type CardDetail = CardBrief & {
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

async function fetchTcgDex(path: string) {
  const response = await fetch(`${TCGDEX_BASE}/${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "EvoliX/1.0 (German card explorer)",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`tcgdex_${response.status}`);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 60);

  try {
    if (id) {
      if (!/^[a-zA-Z0-9._-]{1,60}$/.test(id)) {
        return NextResponse.json({ error: "invalid_card_id" }, { status: 400 });
      }

      const response = await fetchTcgDex(`cards/${encodeURIComponent(id)}`);
      const card = (await response.json()) as CardDetail;
      return NextResponse.json({ data: card, source: "tcgdex" });
    }

    if (!query) {
      return NextResponse.json({ error: "search_required" }, { status: 400 });
    }

    const response = await fetchTcgDex(
      `cards?name=${encodeURIComponent(query)}`,
    );
    const cards = (await response.json()) as CardBrief[];
    return NextResponse.json({
      data: cards.filter((card) => card.image).slice(0, 18),
      source: "tcgdex",
    });
  } catch {
    return NextResponse.json(
      {
        data: id ? null : [],
        source: "unavailable",
        notice:
          "Das Kartenarchiv antwortet gerade nicht. Bitte versuche es gleich noch einmal.",
      },
      { status: 503 },
    );
  }
}
