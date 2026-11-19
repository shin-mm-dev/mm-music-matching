import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  MOOD_OPTIONS,
  SITUATION_OPTIONS,
  VALID_MOOD_TAGS,
  VALID_SITUATIONS,
} from "../src/constants/options"
import { songsArraySchema } from "../src/lib/song-schema"
import type { Song } from "../src/types/song"

const SONGS_FILE_PATH = resolve(process.cwd(), "src/data/songs.json")
const SPOTIFY_ID_REGEX = /^[A-Za-z0-9]{22}$/
const CREDIT_NOISE_REGEX =
  /https?:\/\/|\.com\b|\.net\b|\/\d+\/|-\s*Genius\b|\bBrainz\b|\bStore\b|歌\s*[:：]|M-\d+|更新日時|登録日時/i

function findCreditIssues(song: Song): string[] {
  const issues: string[] = []
  const fields = [
    ["lyricist", song.composer.lyricist],
    ["composer", song.composer.composer],
    ["arranger", song.composer.arranger],
  ] as const

  for (const [label, rawValue] of fields) {
    const value = rawValue.trim()
    if (value.length === 0) {
      issues.push(`${song.id} (${song.title}): ${label} が空です`)
      continue
    }
    if (value === "不明") {
      continue
    }
    if (/^[:：,]/.test(value)) {
      issues.push(`${song.id} (${song.title}): ${label} 先頭に記号が残っています (${value})`)
    }
    if (value.length <= 1) {
      issues.push(`${song.id} (${song.title}): ${label} が1文字ゴミです (${value})`)
    }
    if (value.length > 30) {
      issues.push(`${song.id} (${song.title}): ${label} が長すぎます (${value.length}文字: ${value})`)
    }
    if (CREDIT_NOISE_REGEX.test(value)) {
      issues.push(`${song.id} (${song.title}): ${label} にノイズが混入しています (${value})`)
    }
  }

  return issues
}

async function main(): Promise<void> {
  const rawJson = await readFile(SONGS_FILE_PATH, "utf-8")
  const parsedJson = JSON.parse(rawJson) as unknown

  const schemaResult = songsArraySchema.safeParse(parsedJson)
  if (!schemaResult.success) {
    console.error(`[check:songs] スキーマ検証に失敗しました (${schemaResult.error.issues.length}件):`)
    for (const issue of schemaResult.error.issues.slice(0, 20)) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
    }
    process.exit(1)
  }

  const songs: Song[] = schemaResult.data
  const errors: string[] = []
  const seenIds = new Set<string>()
  const moodCoverage = new Map<string, number>(
    MOOD_OPTIONS.map((option) => [option.tag, 0]),
  )
  const situationCoverage = new Map<string, number>(
    SITUATION_OPTIONS.map((option) => [option.value, 0]),
  )

  for (const song of songs) {
    // IDの一意性チェック
    if (seenIds.has(song.id)) {
      errors.push(`${song.id} (${song.title}): 曲IDが重複しています`)
    }
    seenIds.add(song.id)

    // Spotify ID形式チェック
    if (!song.spotifyId || !SPOTIFY_ID_REGEX.test(song.spotifyId)) {
      errors.push(`${song.id} (${song.title}): spotifyId が不正または欠損しています (${song.spotifyId})`)
    }

    // ムード・状況タグのホワイトリスト検証とカバレッジ集計
    if (song.moodTags.length === 0) {
      errors.push(`${song.id} (${song.title}): moodTags が空です`)
    }
    for (const tag of song.moodTags) {
      if (!VALID_MOOD_TAGS.has(tag)) {
        errors.push(`${song.id} (${song.title}): 未定義の moodTag が含まれています (${tag})`)
      } else {
        moodCoverage.set(tag, (moodCoverage.get(tag) ?? 0) + 1)
      }
    }

    for (const situation of song.situations) {
      if (!VALID_SITUATIONS.has(situation)) {
        errors.push(`${song.id} (${song.title}): 未定義の situation が含まれています (${situation})`)
      } else {
        situationCoverage.set(situation, (situationCoverage.get(situation) ?? 0) + 1)
      }
    }

    // テンポと気分の矛盾チェック
    const tempo = song.musicalProfile.tempo
    if ((tempo === "up-tempo" || tempo === "hyper") && song.moodTags.includes("落ち着きたい")) {
      errors.push(`${song.id} (${song.title}): ${tempo} 曲に「落ち着きたい」が付与されています`)
    }
    if (tempo === "hyper" && song.moodTags.includes("泣きたい")) {
      errors.push(`${song.id} (${song.title}): hyper 曲に「泣きたい」が付与されています`)
    }
    if (
      tempo === "ballad" &&
      (song.moodTags.includes("テンション上げたい") || song.moodTags.includes("踊りたい"))
    ) {
      errors.push(`${song.id} (${song.title}): ballad 曲に高揚/ダンス系タグが付与されています`)
    }

    // クレジット品質チェック
    errors.push(...findCreditIssues(song))
  }

  for (const [tag, count] of moodCoverage) {
    if (count === 0) {
      errors.push(`ムード「${tag}」に一致する曲が0曲です`)
    }
  }
  for (const [situation, count] of situationCoverage) {
    if (count === 0) {
      errors.push(`状況「${situation}」に一致する曲が0曲です`)
    }
  }

  if (errors.length > 0) {
    console.error(`[check:songs] ${errors.length}件のデータ不整合が見つかりました:`)
    for (const error of errors.slice(0, 30)) {
      console.error(`  - ${error}`)
    }
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        totalSongs: songs.length,
        moodCoverage: Object.fromEntries(moodCoverage),
        situationCoverage: Object.fromEntries(situationCoverage),
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
