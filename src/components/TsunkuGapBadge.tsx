interface TsunkuGapBadgeProps {
  tsunkuGap: {
    score: number
    description: string
    musicalMoodScore: number
  }
}

export function TsunkuGapBadge({ tsunkuGap }: TsunkuGapBadgeProps) {
  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">✨</span>
        <span className="text-xs font-bold text-amber-800">
          つんく♂ギャップ度: {tsunkuGap.score}/10
        </span>
      </div>
      <p className="text-xs text-amber-700 leading-relaxed">
        {tsunkuGap.description}
      </p>
    </div>
  )
}
