"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import {
  parseMoodTagsParam,
  parseSituationParam,
  parseTempoParam,
  type TempoPreference,
} from "@/constants/options"
import type { UserMood } from "@/types/song"

interface RecommendParamsResult {
  mood: UserMood
  moodTags: string[]
  tempoPreference: TempoPreference | undefined
  situation: string | undefined
}

export function useRecommendParams(): RecommendParamsResult {
  const searchParams = useSearchParams()

  const rawMoods = searchParams.get("moods")
  const tempoPreference = parseTempoParam(searchParams.get("tempo"))
  const situation = parseSituationParam(searchParams.get("situation"))

  const moodTags = useMemo(() => parseMoodTagsParam(rawMoods), [rawMoods])

  const mood = useMemo<UserMood>(
    () => ({
      moodTags,
      tempoPreference,
      situation,
    }),
    [moodTags, situation, tempoPreference],
  )

  return { mood, moodTags, tempoPreference, situation }
}
