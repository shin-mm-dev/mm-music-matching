"use client"

import { useEffect, useRef, useState } from "react"
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

interface UseExposureTrackingResult {
  exposureCountsSnapshot: Record<string, number>
}

export function useExposureTracking(
  results: readonly ScoredSong[],
): UseExposureTrackingResult {
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

  useEffect(() => {
    if (results.length === 0 || typeof window === "undefined") {
      return
    }

    const requestKey = results.map((item) => item.song.id).join(",")
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
  }, [results])

  return { exposureCountsSnapshot }
}
