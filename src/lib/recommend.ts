import type { Song, UserMood, ScoredSong } from "@/types/song"

interface RecommendOptions {
  seed?: number
  exposureCounts?: Record<string, number>
}

const MAX_RECOMMENDATIONS = 10
const EXPLORATION_SLOT_COUNT = 1
const MIN_ALBUM_RECOMMENDATIONS = 3
const MAX_ALBUM_RECOMMENDATIONS = 5
const ALBUM_CONFIDENCE_PENALTY = 0.85
const CANDIDATE_POOL_SIZE = 50

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

function getExposureCount(
  songId: string,
  exposureCounts?: Record<string, number>,
): number {
  if (!exposureCounts) {
    return 0
  }
  const raw = exposureCounts[songId]
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return 0
  }
  return Math.max(0, Math.floor(raw))
}

function getNoveltyBonus(exposureCount: number): number {
  if (exposureCount === 0) {
    return 24
  }
  if (exposureCount <= 2) {
    return 14
  }
  if (exposureCount <= 5) {
    return 7
  }
  return 0
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

function flattenPrioritizedGroups(
  prioritizedGroups: readonly (readonly ScoredSong[])[],
): ScoredSong[] {
  const flattened: ScoredSong[] = []
  const seenSongIds = new Set<string>()

  for (const items of prioritizedGroups) {
    for (const item of items) {
      if (seenSongIds.has(item.song.id)) {
        continue
      }
      flattened.push(item)
      seenSongIds.add(item.song.id)
    }
  }

  return flattened
}

function applyAlbumMixAndFill(
  prioritizedGroups: readonly (readonly ScoredSong[])[],
  maxTotal: number,
): ScoredSong[] {
  const candidates = flattenPrioritizedGroups(prioritizedGroups)
  const availableAlbums = candidates.filter(
    (item) => item.song.releaseType === "album",
  ).length
  const minAlbumTarget = Math.min(
    MIN_ALBUM_RECOMMENDATIONS,
    MAX_ALBUM_RECOMMENDATIONS,
    availableAlbums,
    maxTotal,
  )

  const results: ScoredSong[] = []
  const seenSongIds = new Set<string>()
  let albumCount = 0

  for (const item of candidates) {
    if (results.length >= maxTotal || albumCount >= minAlbumTarget) {
      break
    }
    if (item.song.releaseType !== "album") {
      continue
    }
    results.push(item)
    seenSongIds.add(item.song.id)
    albumCount += 1
  }

  for (const item of candidates) {
    if (results.length >= maxTotal) {
      return results
    }

    if (seenSongIds.has(item.song.id)) {
      continue
    }

    if (
      item.song.releaseType === "album" &&
      albumCount >= MAX_ALBUM_RECOMMENDATIONS
    ) {
      continue
    }

    results.push(item)
    seenSongIds.add(item.song.id)

    if (item.song.releaseType === "album") {
      albumCount += 1
    }
  }

  return results
}

function enforceExplorationSlot(
  selected: readonly ScoredSong[],
  prioritizedCandidates: readonly ScoredSong[],
  exposureCounts?: Record<string, number>,
): ScoredSong[] {
  if (!exposureCounts || EXPLORATION_SLOT_COUNT <= 0) {
    return [...selected]
  }

  const selectedUnseenCount = selected.filter(
    (item) => getExposureCount(item.song.id, exposureCounts) === 0,
  ).length
  if (selectedUnseenCount >= EXPLORATION_SLOT_COUNT) {
    return [...selected]
  }

  const selectedIds = new Set(selected.map((item) => item.song.id))
  const albumCount = selected.filter(
    (item) => item.song.releaseType === "album",
  ).length

  const explorationCandidate = prioritizedCandidates.find((item) => {
    if (selectedIds.has(item.song.id)) {
      return false
    }
    if (getExposureCount(item.song.id, exposureCounts) !== 0) {
      return false
    }
    if (item.song.releaseType === "album" && albumCount >= MAX_ALBUM_RECOMMENDATIONS) {
      return false
    }
    return true
  })

  if (!explorationCandidate) {
    return [...selected]
  }

  const replacement = selected
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) => getExposureCount(item.song.id, exposureCounts) > 0,
    )
    .filter(({ item }) => {
      const nextAlbumCount =
        albumCount +
        (explorationCandidate.song.releaseType === "album" ? 1 : 0) -
        (item.song.releaseType === "album" ? 1 : 0)
      return (
        nextAlbumCount >= MIN_ALBUM_RECOMMENDATIONS &&
        nextAlbumCount <= MAX_ALBUM_RECOMMENDATIONS
      )
    })
    .sort((a, b) => {
      if (a.item.score !== b.item.score) {
        return a.item.score - b.item.score
      }
      return a.item.song.id.localeCompare(b.item.song.id)
    })[0]

  if (!replacement) {
    return [...selected]
  }

  const next = [...selected]
  next[replacement.index] = {
    ...explorationCandidate,
    matchReasons: explorationCandidate.matchReasons.includes("発見枠")
      ? explorationCandidate.matchReasons
      : [...explorationCandidate.matchReasons, "発見枠"],
  }

  return [...next].sort((a, b) => b.score - a.score)
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
  const exposureCounts = options?.exposureCounts
  const enableDiscoveryAdjustments = exposureCounts !== undefined
  const random = createSeededRandom(seed)

  const scored = songs
    .filter((song) => song.spotifyId !== null)
    .map((song) => {
      const baseScore = calculateScore(song, mood)
      const noveltyBonus =
        enableDiscoveryAdjustments && baseScore > 0
          ? getNoveltyBonus(getExposureCount(song.id, exposureCounts))
          : 0

      return {
        song,
        score: applyConfidencePenalty(song, baseScore) + noveltyBonus,
        matchReasons: buildMatchReasons(song, mood),
      }
    })

  const primaryMatches = scored
    .filter((item) => item.score > 0)
    .sort(comparePrimaryMatches)
  const candidatePool = primaryMatches.slice(0, CANDIDATE_POOL_SIZE)

  const selected =
    candidatePool.length > MAX_RECOMMENDATIONS
      ? weightedRandomSample(candidatePool, MAX_RECOMMENDATIONS, random)
      : [...candidatePool]

  const selectedIds = new Set(selected.map((item) => item.song.id))
  const remainingPrimaryMatches = primaryMatches.filter(
    (item) => !selectedIds.has(item.song.id),
  )
  const fallbackCandidates = scored
    .filter(
      (item) => item.score === 0 && !selectedIds.has(item.song.id),
    )
    .map((item) => ({
      ...item,
      score:
        getFallbackScore(item.song, mood) +
        (enableDiscoveryAdjustments
          ? Math.floor(getNoveltyBonus(getExposureCount(item.song.id, exposureCounts)) / 2)
          : 0),
      matchReasons: buildFallbackReasons(item.song, mood),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => compareFallbackMatches(a, b, seed))

  const prioritizedCandidates = flattenPrioritizedGroups([
    selected,
    remainingPrimaryMatches,
    fallbackCandidates,
  ])
  const mixedResults = applyAlbumMixAndFill(
    [selected, remainingPrimaryMatches, fallbackCandidates],
    MAX_RECOMMENDATIONS,
  )

  return enforceExplorationSlot(
    mixedResults,
    prioritizedCandidates,
    exposureCounts,
  )
}
