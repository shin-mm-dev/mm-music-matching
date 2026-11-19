"use client"

import { useRouter } from "next/navigation"
import { Suspense, useMemo, useState, useSyncExternalStore } from "react"
import { recommendSongs } from "@/lib/recommend"
import { SongCard } from "@/components/SongCard"
import { getTempoLabel, type TempoPreference } from "@/constants/options"
import songsData from "@/data/songs.json"
import type { Song } from "@/types/song"
import { useRecommendParams } from "@/hooks/useRecommendParams"
import {
  readExposureCounts,
  useExposureTracking,
} from "@/hooks/useExposureTracking"

const songs = songsData as Song[]

const emptySubscribe = () => () => {}

// 初回表示時のサーバー側HTMLとブラウザ側の描画ズレ（Hydration mismatch）を防ぐための判定フック
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

interface RecommendSession {
  seed: number
  exposureCounts: Record<string, number>
}

function createRecommendSession(): RecommendSession {
  return {
    seed: Math.floor(Math.random() * 0x7fffffff),
    exposureCounts: readExposureCounts(),
  }
}

function LoadingSpinner() {
  return (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
    </div>
  )
}

interface RecommendResultsContentProps {
  moodTags: string[]
  tempoPreference: TempoPreference | undefined
  situation: string | undefined
}

function RecommendResultsContent({
  moodTags,
  tempoPreference,
  situation,
}: RecommendResultsContentProps) {
  const router = useRouter()
  const [session, setSession] = useState<RecommendSession>(() =>
    createRecommendSession(),
  )

  const results = useMemo(() => {
    return recommendSongs(
      {
        moodTags,
        tempoPreference,
        situation,
      },
      songs,
      {
        seed: session.seed,
        exposureCounts: session.exposureCounts,
      },
    )
  }, [moodTags, tempoPreference, situation, session])

  const recordKey =
    results.length > 0
      ? `${session.seed}:${results.map((item) => item.song.id).join(",")}`
      : ""

  useExposureTracking(results, recordKey)

  const handleReshuffle = () => {
    setSession(createRecommendSession())
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 直前の選択条件をURLに載せてトップページへ戻す
  const handleChangeConditions = () => {
    const params = new URLSearchParams()
    params.set("moods", moodTags.join(","))
    if (tempoPreference) params.set("tempo", tempoPreference)
    if (situation) params.set("situation", situation)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap gap-1.5">
          {moodTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {tempoPreference && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
              {getTempoLabel(tempoPreference)}
            </span>
          )}
          {situation && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              {situation}
            </span>
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleReshuffle}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-pink-200 bg-white text-pink-600 text-xs font-medium hover:bg-pink-50 transition-colors"
            >
              <span aria-hidden="true">↻</span>
              別の10曲を見る
            </button>
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((scoredSong, index) => (
            <SongCard
              key={scoredSong.song.id}
              scoredSong={scoredSong}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            マッチする曲が見つかりませんでした
          </p>
          <p className="text-gray-400 text-sm mt-1">
            別の気分で試してみてね
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        {results.length > 0 && (
          <button
            type="button"
            onClick={handleReshuffle}
            className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors shadow-sm"
          >
            別の10曲を見る
          </button>
        )}
        <button
          type="button"
          onClick={handleChangeConditions}
          className="px-6 py-3 bg-white text-pink-500 border-2 border-pink-500 rounded-full font-medium hover:bg-pink-50 transition-colors"
        >
          条件を変えて選び直す
        </button>
      </div>
    </div>
  )
}

function RecommendResults() {
  const router = useRouter()
  const isClient = useIsClient()
  const { moodTags, tempoPreference, situation } = useRecommendParams()

  if (moodTags.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">気分を選んでから来てね！</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          気分を選びに行く
        </button>
      </div>
    )
  }

  // クライアント側でランダム抽選と視聴履歴を読み取るまでローディング表示を保つ
  if (!isClient) {
    return <LoadingSpinner />
  }

  return (
    <RecommendResultsContent
      moodTags={moodTags}
      tempoPreference={tempoPreference}
      situation={situation}
    />
  )
}

export default function RecommendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <header className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            <span className="text-pink-500">♪</span> あなたへのおすすめ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            今の気分にぴったりの楽曲をピックアップ
          </p>
        </header>

        <Suspense fallback={<LoadingSpinner />}>
          <RecommendResults />
        </Suspense>
      </div>
    </div>
  )
}
