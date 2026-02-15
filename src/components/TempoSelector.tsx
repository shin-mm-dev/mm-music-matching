"use client"

type TempoPreference = "ballad" | "up-tempo" | "any"

const TEMPO_OPTIONS: { value: TempoPreference; label: string; emoji: string }[] = [
  { value: "up-tempo", label: "アップテンポ", emoji: "⚡" },
  { value: "ballad", label: "バラード", emoji: "🎵" },
  { value: "any", label: "どちらでも", emoji: "🎶" },
]

interface TempoSelectorProps {
  selected: TempoPreference | undefined
  onChange: (tempo: TempoPreference) => void
}

export function TempoSelector({ selected, onChange }: TempoSelectorProps) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        どんな曲調がいい？
        <span className="text-sm font-normal text-gray-500 ml-2">（任意）</span>
      </h2>
      <div className="flex gap-2">
        {TEMPO_OPTIONS.map(({ value, label, emoji }) => {
          const isSelected = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 flex-1
                ${
                  isSelected
                    ? "bg-pink-500 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }
              `}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
