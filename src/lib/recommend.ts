import type { Song, UserMood, ScoredSong } from "@/types/song"

interface RecommendOptions {
  seed?: number
}

const MAX_RECOMMENDATIONS = 10
const MAX_ALBUM_RECOMMENDATIONS = 4
const ALBUM_CONFIDENCE_PENALTY = 0.7
const CANDIDATE_POOL_SIZE = 30

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
  } else if (mood.tempoPreference === "ballad" && isBalladLike(song)) {
    reasons.push("落ち着いたバラード")
  }

  if (song.releaseType === "album") {
    reasons.push("アルバム曲")
  }

  return reasons
}

function buildFallbackReasons(song: Song, mood: UserMood): string[] {
  const reasons: string[] = []

  if (mood.situation && song.situations.includes(mood.situation)) {
    reasons.push(`${mood.situation}にぴったり`)
  }

  if (
    mood.tempoPreference === "up-tempo" &&
    ["up-tempo", "hyper"].includes(song.musicalProfile.tempo)
  ) {
    reasons.push("アップテンポな曲調")
  } else if (mood.tempoPreference === "ballad" && isBalladLike(song)) {
    reasons.push("落ち着いたバラード")
  }

  if (reasons.length === 0) {
    reasons.push("こちらもおすすめ")
  }

  if (song.releaseType === "album") {
    reasons.push("アルバム曲")
  }

  return reasons
}

function calculateScore(song: Song, mood: UserMood): number {
  const requestedTagCount = mood.moodTags.length
  const tagMatchCount = mood.moodTags.filter((tag) =>
    song.moodTags.includes(tag),
  ).length

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

function getFallbackScore(song: Song, mood: UserMood): number {
  let score = 0

  if (mood.situation && song.situations.includes(mood.situation)) {
    score += 30
  }

  if (
    mood.tempoPreference === "up-tempo" &&
    ["up-tempo", "hyper"].includes(song.musicalProfile.tempo)
  ) {
    score += 20
  } else if (mood.tempoPreference === "ballad" && isBalladLike(song)) {
    score += 20
  }

  if (song.releaseType === "single") {
    score += 10
  } else if (song.releaseType === "album") {
    score += 5
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

function createSeededRandom(seed: number): () => number {
  let state = (seed | 0) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 1000000) / 1000000
  }
}

function weightedRandomSample(
  candidates: readonly ScoredSong[],
  count: number,
  random: () => number,
): ScoredSong[] {
  const pool = [...candidates]
  const selected: ScoredSong[] = []

  while (selected.length < count && pool.length > 0) {
    const totalWeight = pool.reduce(
      (sum, item) => sum + Math.max(item.score, 0),
      0,
    )

    if (totalWeight <= 0) {
      return [...selected, ...pool.slice(0, count - selected.length)].sort(
        (a, b) => b.score - a.score,
      )
    }

    let cursor = random() * totalWeight
    let selectedIndex = pool.length - 1

    for (let index = 0; index < pool.length; index += 1) {
      cursor -= Math.max(pool[index].score, 0)
      if (cursor <= 0) {
        selectedIndex = index
        break
      }
    }

    selected.push(pool[selectedIndex])
    pool.splice(selectedIndex, 1)
  }

  return [...selected].sort((a, b) => b.score - a.score)
}

function applyAlbumLimit(
  items: readonly ScoredSong[],
  maxTotal: number,
): ScoredSong[] {
  const results: ScoredSong[] = []
  let albumCount = 0

  for (const item of items) {
    if (results.length >= maxTotal) {
      break
    }

    if (
      item.song.releaseType === "album" &&
      albumCount >= MAX_ALBUM_RECOMMENDATIONS
    ) {
      continue
    }

    results.push(item)

    if (item.song.releaseType === "album") {
      albumCount += 1
    }
  }

  return results
}

function comparePrimaryMatches(a: ScoredSong, b: ScoredSong): number {
  if (a.score !== b.score) {
    return b.score - a.score
  }

  const aSingle = a.song.releaseType === "single"
  const bSingle = b.song.releaseType === "single"
  if (aSingle !== bSingle) {
    return aSingle ? -1 : 1
  }

  return a.song.id.localeCompare(b.song.id)
}

function compareFallbackMatches(
  a: ScoredSong,
  b: ScoredSong,
  seed: number,
): number {
  if (a.score !== b.score) {
    return b.score - a.score
  }

  const tieA = getTieBreaker(a.song.id, seed)
  const tieB = getTieBreaker(b.song.id, seed)
  return tieA - tieB
}

export function recommendSongs(
  mood: UserMood,
  songs: readonly Song[],
  options?: RecommendOptions,
): ScoredSong[] {
  const seed = options?.seed ?? 0
  const random = createSeededRandom(seed)

  const scored = songs
    .filter((song) => song.spotifyId !== null)
    .map((song) => ({
      song,
      score: applyConfidencePenalty(song, calculateScore(song, mood)),
      matchReasons: buildMatchReasons(song, mood),
    }))

  const primaryMatches = scored
    .filter((item) => item.score > 0)
    .sort(comparePrimaryMatches)
  const candidatePool = primaryMatches.slice(0, CANDIDATE_POOL_SIZE)

  let selected =
    candidatePool.length > MAX_RECOMMENDATIONS
      ? weightedRandomSample(candidatePool, MAX_RECOMMENDATIONS, random)
      : [...candidatePool]

  if (selected.length < MAX_RECOMMENDATIONS) {
    const selectedIds = new Set(selected.map((item) => item.song.id))
    const fallbackCandidates = scored
      .filter(
        (item) => item.score === 0 && !selectedIds.has(item.song.id),
      )
      .map((item) => ({
        ...item,
        score: getFallbackScore(item.song, mood),
        matchReasons: buildFallbackReasons(item.song, mood),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => compareFallbackMatches(a, b, seed))

    const remaining = MAX_RECOMMENDATIONS - selected.length
    selected = [...selected, ...fallbackCandidates.slice(0, remaining)]
  }

  return applyAlbumLimit(selected, MAX_RECOMMENDATIONS)
}
