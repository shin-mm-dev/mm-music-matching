import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, it } from "node:test"
import { MOOD_OPTIONS } from "../src/constants/options"
import { recommendSongs } from "../src/lib/recommend"
import type { Song } from "../src/types/song"

const songs = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/data/songs.json"), "utf-8"),
) as Song[]

function assertDescendingScores(scores: readonly number[], context: string): void {
  for (let index = 0; index < scores.length - 1; index += 1) {
    assert.ok(
      scores[index] >= scores[index + 1],
      `${context}: 順位 ${index + 1} (${scores[index]}) < 順位 ${index + 2} (${scores[index + 1]}) でスコア順が逆転しています`,
    )
  }
}

function assertUniqueSpotifyIds(items: readonly { song: Song }[], context: string): void {
  const spotifyIds = items
    .map((item) => item.song.spotifyId)
    .filter((id): id is string => id !== null)
  assert.equal(
    new Set(spotifyIds).size,
    spotifyIds.length,
    `${context}: 同一の spotifyId が結果内に重複しています`,
  )
}

describe("recommendSongs", () => {
  it("全9ムード × 3テンポ × 10シード（270パターン）で常に10曲・スコア降順・重複なし・アルバム3〜5曲を満たす", () => {
    const tempos = ["up-tempo", "ballad", "any"] as const

    for (const { tag } of MOOD_OPTIONS) {
      for (const tempoPreference of tempos) {
        for (let seed = 0; seed < 10; seed += 1) {
          const context = `mood=${tag}, tempo=${tempoPreference}, seed=${seed}`
          const results = recommendSongs(
            { moodTags: [tag], tempoPreference },
            songs,
            { seed, exposureCounts: {} },
          )

          assert.equal(results.length, 10, `${context}: 件数が10曲ではありません`)
          assertDescendingScores(
            results.map((item) => item.score),
            context,
          )
          assertUniqueSpotifyIds(results, context)

          const albumCount = results.filter((item) => item.song.releaseType === "album").length
          assert.ok(
            albumCount >= 3 && albumCount <= 5,
            `${context}: アルバム曲数が範囲外です (${albumCount})`,
          )
        }
      }
    }
  })

  it("同じseedでは決定的に同じ結果を返し、異なるseedでは多様性が出る", () => {
    const first = recommendSongs(
      { moodTags: ["元気を出したい"], tempoPreference: "up-tempo" },
      songs,
      { seed: 42, exposureCounts: {} },
    )
    const second = recommendSongs(
      { moodTags: ["元気を出したい"], tempoPreference: "up-tempo" },
      songs,
      { seed: 42, exposureCounts: {} },
    )

    assert.deepEqual(
      first.map((item) => item.song.id),
      second.map((item) => item.song.id),
    )

    const uniqueIdsAcrossSeeds = new Set<string>()
    for (let seed = 0; seed < 10; seed += 1) {
      const results = recommendSongs(
        { moodTags: ["元気を出したい"], tempoPreference: "up-tempo" },
        songs,
        { seed, exposureCounts: {} },
      )
      for (const item of results) {
        uniqueIdsAcrossSeeds.add(item.song.id)
      }
    }
    assert.ok(uniqueIdsAcrossSeeds.size > 15, `多様性が不足しています (${uniqueIdsAcrossSeeds.size}曲)`)
  })

  it("同一Spotify IDを持つ重複ペア（通常時および発見枠発動時）が同時に選ばれない", () => {
    const duplicatePairs: readonly [string, string][] = [
      ["mm-063", "mm-397"],
      ["mm-066", "mm-398"],
      ["mm-118", "mm-439"],
    ]

    for (const [primaryId, albumId] of duplicatePairs) {
      const primarySong = songs.find((song) => song.id === primaryId)
      assert.ok(primarySong, `${primaryId} が見つかりません`)

      const exposure: Record<string, number> = {}
      for (const song of songs) {
        exposure[song.id] = 5
      }
      // アルバム側のみ未露出にして発見枠の誤選択を誘発させる
      exposure[albumId] = 0

      for (let seed = 0; seed < 15; seed += 1) {
        const results = recommendSongs(
          { moodTags: primarySong.moodTags.slice(0, 1), tempoPreference: "up-tempo" },
          songs,
          { seed, exposureCounts: exposure },
        )
        assert.equal(results.length, 10)
        assertUniqueSpotifyIds(results, `pair=${primaryId}/${albumId}, seed=${seed}`)
        assertDescendingScores(
          results.map((item) => item.score),
          `pair=${primaryId}/${albumId}, seed=${seed}`,
        )
      }
    }
  })

  it("全曲既露出の中で1曲だけ未露出のとき、発見枠として混ぜつつスコア降順と重複ゼロを保つ", () => {
    const exposureCounts: Record<string, number> = {}
    for (const song of songs) {
      exposureCounts[song.id] = 4
    }
    exposureCounts["mm-001"] = 0

    const results = recommendSongs(
      { moodTags: ["元気を出したい"], tempoPreference: "up-tempo" },
      songs,
      { seed: 1, exposureCounts },
    )

    assert.equal(results.length, 10)
    assertDescendingScores(
      results.map((item) => item.score),
      "exploration",
    )
    assertUniqueSpotifyIds(results, "exploration")
    assert.ok(
      results.some((item) => item.matchReasons.includes("発見枠")),
      "発見枠の理由タグが付与されていません",
    )
  })

  it("カップリング曲（coupling）もフォールバック計算で基礎点+5以上を得る", () => {
    const couplingSong = songs.find((song) => song.releaseType === "coupling")
    assert.ok(couplingSong, "coupling 曲が見つかりません")

    const results = recommendSongs(
      { moodTags: ["泣きたい"] },
      [couplingSong],
      { seed: 0 },
    )

    assert.equal(results.length, 1)
    assert.ok(results[0].score >= 5, `coupling のフォールバック基礎点が不足しています (${results[0].score})`)
  })

  it("アルバム曲が3曲未満の小規模リストや空moodTags・未知タグでも安全に動作する", () => {
    const singleSongs = songs.filter((song) => song.releaseType === "single").slice(0, 5)
    const oneAlbumSong = songs.filter((song) => song.releaseType === "album").slice(0, 1)
    const miniCatalog = [...singleSongs, ...oneAlbumSong]

    const miniResults = recommendSongs(
      { moodTags: ["元気を出したい"], tempoPreference: "any" },
      miniCatalog,
      { seed: 3, exposureCounts: {} },
    )
    assert.equal(miniResults.length, miniCatalog.length)
    assertDescendingScores(
      miniResults.map((item) => item.score),
      "miniCatalog",
    )

    const emptyMoodResults = recommendSongs({ moodTags: [] }, songs, { seed: 0 })
    assert.equal(emptyMoodResults.length, 10)
    assertUniqueSpotifyIds(emptyMoodResults, "emptyMood")

    const unknownMoodResults = recommendSongs(
      { moodTags: ["存在しないムード"], situation: "存在しない状況" },
      songs,
      { seed: 0 },
    )
    assert.equal(unknownMoodResults.length, 10)
    assertUniqueSpotifyIds(unknownMoodResults, "unknownMood")
  })
})
