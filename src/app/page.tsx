"use client";

import {
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  Clapperboard,
  Film,
  Heart,
  History,
  Link2,
  Loader2,
  Play,
  Search,
  Share2,
  Sparkles,
  Star,
  Tv,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { SceneFinderAnalysis, SceneFinderCandidate } from "@/lib/scenefinder";

type Result = SceneFinderCandidate & {
  accent: string;
};

const fallbackCandidates: Result[] = [
  {
    id: "demo-alice",
    title: "今際の国のアリス",
    type: "ドラマ",
    season: "Season 2",
    episode: "第3話",
    confidence: 91,
    year: "2022",
    providers: ["Netflix"],
    reason: "字幕の言い回し、廃墟の背景、主要人物の衣装が一致",
    accent: "from-red-500 via-rose-500 to-zinc-950",
    source: "local",
    watchUrl: "https://www.google.com/search?q=%E4%BB%8A%E9%9A%9B%E3%81%AE%E5%9B%BD%E3%81%AE%E3%82%A2%E3%83%AA%E3%82%B9+%E9%85%8D%E4%BF%A1",
  },
  {
    id: "demo-juju",
    title: "呪術廻戦",
    type: "アニメ",
    season: "渋谷事変",
    episode: "第33話",
    confidence: 74,
    year: "2020",
    providers: ["Netflix", "Prime Video", "U-NEXT"],
    reason: "暗所の戦闘シーンとセリフ断片が近い候補",
    accent: "from-indigo-500 via-blue-500 to-cyan-500",
    source: "local",
    watchUrl: "https://www.google.com/search?q=%E5%91%AA%E8%A1%93%E5%BB%BB%E6%88%A6+%E9%85%8D%E4%BF%A1",
  },
  {
    id: "demo-fable",
    title: "ザ・ファブル",
    type: "映画",
    season: "-",
    episode: "本編",
    confidence: 62,
    year: "2019",
    providers: ["U-NEXT", "Prime Video"],
    reason: "人物構図とアクションシーンが近いが字幕一致は弱い",
    accent: "from-amber-300 via-orange-500 to-neutral-900",
    source: "local",
    watchUrl: "https://www.google.com/search?q=%E3%82%B6%E3%83%BB%E3%83%95%E3%82%A1%E3%83%96%E3%83%AB+%E9%85%8D%E4%BF%A1",
  },
];

const recentItems = [
  {
    title: "今際の国のアリス",
    episode: "Season 2 / 第3話",
    savedAt: "今日 18:12",
    service: "Netflix",
    tone: "from-red-500 to-zinc-900",
  },
  {
    title: "呪術廻戦",
    episode: "渋谷事変 / 第33話",
    savedAt: "昨日 23:40",
    service: "Netflix / Prime",
    tone: "from-indigo-500 to-cyan-500",
  },
  {
    title: "アンメット",
    episode: "Season 1 / 第4話",
    savedAt: "7月18日 09:06",
    service: "U-NEXT",
    tone: "from-emerald-500 to-slate-800",
  },
];

const providers = ["Netflix", "U-NEXT", "Prime Video", "Disney+", "Hulu", "ABEMA", "DMM TV"];
const accents = [
  "from-red-500 via-rose-500 to-zinc-950",
  "from-indigo-500 via-blue-500 to-cyan-500",
  "from-amber-300 via-orange-500 to-neutral-900",
  "from-emerald-400 via-teal-500 to-slate-900",
  "from-fuchsia-500 via-violet-500 to-zinc-950",
];

export default function Home() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [saved, setSaved] = useState(true);
  const [url, setUrl] = useState("https://youtube.com/shorts/example");
  const [imageDataUrl, setImageDataUrl] = useState<string>();
  const [imageName, setImageName] = useState<string>();
  const [analysis, setAnalysis] = useState<SceneFinderAnalysis>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>();

  const candidates = useMemo<Result[]>(() => {
    if (!analysis) return fallbackCandidates;
    if (!analysis.candidates.length) {
      return [
        {
          id: "empty",
          title: "候補なし",
          type: "不明",
          season: "-",
          episode: "-",
          confidence: 0,
          year: "不明",
          providers: [],
          reason: "URLから作品候補を確定できませんでした。スクショ追加、YouTube API、OpenAI、TMDB連携で精度を上げられます。",
          accent: "from-zinc-300 via-zinc-500 to-zinc-900",
          source: "local",
        },
      ];
    }
    return analysis.candidates.map((candidate, index) => ({
      ...candidate,
      accent: accents[index % accents.length],
    }));
  }, [analysis]);

  const active = candidates[Math.min(selected, candidates.length - 1)];
  const topTitle = analysis?.candidates[0]?.title ?? "今際の国のアリス";
  const topProvider = analysis?.candidates[0]?.providers[0] ?? "Netflix";

  const confidenceText = useMemo(() => {
    if (active.confidence >= 85) return "かなり有力";
    if (active.confidence >= 70) return "要確認";
    return "参考候補";
  }, [active.confidence]);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(undefined);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, imageDataUrl }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "解析に失敗しました。");
      }

      setAnalysis(data);
      setSelected(0);
      setMode("deep");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleImageUpload(file: File | undefined) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-black/5 bg-[#f7f7f4]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-black text-white shadow-sm">
                <Clapperboard size={20} strokeWidth={2.3} />
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight">SceneFinder</p>
                <p className="text-xs text-black/50">ショートで見つけた作品を見失わない</p>
              </div>
            </div>
            <button
              className="grid size-10 place-items-center rounded-full border border-black/10 bg-white shadow-sm transition hover:bg-black hover:text-white"
              aria-label="共有から保存"
              title="共有から保存"
            >
              <Share2 size={18} />
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_410px]">
          <section className="flex flex-col gap-6">
            <div className="grid gap-4 rounded-[32px] bg-white p-4 shadow-sm shadow-black/5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-[380px] flex-col justify-between rounded-[28px] bg-black p-5 text-white sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/80">
                    Web MVP
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">
                    <Sparkles size={14} />
                    実解析API接続
                  </span>
                </div>

                <div className="max-w-xl">
                  <h1 className="text-4xl font-semibold leading-[1.04] sm:text-6xl">
                    気になる切り抜き、
                    <span className="block text-white/55">あとで本編へ。</span>
                  </h1>
                  <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
                    URL、コメント、スクショ、作品DBを合議制で照合します。
                    動画を保存・再配布せず、正規配信先へつなぐ設計です。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 text-black shadow-inner shadow-black/5">
                    <Link2 size={18} className="text-black/45" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/38"
                      placeholder="YouTube Shorts URLを貼り付け"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      aria-label="YouTube Shorts URL"
                    />
                  </label>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#d8ff5f] px-5 text-sm font-semibold text-black transition hover:bg-[#c7f34b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Bookmark size={18} />}
                    {isAnalyzing ? "解析中" : mode === "quick" ? "あとで解析" : "今すぐ判定"}
                  </button>
                </div>

                {error ? (
                  <p className="mt-3 rounded-2xl bg-red-500/14 px-4 py-3 text-sm text-red-100">{error}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-[26px] border border-black/8 bg-[#f5f5f0] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">クイック表示</p>
                    <span className="text-xs text-black/45">視聴を邪魔しない</span>
                  </div>
                  <div className="rounded-[22px] bg-white p-3 shadow-sm shadow-black/5">
                    <div className="aspect-[9/16] overflow-hidden rounded-[18px] bg-[url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80')] bg-cover bg-center">
                      <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/82 via-black/10 to-transparent p-3">
                        <div className="rounded-2xl bg-white/92 p-3 text-black shadow-lg shadow-black/20 backdrop-blur">
                          <p className="text-xs font-medium text-black/50">SceneFinder</p>
                          <p className="mt-1 text-sm font-semibold">『{topTitle}』かも</p>
                          <p className="mt-1 text-xs text-black/55">
                            {topProvider ? `${topProvider}で配信候補` : "配信先を確認中"}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white">
                              保存
                            </button>
                            <button className="rounded-xl bg-black/7 px-3 py-2 text-xs font-semibold">
                              詳細
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode("quick")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      mode === "quick"
                        ? "border-black bg-black text-white"
                        : "border-black/8 bg-white text-black"
                    }`}
                  >
                    <Clock3 size={18} />
                    <p className="mt-3 text-sm font-semibold">あとで解析</p>
                    <p className="mt-1 text-xs opacity-60">視聴を止めない</p>
                  </button>
                  <button
                    onClick={() => setMode("deep")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      mode === "deep"
                        ? "border-black bg-black text-white"
                        : "border-black/8 bg-white text-black"
                    }`}
                  >
                    <Search size={18} />
                    <p className="mt-3 text-sm font-semibold">今すぐ判定</p>
                    <p className="mt-1 text-xs opacity-60">候補を確認</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[310px_minmax(0,1fr)]">
              <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-black/5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">解析シグナル</p>
                    <p className="mt-1 text-xs text-black/45">精度を上げる材料</p>
                  </div>
                  {isAnalyzing ? (
                    <Loader2 size={18} className="animate-spin text-black/40" />
                  ) : (
                    <Check size={18} className="text-emerald-600" />
                  )}
                </div>

                <div className="space-y-3">
                  {(analysis?.signals ?? [
                    {
                      label: "YouTubeメタデータ",
                      value: "URL入力後に取得",
                      status: "missing",
                    },
                    {
                      label: "上位コメント",
                      value: "YOUTUBE_API_KEYで有効化",
                      status: "missing",
                    },
                    {
                      label: "スクリーンショット",
                      value: imageName ?? "未追加",
                      status: imageName ? "ok" : "missing",
                    },
                  ]).map((signal, index) => (
                    <div key={`${signal.label}-${index}`} className="flex items-center gap-3 rounded-2xl bg-[#f6f6f2] p-3">
                      <div
                        className={`grid size-8 place-items-center rounded-full ${
                          signal.status === "ok"
                            ? "bg-emerald-100 text-emerald-700"
                            : signal.status === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-black/6 text-black/38"
                        }`}
                      >
                        {isAnalyzing && index === 0 ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{signal.label}</p>
                        <p className="truncate text-xs text-black/45">{signal.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/16 bg-[#fbfbf8] p-5 text-center transition hover:border-black/35">
                  <Upload size={22} className="text-black/42" />
                  <span className="mt-2 text-sm font-semibold">スクショを追加</span>
                  <span className="mt-1 text-xs leading-5 text-black/45">
                    画面特徴から候補を増やす
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="スクリーンショットを追加"
                    onChange={(event) => handleImageUpload(event.target.files?.[0])}
                  />
                </label>

                {imageName ? (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white">
                    <span className="truncate">{imageName}</span>
                    <button
                      onClick={() => {
                        setImageName(undefined);
                        setImageDataUrl(undefined);
                      }}
                      aria-label="スクリーンショットを削除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-black/5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">候補結果</p>
                    <p className="mt-1 text-xs text-black/45">
                      {analysis
                        ? `${analysis.searchQueries.length}個のヒントから照合`
                        : "断定せず、根拠つきで比較"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#d8ff5f] px-3 py-1 text-xs font-semibold">
                    {confidenceText}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                  <div className={`min-h-[330px] overflow-hidden rounded-[26px] bg-gradient-to-br ${active.accent} text-white`}>
                    {active.posterUrl ? (
                      <div className="h-full bg-cover bg-center p-4" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.12)), url(${active.posterUrl})` }}>
                        <PosterContent active={active} />
                      </div>
                    ) : (
                      <div className="h-full p-4">
                        <PosterContent active={active} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[24px] bg-[#f6f6f2] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-black/45">認識精度</p>
                          <p className="mt-1 text-4xl font-semibold">{active.confidence}%</p>
                        </div>
                        <div className="h-3 min-w-28 flex-1 overflow-hidden rounded-full bg-black/8">
                          <div
                            className="h-full rounded-full bg-black"
                            style={{ width: `${active.confidence}%` }}
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-black/58">{active.reason}</p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-black/45">配信サービス</p>
                      <div className="flex flex-wrap gap-2">
                        {providers.map((provider) => {
                          const enabled = active.providers.includes(provider);
                          return (
                            <span
                              key={provider}
                              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                                enabled
                                  ? "border-black bg-black text-white"
                                  : "border-black/8 bg-black/4 text-black/35"
                              }`}
                            >
                              {provider}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <a
                        href={active.watchUrl ?? active.tmdbUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/82"
                      >
                        <Play size={17} />
                        本編を探す
                      </a>
                      <button
                        onClick={() => setSaved(!saved)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white text-sm font-semibold transition hover:bg-black/4"
                      >
                        {saved ? <Check size={17} /> : <Bookmark size={17} />}
                        {saved ? "保存済み" : "あとで見る"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {candidates.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setSelected(index)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selected === index ? "border-black bg-black text-white" : "border-black/8 bg-[#fbfbf8]"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs opacity-55">
                        {item.confidence}% / {item.type}
                      </p>
                    </button>
                  ))}
                </div>

                {analysis?.notes.length ? (
                  <div className="mt-4 rounded-2xl bg-black/4 p-3 text-xs leading-5 text-black/48">
                    {analysis.notes[0]}
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-black/5">
              <label className="flex h-12 items-center gap-3 rounded-2xl bg-[#f5f5f0] px-4">
                <Search size={18} className="text-black/42" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/38"
                  placeholder="作品名・俳優・ジャンルで検索"
                  aria-label="作品検索"
                />
              </label>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  ["履歴", History],
                  ["あとで", Bookmark],
                  ["視聴済", Check],
                  ["お気に", Heart],
                ].map(([label, Icon]) => (
                  <button
                    key={label as string}
                    className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[#f7f7f4] text-xs font-semibold text-black/62 transition hover:bg-black hover:text-white"
                  >
                    <Icon size={17} />
                    {label as string}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-black/5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">最近解析</p>
                  <p className="mt-1 text-xs text-black/45">日付順で保存</p>
                </div>
                <button className="grid size-8 place-items-center rounded-full bg-black/5" aria-label="一覧へ">
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="space-y-3">
                {recentItems.map((item) => (
                  <article key={item.title} className="flex gap-3 rounded-3xl bg-[#f8f8f4] p-3">
                    <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.tone} text-white`}>
                      {item.title.includes("呪術") ? <Tv size={22} /> : <Film size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-black/45">{item.episode}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-black/50">{item.service}</span>
                        <span className="shrink-0 text-xs text-black/35">{item.savedAt}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] bg-[#111] p-5 text-white shadow-sm shadow-black/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">精度を上げる順番</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    URLだけでなく、コメント、概要欄、タグ、スクショ、作品DB、配信DBを重ねてスコア化します。
                  </p>
                </div>
                <Sparkles size={20} className="text-[#d8ff5f]" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function PosterContent({ active }: { active: Result }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/16 px-3 py-1 text-xs">{active.type}</span>
        <Star size={18} className="fill-white text-white" />
      </div>
      <div>
        <p className="text-3xl font-semibold leading-tight">{active.title}</p>
        <p className="mt-2 text-sm text-white/78">
          {active.year} / {active.season} / {active.episode}
        </p>
      </div>
    </div>
  );
}
