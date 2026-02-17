export interface Song {
  id: string
  title: string
  titleReading: string
  releaseDate: string
  releaseType: "single" | "album" | "coupling" | "other"
  memberEra: string
  spotifyId: string | null

  composer: {
    lyricist: string
    composer: string
    arranger: string
    isTsunku: boolean
  }

  musicalProfile: {
    key: string
    mode: "major" | "minor" | "mixed"
    bpm: number
    tempo: "ballad" | "mid-tempo" | "up-tempo" | "hyper"
    genre: string[]
    energy: number
    instrumentalMood: string[]
  }

  lyricalProfile: {
    themes: string[]
    emotionalTone: string[]
    lyricMoodScore: number
    perspective: "first-person" | "third-person" | "narrative" | "abstract"
  }

  tsunkuGap: {
    score: number
    description: string
    musicalMoodScore: number
  } | null

  moodTags: string[]
  situations: string[]
}

export interface UserMood {
  moodTags: string[]
  tempoPreference?: "ballad" | "up-tempo" | "any"
  situation?: string
}

export interface ScoredSong {
  song: Song
  score: number
  matchReasons: string[]
}
