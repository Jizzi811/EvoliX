# EvoliX

EvoliX ist ein wandelbarer, jugendgerechter Fantasy-Voice-Companion für
Pokémon-Wissen, Anime-Entdeckungen, Alltag und eigene Quests.

## Funktionen

- intelligenter Text- und Voice-Chat mit vier spezialisierten Modi
- browserbasierte Spracherkennung und Sprachausgabe
- animierter Fantasy-Orb mit Statusreaktionen
- interaktiver Kristall-Dex über die öffentliche PokéAPI
- deutscher Kristall-Dex mit Basiswerten, Attacken und Entwicklungspfaden
- lokaler Teamplaner für bis zu sechs Pokémon
- Pokémon-Quiz mit XP, Leveln, Rekorden und Erfolgen
- holografische Sammelkarten-Suche über die mehrsprachige TCGdex API
- lokale Trainer-Chronik für Team und gespeicherte Entdeckungen
- jugendfreie Anime-Suche über Jikan (`sfw=true`)
- neu entwickelte holografische Motion-Karten
- responsive Oberfläche für Desktop und Mobilgeräte
- serverseitiger OpenAI-Zugang; kein API-Schlüssel im Browser
- ElevenLabs-Ausgabe mit der EvoliX-Stimme `ofikEh6BdgDIAr2BFBNV`
- automatische Browserstimme als Fallback
- altersgerechte Systemregeln und Datenschutzgrenzen

## Lokal starten

```bash
npm install
npm run dev
```

Für den KI-Chat wird serverseitig `OPENAI_API_KEY` erwartet. Optional kann
`OPENAI_MODEL` gesetzt werden; standardmäßig verwendet EvoliX `gpt-5-mini`.

Für die gewählte Stimme wird `ELEVENLABS_API_KEY` benötigt. Die öffentliche
Voice-ID ist bereits als `ELEVENLABS_VOICE_ID=ofikEh6BdgDIAr2BFBNV`
vorkonfiguriert.

## EvoliX-Orb

Der zentrale Orb wurde als eigenständiges EvoliX-Evolutionsrelikt aus einer
hochgeladenen Stilreferenz entwickelt. Motion- und CSS-Layer reagieren auf die
Zustände Zuhören, Denken und Sprechen; der Energiekern pulsiert synchron zur
Agentenaktivität.

## Quellen und Lizenzgrenzen

EvoliX verwendet keine kopierten Quelltexte oder Assets aus PokéRogue,
Pokémon Auto Chess, RocketMap oder pokemon-cards-css. Deren Konzepte wurden
lediglich auf technische Eignung geprüft. Pokémon-Daten und externe Bilder
werden zur Laufzeit von PokéAPI geladen; Anime-Daten von Jikan.

Trainerfortschritt wird ausschließlich im `localStorage` des jeweiligen Browsers
gespeichert und nicht an EvoliX übertragen.

Pokémon und zugehörige Namen sind Marken ihrer jeweiligen Rechteinhaber. Dieses
Projekt ist ein inoffizielles Fanprojekt und wird von Nintendo, The Pokémon
Company oder Game Freak weder unterstützt noch betrieben.
