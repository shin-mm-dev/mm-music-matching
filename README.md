## モーニング娘。サブスク楽曲レコメンド

モーニング娘。シングル119曲を対象に、気分に合わせて楽曲を提案するNext.jsアプリです。

## ローカル起動

```bash
npm run dev
```

`http://localhost:3000` を開いて確認できます。

## リリース前チェック

```bash
npm run check:data-quality
npm run lint
npm run build
npm run check:smoke
```

## GitHub Pages デプロイ

このリポジトリは GitHub Actions で GitHub Pages へ自動デプロイする構成です。

### 1. GitHub側の設定（最初に1回だけ）

1. GitHubリポジトリの `Settings` を開く
2. `Pages` を開く
3. `Source` を `GitHub Actions` に設定して保存

### 2. 公開フロー

- `main` に push すると、`.github/workflows/deploy-pages.yml` が走って自動公開
- 手動実行したいときは `Actions` タブから `Deploy GitHub Pages` を `Run workflow`

### 3. 公開URL

- 通常: `https://<GitHubユーザー名>.github.io/<リポジトリ名>/`
- 例: `https://shin-mm-dev.github.io/musume-mood/`
