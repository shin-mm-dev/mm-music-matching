"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import type { UserMood } from "@/types/song"

interface RecommendParamsResult {
  mood: UserMood
  moodTags: string[]
  tempoPreference: UserMood["tempoPreference"] | undefined
  situation: string | undefined
}

export function useRecommendParams(): RecommendParamsResult {
  const searchParams = useSearchParams()

  const moodParam = searchParams.get("moods") ?? ""
  const rawTempo = searchParams.get("tempo")
  const tempoPreference: UserMood["tempoPreference"] | undefined =
    rawTempo === "ballad" || rawTempo === "up-tempo" || rawTempo === "any"
      ? rawTempo
      : undefined
  const situation = searchParams.get("situation") ?? undefined

  const moodTags = useMemo(
    () => [...new Set(moodParam.split(",").filter(Boolean))].slice(0, 3),
    [moodParam],
  )

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
