const voiceId =
  process.env.ELEVENLABS_VOICE_ID || "ofikEh6BdgDIAr2BFBNV";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return Response.json(
      { error: "ElevenLabs ist noch nicht verbunden." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim().slice(0, 2_500);
    if (!text) {
      return Response.json(
        { error: "Kein Sprechtext übergeben." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.32,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("[EvoliX speech]", response.status, detail.slice(0, 400));
      return Response.json(
        { error: "Die EvoliX-Stimme ist gerade nicht erreichbar." },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[EvoliX speech]", error);
    return Response.json(
      { error: "Die Sprachausgabe ist gerade unterbrochen." },
      { status: 502 },
    );
  }
}
