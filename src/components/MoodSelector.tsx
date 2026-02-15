"use client"

const MOOD_OPTIONS = [
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

interface MoodSelectorProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  const toggle = (tag: string) => {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag]
    onChange(next)
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        今の気分は？
        <span className="text-sm font-normal text-gray-500 ml-2">
          （1〜3個選んでね）
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MOOD_OPTIONS.map(({ tag, emoji }) => {
          const isSelected = selected.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${
                  isSelected
                    ? "bg-pink-500 text-white shadow-md scale-[1.02]"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }
              `}
            >
              <span className="text-lg">{emoji}</span>
              <span>{tag}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
