"use client"

import { useEffect, useRef } from "react"
import type { ScoredSong } from "@/types/song"

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

// ブラウザに保存されている「これまでおすすめに表示された回数」を安全に読み取る
export function readExposureCounts(): Record<string, number> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    return parseExposureCounts(
      window.localStorage.getItem(EXPOSURE_COUNTS_STORAGE_KEY),
    )
  } catch {
    return {}
  }
}

// 画面に表示された楽曲の露出回数を記録し、次回以降に新しい曲が混ざりやすくなるようにする
export function useExposureTracking(
  results: readonly ScoredSong[],
  recordKey: string,
): void {
  const recordedKeyRef = useRef("")

  useEffect(() => {
    if (results.length === 0 || recordKey === "" || typeof window === "undefined") {
      return
    }

    if (recordedKeyRef.current === recordKey) {
      return
    }
    recordedKeyRef.current = recordKey

    const nextCounts = { ...readExposureCounts() }
    for (const item of results) {
      nextCounts[item.song.id] = (nextCounts[item.song.id] ?? 0) + 1
    }

    try {
      window.localStorage.setItem(
        EXPOSURE_COUNTS_STORAGE_KEY,
        JSON.stringify(nextCounts),
      )
    } catch {
      // 保存できない環境でも推薦結果の表示自体は続行する
    }
  }, [results, recordKey])
}
