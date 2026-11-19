// 画面と推薦テストで共有する選択肢とURLパラメータの検証ルール

export const MOOD_OPTIONS = [
  { tag: "元気を出したい", emoji: "💪" },
  { tag: "落ち着きたい", emoji: "🍵" },
  { tag: "泣きたい", emoji: "🥹" },
  { tag: "恋してる", emoji: "💕" },
  { tag: "強くなりたい", emoji: "🔥" },
  { tag: "懐かしい気持ち", emoji: "🌅" },
  { tag: "何も考えたくない", emoji: "☁️" },
  { tag: "テンション上げたい", emoji: "🎉" },
  { tag: "踊りたい", emoji: "💃" },
] as const

export const MAX_MOOD_SELECTION = 3

export type TempoPreference = "ballad" | "up-tempo" | "any"

export const TEMPO_OPTIONS: readonly {
  value: TempoPreference
  label: string
  emoji: string
}[] = [
  { value: "up-tempo", label: "アップテンポ", emoji: "⚡" },
  { value: "ballad", label: "バラード", emoji: "🎵" },
  { value: "any", label: "どちらでも", emoji: "🎶" },
]

export const SITUATION_OPTIONS = [
  { value: "通勤", emoji: "🚃" },
  { value: "ワークアウト", emoji: "🏋️" },
  { value: "寝る前", emoji: "🌙" },
  { value: "作業中", emoji: "💻" },
  { value: "友達と", emoji: "👯" },
  { value: "カラオケ", emoji: "🎤" },
  { value: "夜ひとりで", emoji: "🌃" },
  { value: "雨の日", emoji: "🌧️" },
] as const

export const VALID_MOOD_TAGS: ReadonlySet<string> = new Set(
  MOOD_OPTIONS.map((option) => option.tag),
)

export const VALID_SITUATIONS: ReadonlySet<string> = new Set(
  SITUATION_OPTIONS.map((option) => option.value),
)

const TEMPO_LABELS: Record<TempoPreference, string> = {
  "up-tempo": "アップテンポ",
  ballad: "バラード",
  any: "どちらでも",
}

// 内部コード用の曲調名（up-tempo 等）を画面表示用の日本語ラベルへ変換する
export function getTempoLabel(tempo: TempoPreference): string {
  return TEMPO_LABELS[tempo]
}

// URLの ?moods=... から有効な気分タグだけを重複なく最大3件取り出す
export function parseMoodTagsParam(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => VALID_MOOD_TAGS.has(tag)),
    ),
  ].slice(0, MAX_MOOD_SELECTION)
}

// URLの ?tempo=... が想定された3種類の値いずれかか検証して返す
export function parseTempoParam(raw: string | null): TempoPreference | undefined {
  if (raw === "ballad" || raw === "up-tempo" || raw === "any") {
    return raw
  }
  return undefined
}

// URLの ?situation=... が定義済みの状況タグかどうか検証して返す
export function parseSituationParam(raw: string | null): string | undefined {
  if (raw && VALID_SITUATIONS.has(raw)) {
    return raw
  }
  return undefined
}
