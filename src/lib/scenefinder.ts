export type SceneFinderInput = {
  url: string;
  imageDataUrl?: string;
  manualHint?: string;
};

export type SceneFinderSignal = {
  label: string;
  value: string;
  status: "ok" | "missing" | "warning";
};

export type SceneFinderContentLabel =
  | "映画"
  | "ドラマ"
  | "アニメ"
  | "YouTuber動画"
  | "バラエティ"
  | "ニュース"
  | "TikTokオリジナル"
  | "音楽"
  | "スポーツ"
  | "その他";

export type SceneFinderClassification = {
  isTarget: boolean;
  label: SceneFinderContentLabel;
  confidence: number;
  reason: string;
  source: "heuristic" | "openai";
};

export type SceneFinderCandidate = {
  id: string;
  title: string;
  originalTitle?: string;
  type: "映画" | "ドラマ" | "アニメ" | "不明";
  season: string;
  episode: string;
  confidence: number;
  year: string;
  providers: string[];
  reason: string;
  posterUrl?: string;
  tmdbUrl?: string;
  watchUrl?: string;
  source: "tmdb" | "local";
};

export type SceneFinderAnalysis = {
  ok: true;
  videoId: string;
  metadata: {
    title?: string;
    authorName?: string;
    thumbnailUrl?: string;
    description?: string;
    manualHint?: string;
    tags: string[];
    topComments: string[];
  };
  searchQueries: string[];
  classification: SceneFinderClassification;
  apiStatus: {
    youtube: boolean;
    openai: boolean;
    tmdb: boolean;
  };
  signals: SceneFinderSignal[];
  candidates: SceneFinderCandidate[];
  notes: string[];
};

type YouTubeOEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

type YouTubeSnippet = {
  title?: string;
  description?: string;
  tags?: string[];
};

type TMDBSearchResult = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  first_air_date?: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  popularity?: number;
  vote_count?: number;
};

type SceneUnderstanding = {
  titles: string[];
  classification?: SceneFinderClassification;
};

const providerAliases = new Map([
  ["Netflix", "Netflix"],
  ["Amazon Prime Video", "Prime Video"],
  ["Amazon Video", "Prime Video"],
  ["Disney Plus", "Disney+"],
  ["Disney+", "Disney+"],
  ["U-NEXT", "U-NEXT"],
  ["Hulu", "Hulu"],
  ["ABEMA", "ABEMA"],
  ["DMM TV", "DMM TV"],
  ["Lemino", "Lemino"],
]);

const localCatalog = [
  {
    title: "今際の国のアリス",
    type: "ドラマ" as const,
    year: "2020",
    providers: ["Netflix"],
    aliases: ["alice in borderland", "アリス", "今際"],
  },
  {
    title: "呪術廻戦",
    type: "アニメ" as const,
    year: "2020",
    providers: ["Netflix", "Prime Video", "U-NEXT"],
    aliases: ["jujutsu kaisen", "渋谷事変", "呪術"],
  },
  {
    title: "アンメット",
    type: "ドラマ" as const,
    year: "2024",
    providers: ["U-NEXT"],
    aliases: ["unmet"],
  },
  {
    title: "ザ・ファブル",
    type: "映画" as const,
    year: "2019",
    providers: ["U-NEXT", "Prime Video"],
    aliases: ["fable", "ファブル"],
  },
  {
    title: "涙の女王",
    type: "ドラマ" as const,
    year: "2024",
    providers: ["Netflix"],
    aliases: ["queen of tears"],
  },
];

export function extractYouTubeVideoId(input: string) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/").filter(Boolean)[1] ?? "";
    }

    if (url.pathname.startsWith("/watch")) {
      return url.searchParams.get("v") ?? "";
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/").filter(Boolean)[1] ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

export async function analyzeScene(input: SceneFinderInput): Promise<SceneFinderAnalysis> {
  const videoId = extractYouTubeVideoId(input.url);

  if (!videoId) {
    throw new Error("YouTube ShortsまたはYouTube動画のURLを入力してください。");
  }

  const notes: string[] = [];
  const signals: SceneFinderSignal[] = [];

  const [oembed, youtubeSnippet, topComments] = await Promise.all([
    fetchYouTubeOEmbed(input.url),
    fetchYouTubeSnippet(videoId),
    fetchTopComments(videoId),
  ]);

  const metadata = {
    title: youtubeSnippet?.title || oembed?.title,
    authorName: oembed?.author_name,
    thumbnailUrl: oembed?.thumbnail_url,
    description: youtubeSnippet?.description,
    manualHint: input.manualHint,
    tags: youtubeSnippet?.tags ?? [],
    topComments,
  };

  signals.push({
    label: "YouTubeメタデータ",
    value: metadata.title ? metadata.title : "取得できませんでした",
    status: metadata.title ? "ok" : "warning",
  });

  signals.push({
    label: "上位コメント",
    value: topComments.length ? `${topComments.length}件をヒント化` : "YOUTUBE_API_KEY未設定またはコメントなし",
    status: topComments.length ? "ok" : "missing",
  });

  signals.push({
    label: "スクリーンショット",
    value: input.imageDataUrl ? "Vision候補抽出に利用" : "未追加",
    status: input.imageDataUrl ? "ok" : "missing",
  });

  signals.push({
    label: "手入力ヒント",
    value: input.manualHint ? "コメント欄や字幕メモを利用" : "未追加",
    status: input.manualHint ? "ok" : "missing",
  });

  const understanding = await understandSceneWithOpenAI(input, metadata, notes);
  let classification = understanding.classification ?? classifyWithHeuristics(metadata);

  signals.push({
    label: "対象判定",
    value: `${classification.label} / ${classification.confidence}%`,
    status: classification.isTarget ? "ok" : "warning",
  });

  const aiTitles = understanding.titles;
  signals.push({
    label: "AI Vision/推定",
    value: aiTitles.length ? aiTitles.join(" / ") : "OPENAI_API_KEY未設定または候補なし",
    status: aiTitles.length ? "ok" : "missing",
  });

  const searchQueries = buildSearchQueries(metadata, aiTitles);
  const strongWorkHint = findStrongWorkHint(searchQueries);
  if (!classification.isTarget && strongWorkHint) {
    classification = {
      isTarget: true,
      label: strongWorkHint.type,
      confidence: Math.max(classification.confidence, 76),
      reason: `対象外らしい語もありますが、作品名ヒント「${strongWorkHint.title}」が強く一致しました。`,
      source: classification.source,
    };
  }

  const shouldSearchWorks = classification.isTarget || Boolean(strongWorkHint);
  const tmdbCandidates = shouldSearchWorks ? await searchTMDBCandidates(searchQueries, metadata, notes) : [];
  const localCandidates = shouldSearchWorks ? searchLocalCatalog(searchQueries, metadata) : [];

  const merged = dedupeCandidates([...tmdbCandidates, ...localCandidates])
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  if (!process.env.TMDB_API_KEY) {
    notes.push("TMDB_API_KEYを設定すると、作品DB検索と日本の配信候補を実データにできます。");
  }

  if (!process.env.YOUTUBE_API_KEY) {
    notes.push("YOUTUBE_API_KEYを設定すると、概要欄・タグ・上位コメントも解析できます。");
  }

  if (!process.env.OPENAI_API_KEY) {
    notes.push("OPENAI_API_KEYを設定しスクショを追加すると、画面特徴から候補を増やせます。");
  }

  return {
    ok: true,
    videoId,
    metadata,
    searchQueries,
    classification,
    apiStatus: {
      youtube: Boolean(process.env.YOUTUBE_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      tmdb: Boolean(process.env.TMDB_API_KEY),
    },
    signals,
    candidates: merged,
    notes,
  };
}

async function fetchYouTubeOEmbed(url: string): Promise<YouTubeOEmbed | null> {
  const response = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    { next: { revalidate: 3600 } },
  );

  if (!response.ok) return null;
  return response.json();
}

async function fetchYouTubeSnippet(videoId: string): Promise<YouTubeSnippet | null> {
  if (!process.env.YOUTUBE_API_KEY) return null;

  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  apiUrl.searchParams.set("part", "snippet");
  apiUrl.searchParams.set("id", videoId);
  apiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(apiUrl);
  if (!response.ok) return null;

  const data = await response.json();
  return data.items?.[0]?.snippet ?? null;
}

async function fetchTopComments(videoId: string): Promise<string[]> {
  if (!process.env.YOUTUBE_API_KEY) return [];

  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  apiUrl.searchParams.set("part", "snippet");
  apiUrl.searchParams.set("videoId", videoId);
  apiUrl.searchParams.set("maxResults", "12");
  apiUrl.searchParams.set("order", "relevance");
  apiUrl.searchParams.set("textFormat", "plainText");
  apiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(apiUrl);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.items ?? [])
    .map((item: { snippet?: { topLevelComment?: { snippet?: { textDisplay?: string } } } }) =>
      item.snippet?.topLevelComment?.snippet?.textDisplay?.trim(),
    )
    .filter(Boolean)
    .slice(0, 8);
}

async function understandSceneWithOpenAI(
  input: SceneFinderInput,
  metadata: SceneFinderAnalysis["metadata"],
  notes: string[],
): Promise<SceneUnderstanding> {
  if (!process.env.OPENAI_API_KEY) return { titles: [] };

  const prompt = [
    "You classify YouTube Shorts and identify Japanese/international movies, TV dramas, and anime from clues.",
    "Return only JSON in this exact shape:",
    "{\"classification\":{\"isTarget\":true,\"label\":\"映画|ドラマ|アニメ|YouTuber動画|バラエティ|ニュース|TikTokオリジナル|音楽|スポーツ|その他\",\"confidence\":0,\"reason\":\"short reason\"},\"titles\":[\"title 1\",\"title 2\"]}",
    "Target content is only movie, TV drama, or anime. Exclude news, variety shows, YouTuber videos, music videos, sports, TikTok originals, and unrelated clips.",
    "Use Japanese official titles when likely. Do not include YouTuber names, generic hashtags, or channel names as titles.",
    `YouTube title: ${metadata.title ?? ""}`,
    `Description: ${(metadata.description ?? "").slice(0, 1200)}`,
    `User supplied hint: ${(metadata.manualHint ?? "").slice(0, 800)}`,
    `Tags: ${metadata.tags.join(", ")}`,
    `Top comments: ${metadata.topComments.join(" / ")}`,
  ].join("\n");

  const content: unknown[] = [{ type: "input_text", text: prompt }];

  if (input.imageDataUrl) {
    content.push({ type: "input_image", image_url: input.imageDataUrl });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        input: [{ role: "user", content }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      notes.push("OpenAI解析に失敗しました。APIキー、モデル名、画像形式を確認してください。");
      return { titles: [] };
    }

    const data = await response.json();
    const outputText =
      data.output_text ??
      data.output
        ?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? [])
        .map((item: { text?: string }) => item.text)
        .filter(Boolean)
        .join("\n");

    const parsed = JSON.parse(extractJson(outputText ?? "{}"));
    const titles = Array.isArray(parsed.titles)
      ? parsed.titles.map((title: unknown) => String(title).trim()).filter(Boolean).slice(0, 5)
      : [];
    const classification = parseClassification(parsed.classification);

    return { titles, classification };
  } catch {
    notes.push("OpenAI解析のレスポンスを候補化できませんでした。");
    return { titles: [] };
  }
}

function buildSearchQueries(metadata: SceneFinderAnalysis["metadata"], aiTitles: string[]) {
  const rawSignals = [
    ...aiTitles,
    metadata.title,
    metadata.description,
    metadata.manualHint,
    ...metadata.tags,
    ...metadata.topComments,
  ].filter(Boolean) as string[];

  const exactTitles = rawSignals.flatMap((value) => extractLikelyTitles(value));
  const cleaned = rawSignals.flatMap((value) => splitIntoQueries(value));

  return uniqueStrings([...exactTitles, ...cleaned])
    .map((value) => value.trim())
    .filter((value) => value.length >= 2 && value.length <= 48)
    .slice(0, 12);
}

function classifyWithHeuristics(metadata: SceneFinderAnalysis["metadata"]): SceneFinderClassification {
  const text = normalizeForClassification(
    [metadata.title, metadata.description, metadata.manualHint, ...metadata.tags, ...metadata.topComments].join(" "),
  );

  const excludedRules: Array<[SceneFinderContentLabel, RegExp, string]> = [
    ["ニュース", /(ニュース|速報|記者会見|政治|事件|事故|news|breaking)/i, "ニュース系の語が強く出ています。"],
    ["バラエティ", /(バラエティ|ドッキリ|水曜日のダウンタウン|アメトーーク|しゃべくり|有吉|芸人|漫才|コント)/i, "バラエティ/お笑い番組の語が見つかりました。"],
    ["YouTuber動画", /(youtuber|ユーチューバー|vlog|検証してみた|やってみた|購入品|ルーティン|チャンネル登録|切り抜きチャンネル)/i, "YouTuber動画らしい語が見つかりました。"],
    ["TikTokオリジナル", /(tiktok|ティックトック|踊ってみた|dance challenge|チャレンジ動画)/i, "TikTokオリジナル/チャレンジ動画らしい語が見つかりました。"],
    ["音楽", /(official video|music video|mv|歌ってみた|踊ってみた|ライブ映像|lyrics|remaster|cover song)/i, "音楽動画らしい語が見つかりました。"],
    ["スポーツ", /(サッカー|野球|nba|mlb|jリーグ|ゴール集|ハイライト|試合|スポーツ)/i, "スポーツ映像らしい語が見つかりました。"],
  ];

  for (const [label, pattern, reason] of excludedRules) {
    if (pattern.test(text)) {
      return {
        isTarget: false,
        label,
        confidence: 82,
        reason,
        source: "heuristic",
      };
    }
  }

  const targetRules: Array<[SceneFinderContentLabel, RegExp, string]> = [
    ["アニメ", /(アニメ|anime|声優|第\d+話|話数|season|シーズン|呪術|ワンピース|鬼滅|推しの子|進撃)/i, "アニメ/話数に関する語が見つかりました。"],
    ["ドラマ", /(ドラマ|韓ドラ|海外ドラマ|netflixシリーズ|シーズン|season|第\d+話|episode|unext|hulu)/i, "ドラマ/シリーズ作品らしい語が見つかりました。"],
    ["映画", /(映画|movie|film|劇場版|本編|予告編|cinema|prime video|disney\+)/i, "映画作品らしい語が見つかりました。"],
  ];

  for (const [label, pattern, reason] of targetRules) {
    if (pattern.test(text)) {
      return {
        isTarget: true,
        label,
        confidence: 72,
        reason,
        source: "heuristic",
      };
    }
  }

  return {
    isTarget: false,
    label: "その他",
    confidence: 55,
    reason: "作品系かどうかを判断できる強い語がまだありません。",
    source: "heuristic",
  };
}

function parseClassification(value: unknown): SceneFinderClassification | undefined {
  if (!value || typeof value !== "object") return undefined;

  const item = value as Partial<SceneFinderClassification>;
  const label = parseContentLabel(item.label);
  if (!label) return undefined;

  return {
    isTarget: Boolean(item.isTarget) && ["映画", "ドラマ", "アニメ"].includes(label),
    label,
    confidence: clampConfidence(Number(item.confidence)),
    reason: typeof item.reason === "string" ? item.reason.slice(0, 140) : "AIが分類しました。",
    source: "openai",
  };
}

function parseContentLabel(value: unknown): SceneFinderContentLabel | undefined {
  const labels: SceneFinderContentLabel[] = [
    "映画",
    "ドラマ",
    "アニメ",
    "YouTuber動画",
    "バラエティ",
    "ニュース",
    "TikTokオリジナル",
    "音楽",
    "スポーツ",
    "その他",
  ];

  return labels.find((label) => label === value);
}

function findStrongWorkHint(queries: string[]) {
  for (const item of localCatalog) {
    const matched = queries.some((query) => {
      const normalizedQuery = normalize(query);
      return (
        normalize(item.title).includes(normalizedQuery) ||
        normalizedQuery.includes(normalize(item.title)) ||
        item.aliases.some((alias) => normalizedQuery.includes(normalize(alias)))
      );
    });

    if (matched) {
      return item;
    }
  }

  return undefined;
}

function extractLikelyTitles(value: string) {
  const matches = [
    ...value.matchAll(/[『「【](.{2,32}?)[』」】]/g),
    ...value.matchAll(/#([^\s#]{2,32})/g),
  ];

  return matches.map((match) => cleanQuery(match[1])).filter(Boolean);
}

function splitIntoQueries(value: string) {
  return value
    .split(/[\n\r|｜／/・,:：#【】「」『』()（）\[\]<>]+/)
    .map(cleanQuery)
    .filter(Boolean)
    .slice(0, 8);
}

function cleanQuery(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b(shorts?|youtube|tiktok|reels?)\b/gi, "")
    .replace(/[?？!！]/g, "")
    .replace(/(コメント欄に|コメントで|作品名は|タイトルは|って書かれていた|と書かれていた|って書いてあった|と書いてあった|らしい|かも|です|だと思う)/g, "")
    .replace(
      /(映画|ドラマ|アニメ|切り抜き|名シーン|神シーン|ネタバレ|おすすめ|考察|解説|公式|予告|short|shorts|Netflix|U-NEXT|Prime Video|Disney\+|Hulu|ABEMA|DMM TV)/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function searchTMDBCandidates(
  queries: string[],
  metadata: SceneFinderAnalysis["metadata"],
  notes: string[],
): Promise<SceneFinderCandidate[]> {
  if (!process.env.TMDB_API_KEY) return [];

  const results: SceneFinderCandidate[] = [];

  for (const query of queries.slice(0, 6)) {
    const url = new URL("https://api.themoviedb.org/3/search/multi");
    url.searchParams.set("api_key", process.env.TMDB_API_KEY);
    url.searchParams.set("query", query);
    url.searchParams.set("language", "ja-JP");
    url.searchParams.set("include_adult", "false");

    try {
      const response = await fetch(url, { next: { revalidate: 86400 } });
      if (!response.ok) continue;

      const data = await response.json();
      const mediaResults = (data.results ?? [])
        .filter((item: TMDBSearchResult) => item.media_type === "movie" || item.media_type === "tv")
        .slice(0, 3);

      for (const item of mediaResults) {
        const providers = await fetchTMDBProviders(item.media_type ?? "movie", item.id);
        const title = item.title ?? item.name ?? "タイトル不明";
        const date = item.release_date ?? item.first_air_date ?? "";
        const score = scoreCandidate(title, query, metadata, item);

        results.push({
          id: `tmdb-${item.media_type}-${item.id}`,
          title,
          originalTitle: item.original_title ?? item.original_name,
          type: mediaTypeLabel(item),
          season: item.media_type === "tv" ? "Season未特定" : "-",
          episode: item.media_type === "tv" ? "話数未特定" : "本編",
          confidence: score,
          year: date ? date.slice(0, 4) : "不明",
          providers,
          reason: buildReason(query, metadata, providers, item),
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
          tmdbUrl: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
          watchUrl: buildWatchUrl(title),
          source: "tmdb",
        });
      }
    } catch {
      notes.push(`TMDB検索に失敗しました: ${query}`);
    }
  }

  return results;
}

async function fetchTMDBProviders(mediaType: "movie" | "tv", id: number) {
  if (!process.env.TMDB_API_KEY) return [];

  const url = new URL(`https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY);

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return [];

  const data = await response.json();
  const jp = data.results?.JP;
  const offers = [...(jp?.flatrate ?? []), ...(jp?.rent ?? []), ...(jp?.buy ?? [])];

  return uniqueStrings(
    offers
      .map((provider: { provider_name?: string }) => provider.provider_name)
      .filter((name: string | undefined): name is string => Boolean(name))
      .map((name: string) => providerAliases.get(name) ?? name),
  ).slice(0, 6);
}

function searchLocalCatalog(
  queries: string[],
  metadata: SceneFinderAnalysis["metadata"],
): SceneFinderCandidate[] {
  return localCatalog
    .map((item) => {
      const matchedQuery = queries.find((query) => {
        const normalizedQuery = normalize(query);
        return (
          normalize(item.title).includes(normalizedQuery) ||
          normalizedQuery.includes(normalize(item.title)) ||
          item.aliases.some((alias) => normalizedQuery.includes(normalize(alias)))
        );
      });

      if (!matchedQuery) return null;

      return {
        id: `local-${item.title}`,
        title: item.title,
        type: item.type,
        season: item.type === "映画" ? "-" : "Season未特定",
        episode: item.type === "映画" ? "本編" : "話数未特定",
        confidence: Math.max(58, scoreCandidate(item.title, matchedQuery, metadata)),
        year: item.year,
        providers: item.providers,
        reason: `URLやコメント内の「${matchedQuery}」を既知タイトルと照合しました。`,
        watchUrl: buildWatchUrl(item.title),
        source: "local" as const,
      };
    })
    .filter(Boolean) as SceneFinderCandidate[];
}

function scoreCandidate(
  title: string,
  query: string,
  metadata: SceneFinderAnalysis["metadata"],
  tmdb?: TMDBSearchResult,
) {
  const normalizedTitle = normalize(title);
  const normalizedQuery = normalize(query);
  const haystack = normalize(
    [metadata.title, metadata.description, ...metadata.tags, ...metadata.topComments].join(" "),
  );

  let score = 50;
  if (normalizedQuery === normalizedTitle) score += 30;
  if (normalizedQuery.includes(normalizedTitle) || normalizedTitle.includes(normalizedQuery)) score += 20;
  if (haystack.includes(normalizedTitle)) score += 18;
  if ((tmdb?.vote_count ?? 0) > 100) score += 4;
  if ((tmdb?.popularity ?? 0) > 20) score += 4;

  return Math.min(96, Math.max(45, score));
}

function buildReason(
  query: string,
  metadata: SceneFinderAnalysis["metadata"],
  providers: string[],
  item: TMDBSearchResult,
) {
  const title = item.title ?? item.name ?? query;
  const reasons = [`ヒント「${query}」で作品DB候補「${title}」に一致`];

  if (metadata.topComments.length) reasons.push("上位コメントを照合済み");
  if (metadata.tags.length) reasons.push("タグを照合済み");
  if (providers.length) reasons.push(`日本の配信候補: ${providers.join(" / ")}`);

  return reasons.join("。");
}

function mediaTypeLabel(item: TMDBSearchResult): SceneFinderCandidate["type"] {
  if (item.media_type === "movie") return "映画";
  if (item.media_type === "tv") {
    const animeGenreIds = new Set([16, 10759]);
    return item.genre_ids?.some((id) => animeGenreIds.has(id)) ? "アニメ" : "ドラマ";
  }
  return "不明";
}

function dedupeCandidates(candidates: SceneFinderCandidate[]) {
  const map = new Map<string, SceneFinderCandidate>();

  for (const candidate of candidates) {
    const key = normalize(candidate.title);
    const current = map.get(key);
    if (!current || candidate.confidence > current.confidence) {
      map.set(key, candidate);
    }
  }

  return [...map.values()];
}

function buildWatchUrl(title: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} 配信 視聴`)}`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[・:：!！?？\-ー＿_]/g, "");
}

function normalizeForClassification(value: string) {
  return value.toLowerCase().replace(/[＃#]/g, " ").replace(/\s+/g, " ");
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 50;
  return Math.min(99, Math.max(1, Math.round(value)));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractJson(value: string) {
  const match = value.match(/\{[\s\S]*\}/);
  return match?.[0] ?? value;
}
