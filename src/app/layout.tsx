import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "モーニング娘。サブスク楽曲レコメンド",
  description:
    "あなたの気分にぴったりのモーニング娘。の楽曲を見つけよう。つんく♂が生み出す音楽と歌詞のギャップを活かした、ユニークなレコメンデーション。",
  openGraph: {
    title: "モーニング娘。サブスク楽曲レコメンド",
    description: "気分に合ったモーニング娘。の楽曲をレコメンド",
    type: "website",
    locale: "ja_JP",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
