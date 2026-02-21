import type { Song, UserMood, ScoredSong } from "@/types/song"

interface RecommendOptions {
  seed?: number
}

const MAX_RECOMMENDATIONS = 10
const MAX_ALBUM_RECOMMENDATIONS = 4
const ALBUM_CONFIDENCE_PENALTY = 0.7

function isBalladLike(song: Song): boolean {
  return (
    song.musicalProfile.tempo === "ballad" ||
    (song.musicalProfile.tempo === "mid-tempo" && song.musicalProfile.energy <= 6)
  )
}

function buildMatchReasons(song: Song, mood: UserMood): string[] {
  const reasons: string[] = []

  const tagMatches = mood.moodTags.filter((tag) => song.moodTags.includes(tag))
  if (tagMatches.length > 0) {
    reasons.push(`「${tagMatches.join("」「")}」にマッチ`)
  }

  if (mood.situation && song.situations.includes(mood.situation)) {
    reasons.push(`${mood.situation}にぴったり`)
  }

  if (
    mood.tempoPreference === "up-tempo" &&
    ["up-tempo", "hyper"].includes(song.musicalProfile.tempo)
  ) {
    reasons.push("アップテンポな曲調")
  } else if (
    mood.tempoPreference === "ballad" &&
    isBalladLike(song)
  ) {
    reasons.push("落ち着いたバラード")
  }

  if (song.releaseType === "album") {
    reasons.push("アルバム曲")
  }

  return reasons
}

function calculateScore(song: Song, mood: UserMood): number {
  const requestedTagCount = mood.moodTags.length
  const tagMatchCount = mood.moodTags.filter((tag) => song.moodTags.includes(tag)).length

  if (requestedTagCount === 0 || tagMatchCount === 0) {
    return 0
  }

  const moodCoverage = tagMatchCount / requestedTagCount
  let score = tagMatchCount * 120 + tagMatchCount * tagMatchCount * 20

  if (tagMatchCount === requestedTagCount) {
    score += 80 + requestedTagCount * 20
  }

  let contextBonus = 0
  if (mood.situation && song.situations.includes(mood.situation)) {
    contextBonus += 20
  }

  if (
    mood.tempoPreference === "up-tempo" &&
    ["up-tempo", "hyper"].includes(song.musicalProfile.tempo)
  ) {
    contextBonus += 15
  } else if (
    mood.tempoPreference === "ballad" &&
    isBalladLike(song)
  ) {
    contextBonus += 15
  } else if (mood.tempoPreference === "any") {
    contextBonus += 5
  }

  return score + Math.round(contextBonus * moodCoverage)
}

function applyConfidencePenalty(song: Song, score: number): number {
  if (song.releaseType === "album") {
    return Math.round(score * ALBUM_CONFIDENCE_PENALTY)
  }

  return score
}

function getTieBreaker(songId: string, seed: number): number {
  const input = `${seed}:${songId}`
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function recommendSongs(
  mood: UserMood,
  songs: readonly Song[],
  options?: RecommendOptions
): ScoredSong[] {
  const seed = options?.seed ?? 0

  const scored = songs
    .filter((song) => song.spotifyId !== null)
    .map((song) => ({
      song,
      score: applyConfidencePenalty(song, calculateScore(song, mood)),
      matchReasons: buildMatchReasons(song, mood),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score
      }

      const aSingle = a.song.releaseType === "single"
      const bSingle = b.song.releaseType === "single"
      if (aSingle !== bSingle) {
        return aSingle ? -1 : 1
      }

      const tieA = getTieBreaker(a.song.id, seed)
      const tieB = getTieBreaker(b.song.id, seed)
      return tieA - tieB || a.song.id.localeCompare(b.song.id)
    })

  const filtered = scored.filter((item) => item.score > 0)
  const results: ScoredSong[] = []
  let albumCount = 0

  for (const item of filtered) {
    if (item.song.releaseType === "album" && albumCount >= MAX_ALBUM_RECOMMENDATIONS) {
      continue
    }
    results.push(item)
    if (item.song.releaseType === "album") {
      albumCount += 1
    }
    if (results.length >= MAX_RECOMMENDATIONS) {
      break
    }
  }

  return results
}
