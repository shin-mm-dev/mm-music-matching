import type { Song, UserMood, ScoredSong } from "@/types/song"

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

  return reasons
}

function calculateScore(song: Song, mood: UserMood): number {
  let score = 0

  const tagMatches = mood.moodTags.filter((tag) => song.moodTags.includes(tag))
  score += tagMatches.length * 30

  if (mood.situation && song.situations.includes(mood.situation)) {
    score += 20
  }

  if (
    mood.tempoPreference === "up-tempo" &&
    ["up-tempo", "hyper"].includes(song.musicalProfile.tempo)
  ) {
    score += 15
  } else if (
    mood.tempoPreference === "ballad" &&
    isBalladLike(song)
  ) {
    score += 15
  } else if (mood.tempoPreference === "any") {
    score += 5
  }

  return score
}

export function recommendSongs(
  mood: UserMood,
  songs: readonly Song[]
): ScoredSong[] {
  const scored = songs
    .filter((song) => song.releaseType === "single" && song.spotifyId !== null)
    .map((song) => ({
      song,
      score: calculateScore(song, mood),
      matchReasons: buildMatchReasons(song, mood),
    }))
    .sort((a, b) => b.score - a.score)

  return scored.filter((item) => item.score > 0).slice(0, 10)
}
