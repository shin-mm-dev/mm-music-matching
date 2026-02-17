"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { recommendSongs } from "@/lib/recommend"
import { SongCard } from "@/components/SongCard"
import songsData from "@/data/songs.json"
import type { Song, UserMood } from "@/types/song"

const songs = songsData as Song[]

function RecommendResults() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const moodTags = searchParams.get("moods")?.split(",").filter(Boolean) ?? []
  const tempoPreference = searchParams.get("tempo") as UserMood["tempoPreference"] | null
  const situation = searchParams.get("situation") ?? undefined

  const mood: UserMood = {
    moodTags,
    tempoPreference: tempoPreference ?? undefined,
    situation,
  }

  const results = recommendSongs(mood, songs)

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
