import type { ScoredSong } from "@/types/song"

interface SongCardProps {
  scoredSong: ScoredSong
  rank: number
}

export function SongCard({ scoredSong, rank }: SongCardProps) {
  const { song, matchReasons } = scoredSong
  const releaseYear = song.releaseDate.slice(0, 4)
  const spotifyUrl = song.spotifyId
    ? `https://open.spotify.com/track/${song.spotifyId}`
    : null
  const spotifyEmbedUrl = song.spotifyId
    ? `https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator`
    : null
  const credits = [
    { label: "作詞", value: song.composer.lyricist },
    { label: "作曲", value: song.composer.composer },
    { label: "編曲", value: song.composer.arranger },
  ].filter((credit) => credit.value && credit.value !== "不明")

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {song.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {releaseYear}年 ・ {song.memberEra} ・ {song.musicalProfile.tempo === "ballad" ? "バラード" : song.musicalProfile.tempo === "mid-tempo" ? "ミッドテンポ" : "アップテンポ"}
          </p>
        </div>
      </div>

      {matchReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchReasons.map((reason) => (
            <span
              key={reason}
              className="inline-block px-2.5 py-1 bg-pink-50 text-pink-700 text-xs rounded-full font-medium"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {credits.length > 0 && (
        <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="space-y-1">
            {credits.map((credit) => (
              <p key={credit.label} className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">{credit.label}:</span>{" "}
                {credit.value}
              </p>
            ))}
          </div>
        </div>
      )}

      {spotifyEmbedUrl && (
        <div className="mt-4">
          <iframe
            title={`${song.title} Spotify Player`}
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            style={{ border: 0 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {spotifyUrl && (
        <div className="mt-3">
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1DB954] text-white text-sm font-medium rounded-full hover:bg-[#1ed760] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Spotifyで聴く
          </a>
        </div>
      )}
    </div>
  )
}
