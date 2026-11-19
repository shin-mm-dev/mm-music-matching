## モーニング娘。サブスク楽曲レコメンド

モーニング娘。のシングル・アルバム曲・カップリング曲を含む全444曲を対象に、気分や曲調・シチュエーションに合わせて楽曲を提案するNext.jsアプリです。

## ローカル起動

```bash
npm run dev
```

`http://localhost:3000` を開いて確認できます。

## リリース前チェック

```bash
npm run lint
npm test
npm run build
```

- `npm test`: 楽曲データ（`src/data/songs.json`）の形式・品質チェック（`npm run check:songs`）と推薦ロジックの自動テスト（`npm run test:recommend`）を実行します。
- ビルド済みの画面の簡易起動確認を行いたい場合は `npm run check:smoke` も利用できます。

## GitHub Pages デプロイ

このリポジトリは GitHub Actions で GitHub Pages へ自動デプロイする構成です。

### 1. GitHub側の設定（最初に1回だけ）

1. GitHubリポジトリの `Settings` を開く
2. `Pages` を開く
3. `Source` を `GitHub Actions` に設定して保存

### 2. 公開フロー

- `main` に push すると、`.github/workflows/deploy-pages.yml` が走って自動公開（Lint・データ検証・推薦テスト・静的ビルドが自動実行されます）
- 手動実行したいときは `Actions` タブから `Deploy GitHub Pages` を `Run workflow`

### 3. 公開URL

- 通常: `https://<GitHubユーザー名>.github.io/<リポジトリ名>/`
- 本番: `https://shin-mm-dev.github.io/mm-music-matching/`
