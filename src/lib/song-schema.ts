import { z } from "zod"

// 楽曲データの公開JSON（songs.json）が正しい形式かを検証するためのスキーマ定義
const RELEASE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const composerSchema = z
  .object({
    lyricist: z.string(),
    composer: z.string(),
    arranger: z.string(),
    isTsunku: z.boolean(),
  })
  .strict()

const musicalProfileSchema = z
  .object({
    key: z.string(),
    mode: z.enum(["major", "minor", "mixed"]),
    bpm: z.number(),
    tempo: z.enum(["ballad", "mid-tempo", "up-tempo", "hyper"]),
    genre: z.array(z.string()),
    energy: z.number(),
    instrumentalMood: z.array(z.string()),
  })
  .strict()

const lyricalProfileSchema = z
  .object({
    themes: z.array(z.string()),
    emotionalTone: z.array(z.string()),
    lyricMoodScore: z.number(),
    perspective: z.enum(["first-person", "third-person", "narrative", "abstract"]),
  })
  .strict()

const tsunkuGapSchema = z
  .object({
    score: z.number(),
    description: z.string(),
    musicalMoodScore: z.number(),
  })
  .strict()

export const songSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    titleReading: z.string(),
    releaseDate: z.string().regex(RELEASE_DATE_REGEX, "Expected YYYY-MM-DD"),
    releaseType: z.enum(["single", "album", "coupling", "other"]),
    memberEra: z.string(),
    spotifyId: z.string().nullable(),
    composer: composerSchema,
    musicalProfile: musicalProfileSchema,
    lyricalProfile: lyricalProfileSchema,
    tsunkuGap: tsunkuGapSchema.nullable(),
    moodTags: z.array(z.string()),
    situations: z.array(z.string()),
  })
  .strict()

export const songsArraySchema = z.array(songSchema)
