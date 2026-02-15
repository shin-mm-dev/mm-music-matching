import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ムスメの気分 — モーニング娘。楽曲レコメンド",
  description:
    "あなたの気分にぴったりのモーニング娘。の楽曲を見つけよう。つんく♂が生み出す音楽と歌詞のギャップを活かした、ユニークなレコメンデーション。",
  openGraph: {
    title: "ムスメの気分",
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
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
