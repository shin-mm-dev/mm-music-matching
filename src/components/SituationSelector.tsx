"use client"

const SITUATION_OPTIONS = [
  { value: "通勤", emoji: "🚃" },
  { value: "ワークアウト", emoji: "🏋️" },
  { value: "寝る前", emoji: "🌙" },
  { value: "作業中", emoji: "💻" },
  { value: "友達と", emoji: "👯" },
  { value: "カラオケ", emoji: "🎤" },
  { value: "夜ひとりで", emoji: "🌃" },
  { value: "雨の日", emoji: "🌧️" },
] as const

interface SituationSelectorProps {
  selected: string | undefined
  onChange: (situation: string | undefined) => void
}

export function SituationSelector({ selected, onChange }: SituationSelectorProps) {
  const toggle = (value: string) => {
    onChange(selected === value ? undefined : value)
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        今の状況は？
        <span className="text-sm font-normal text-gray-500 ml-2">（任意）</span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {SITUATION_OPTIONS.map(({ value, emoji }) => {
          const isSelected = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] sm:text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${
                  isSelected
                    ? "bg-pink-500 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }
              `}
            >
              <span>{emoji}</span>
              <span className="whitespace-nowrap">{value}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
