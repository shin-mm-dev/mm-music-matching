"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MoodSelector } from "@/components/MoodSelector"
import { TempoSelector } from "@/components/TempoSelector"
import { SituationSelector } from "@/components/SituationSelector"
import {
  parseMoodTagsParam,
  parseSituationParam,
  parseTempoParam,
  type TempoPreference,
} from "@/constants/options"

interface HomeFormProps {
  initialMoodTags: string[]
  initialTempo: TempoPreference | undefined
  initialSituation: string | undefined
}

function HomeForm({
  initialMoodTags,
  initialTempo,
  initialSituation,
}: HomeFormProps) {
  const router = useRouter()
  const [moodTags, setMoodTags] = useState<string[]>(initialMoodTags)
  const [tempo, setTempo] = useState<TempoPreference | undefined>(initialTempo)
  const [situation, setSituation] = useState<string | undefined>(initialSituation)

  const canSubmit = moodTags.length >= 1 && moodTags.length <= 3

  const handleSubmit = () => {
    if (!canSubmit) return

    const params = new URLSearchParams()
    params.set("moods", moodTags.join(","))
    if (tempo) params.set("tempo", tempo)
    if (situation) params.set("situation", situation)

    router.push(`/recommend?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <MoodSelector selected={moodTags} onChange={setMoodTags} />
      <TempoSelector selected={tempo} onChange={setTempo} />
      <SituationSelector selected={situation} onChange={setSituation} />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-4 rounded-2xl text-lg font-bold whitespace-nowrap transition-all duration-200
          ${
            canSubmit
              ? "bg-pink-500 text-white shadow-lg hover:bg-pink-600 hover:shadow-xl active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        おすすめを見つける
      </button>
    </div>
  )
}

// 結果ページから「条件を変えて選び直す」で戻ったとき、URLの条件を初期値として復元する
function HomeFormWithParams() {
  const searchParams = useSearchParams()
  const initialMoodTags = parseMoodTagsParam(searchParams.get("moods"))
  const initialTempo = parseTempoParam(searchParams.get("tempo"))
  const initialSituation = parseSituationParam(searchParams.get("situation"))
  const searchKey = `${initialMoodTags.join(",")}|${initialTempo ?? ""}|${initialSituation ?? ""}`

  return (
    <HomeForm
      key={searchKey}
      initialMoodTags={initialMoodTags}
      initialTempo={initialTempo}
      initialSituation={initialSituation}
    />
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.png`}
              alt="MM Music Matching — モーニング娘。サブスク楽曲レコメンド"
              width={1024}
              height={203}
              className="mx-auto w-[280px] sm:w-[360px] h-auto"
            />
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            あなたの気分にぴったりの楽曲を見つけよう
          </p>
        </header>

        {/* 静的生成HTMLでもフォームが表示されるよう、読み込み中フォールバックに同じフォームを表示する */}
        <Suspense
          fallback={
            <HomeForm
              initialMoodTags={[]}
              initialTempo={undefined}
              initialSituation={undefined}
            />
          }
        >
          <HomeFormWithParams />
        </Suspense>
      </div>
    </div>
  )
}
