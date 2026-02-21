"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { recommendSongs } from "@/lib/recommend"
import { SongCard } from "@/components/SongCard"
import songsData from "@/data/songs.json"
import type { Song, UserMood } from "@/types/song"

const songs = songsData as Song[]
const EXPOSURE_COUNTS_STORAGE_KEY = "musume-mood-exposure-counts-v1"

function parseExposureCounts(raw: string | null): Record<string, number> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") {
      return {}
    }

    const counts: Record<string, number> = {}
    for (const [songId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        continue
      }
      counts[songId] = Math.max(0, Math.floor(value))
    }
    return counts
  } catch {
    return {}
  }
}

function RecommendResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff))
  const [exposureCountsSnapshot] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {}
    }
    return parseExposureCounts(
      window.localStorage.getItem(EXPOSURE_COUNTS_STORAGE_KEY),
    )
  })
  const exposureCountsRef = useRef<Record<string, number>>(exposureCountsSnapshot)
  const recordedResultKeyRef = useRef("")

  const moodParam = searchParams.get("moods") ?? ""
  const tempoPreference = searchParams.get("tempo") as UserMood["tempoPreference"] | null
  const situation = searchParams.get("situation") ?? undefined
  const moodTags = useMemo(
    () => moodParam.split(",").filter(Boolean),
    [moodParam],
  )

  const mood: UserMood = {
    moodTags,
    tempoPreference: tempoPreference ?? undefined,
    situation,
  }

  const results = recommendSongs(mood, songs, {
    seed: shuffleSeed,
    exposureCounts: exposureCountsSnapshot,
  })

  useEffect(() => {
    if (results.length === 0 || typeof window === "undefined") {
      return
    }

    const requestKey = `${shuffleSeed}:${moodParam}:${tempoPreference ?? ""}:${situation ?? ""}`
    if (recordedResultKeyRef.current === requestKey) {
      return
    }
    recordedResultKeyRef.current = requestKey

    const nextCounts = { ...exposureCountsRef.current }
    for (const item of results) {
      nextCounts[item.song.id] = (nextCounts[item.song.id] ?? 0) + 1
    }

    exposureCountsRef.current = nextCounts
    try {
      window.localStorage.setItem(
        EXPOSURE_COUNTS_STORAGE_KEY,
        JSON.stringify(nextCounts),
      )
    } catch {
      // Ignore storage write failures and keep recommendations available.
    }
  }, [moodParam, results, shuffleSeed, situation, tempoPreference])

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
          {situation && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              {situation}
            </span>
          )}
        </div>
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

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-white text-pink-500 border-2 border-pink-500 rounded-full font-medium hover:bg-pink-50 transition-colors"
        >
          もう一度選ぶ
        </button>
      </div>
    </div>
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

        <Suspense
          fallback={
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
          }
        >
          <RecommendResults />
        </Suspense>
      </div>
    </div>
  )
}
