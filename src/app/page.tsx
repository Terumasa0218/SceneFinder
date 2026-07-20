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
} from "lucide-react";
import { useMemo, useState } from "react";

type Result = {
  title: string;
  type: string;
  season: string;
  episode: string;
  confidence: number;
  year: string;
  providers: string[];
  reason: string;
  accent: string;
};

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

const candidates: Result[] = [
  {
    title: "今際の国のアリス",
    type: "ドラマ",
    season: "Season 2",
    episode: "第3話",
    confidence: 91,
    year: "2022",
    providers: ["Netflix"],
    reason: "字幕の言い回し、廃墟の背景、主要人物の衣装が一致",
    accent: "from-red-500 via-rose-500 to-zinc-950",
  },
  {
    title: "幽☆遊☆白書",
    type: "ドラマ",
    season: "Season 1",
    episode: "第2話",
    confidence: 74,
    year: "2023",
    providers: ["Netflix"],
    reason: "暗所の戦闘シーンとセリフ断片が近い候補",
    accent: "from-lime-400 via-emerald-500 to-zinc-900",
  },
  {
    title: "ザ・ファブル",
    type: "映画",
    season: "-",
    episode: "本編",
    confidence: 62,
    year: "2019",
    providers: ["U-NEXT", "Prime Video"],
    reason: "人物構図とアクションシーンが近いが字幕一致は弱い",
    accent: "from-amber-300 via-orange-500 to-neutral-900",
  },
];

const providers = ["Netflix", "U-NEXT", "Prime Video", "Disney+", "Hulu", "ABEMA"];

export default function Home() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [saved, setSaved] = useState(true);
  const active = candidates[selected];

  const confidenceText = useMemo(() => {
    if (active.confidence >= 85) return "かなり有力";
    if (active.confidence >= 70) return "要確認";
    return "参考候補";
  }, [active.confidence]);

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
                    AI解析デモ
                  </span>
                </div>

                <div className="max-w-xl">
                  <h1 className="text-4xl font-semibold leading-[1.04] sm:text-6xl">
                    気になる切り抜き、
                    <span className="block text-white/55">あとで本編へ。</span>
                  </h1>
                  <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
                    ShortsのURLやスクショを保存。作品候補、話数、配信サービスをまとめて確認できます。
                    まずは視聴を止めない体験を重視したたたき台です。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 text-black shadow-inner shadow-black/5">
                    <Link2 size={18} className="text-black/45" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/38"
                      placeholder="YouTube Shorts URLを貼り付け"
                      defaultValue="https://youtube.com/shorts/example"
                      aria-label="YouTube Shorts URL"
                    />
                  </label>
                  <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#d8ff5f] px-5 text-sm font-semibold text-black transition hover:bg-[#c7f34b]">
                    <Bookmark size={18} />
                    あとで解析
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-[26px] border border-black/8 bg-[#f5f5f0] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">クイック保存</p>
                    <span className="text-xs text-black/45">1秒で完了</span>
                  </div>
                  <div className="rounded-[22px] bg-white p-3 shadow-sm shadow-black/5">
                    <div className="aspect-[9/16] overflow-hidden rounded-[18px] bg-[url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80')] bg-cover bg-center">
                      <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/82 via-black/10 to-transparent p-3">
                        <div className="rounded-2xl bg-white/92 p-3 text-black shadow-lg shadow-black/20 backdrop-blur">
                          <p className="text-xs font-medium text-black/50">SceneFinder</p>
                          <p className="mt-1 text-sm font-semibold">『今際の国のアリス』かも</p>
                          <p className="mt-1 text-xs text-black/55">Netflixで配信中</p>
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
                    <p className="text-sm font-semibold">解析キュー</p>
                    <p className="mt-1 text-xs text-black/45">共有されたShortsを裏で整理</p>
                  </div>
                  <Loader2 size={18} className="animate-spin text-black/40" />
                </div>

                <div className="space-y-3">
                  {["URLを保存", "字幕・コメントのヒント抽出", "作品DBと配信先を照合"].map(
                    (item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f6f6f2] p-3">
                        <div
                          className={`grid size-8 place-items-center rounded-full ${
                            index === 2 ? "bg-black text-white" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {index === 2 ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item}</p>
                          <p className="text-xs text-black/45">{index === 2 ? "処理中" : "完了"}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/16 bg-[#fbfbf8] p-5 text-center transition hover:border-black/35">
                  <Upload size={22} className="text-black/42" />
                  <span className="mt-2 text-sm font-semibold">スクショを追加</span>
                  <span className="mt-1 text-xs leading-5 text-black/45">
                    URLだけで弱い時に精度を上げる
                  </span>
                  <input type="file" className="sr-only" aria-label="スクリーンショットを追加" />
                </label>
              </section>

              <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-black/5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">候補結果</p>
                    <p className="mt-1 text-xs text-black/45">断定せず、根拠つきで比較</p>
                  </div>
                  <span className="rounded-full bg-[#d8ff5f] px-3 py-1 text-xs font-semibold">
                    {confidenceText}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                  <div className={`min-h-[330px] rounded-[26px] bg-gradient-to-br ${active.accent} p-4 text-white`}>
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/16 px-3 py-1 text-xs">{active.type}</span>
                        <Star size={18} className="fill-white text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-semibold leading-tight">{active.title}</p>
                        <p className="mt-2 text-sm text-white/70">
                          {active.year} / {active.season} / {active.episode}
                        </p>
                      </div>
                    </div>
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
                      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/82">
                        <Play size={17} />
                        本編を見る
                      </button>
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
                      key={item.title}
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
                  <p className="text-sm font-semibold">次に作る機能</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    共有シート、スクショ解析、配信API連携、Chrome拡張の順に伸ばせる構成です。
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
