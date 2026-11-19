"use client"

import { TEMPO_OPTIONS, type TempoPreference } from "@/constants/options"

interface TempoSelectorProps {
  selected: TempoPreference | undefined
  onChange: (tempo: TempoPreference | undefined) => void
}

export function TempoSelector({ selected, onChange }: TempoSelectorProps) {
  // 同じボタンをもう一度押した場合は選択を解除する
  const toggle = (value: TempoPreference) => {
    onChange(selected === value ? undefined : value)
  }

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
              onClick={() => toggle(value)}
              aria-pressed={isSelected}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] sm:text-sm font-medium whitespace-nowrap
                transition-all duration-200 flex-1
                ${
                  isSelected
                    ? "bg-pink-500 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }
              `}
            >
              <span>{emoji}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
