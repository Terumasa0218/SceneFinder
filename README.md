# SceneFinder

SceneFinder is a Web MVP for identifying movies, TV dramas, and anime from YouTube Shorts clues, then linking users toward legal streaming options.

The current implementation does not download, store, or redistribute YouTube videos. It analyzes safe signals:

- YouTube public oEmbed metadata
- YouTube Data API metadata, tags, and top comments when `YOUTUBE_API_KEY` is set
- Manual hints copied from comments or subtitles
- Screenshot-based title hints when `OPENAI_API_KEY` is set
- TMDB title search and Japan watch-provider candidates when `TMDB_API_KEY` is set
- A small local fallback catalog for early UI testing

The Web MVP also stores recent analysis results in browser local storage and shows a device-local title ranking. This is a prototype for future anonymized aggregate trend analytics.

For precision work, users can mark the top candidate as correct or incorrect and enter the correct title. That feedback is stored locally for now and can later become the seed data for scoring and evaluation.

## Precision Loop

The next evaluation loop is:

1. Decide whether a Shorts URL is target content: movie, TV drama, or anime.
2. Exclude non-target content: YouTuber videos, variety shows, news, music, sports, TikTok originals, and unrelated clips.
3. If it is target content, identify the exact title.
4. Store user feedback for correct/incorrect predictions and tune scoring from those examples.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill the keys you want to test.

```bash
YOUTUBE_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
TMDB_API_KEY=
```

The app works without keys, but real precision requires the external signals above.

## Scripts

```bash
npm run lint
npm run build
```
