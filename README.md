# ⚽ Soccer Stats Beta

リアルタイム試合統計記録アプリ。社会人サッカーや部活動マネージャー向けのシンプルな試合記録ツール。

## 機能

- ✅ リアルタイムタイマー（開始/一時停止）
- ✅ スコア入力（得点者・アシスト記録）
- ✅ スタッツ記録（シュート数、コーナーキック数）
- ✅ 試合履歴管理（ローカルストレージ）
- ✅ リアルタイム共有（URL共有で閲覧可能）
- ✅ 管理者/閲覧者モード分離

## 技術スタック

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Firebase (Firestore, Realtime Database)
- **Deployment**: Vercel

## セットアップ

### 前提条件
- Node.js 18+
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd soccer-stats-app

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

開発サーバーは http://localhost:3000 で起動します。

## デプロイ

### Vercel へのデプロイ

```bash
# Vercel CLI をインストール（初回のみ）
npm i -g vercel

# デプロイ実行
vercel
```

## 使い方

### 試合を記録する

1. トップページの「新しい試合を記録する」をクリック
2. 試合名、自チーム名、相手チーム名を入力
3. 「KICK OFF」で試合開始
4. タイマー、スコア、スタッツを記録

### 試合を共有する

1. 試合記録画面の「URLをコピー」ボタン
2. クリップボードのURLをLINEやメールで共有
3. 相手が同じURLにアクセスすると、リアルタイムで更新内容が反映されます

## ディレクトリ構成

```
soccer-stats-app/
├── app/                    # Next.js App Router
│   ├── layout.js          # ルートレイアウト
│   ├── page.js            # トップページ
│   ├── globals.css        # グローバルスタイル
│   ├── setup/
│   │   └── page.js        # 試合設定画面
│   └── match/[id]/
│       └── page.js        # 試合記録画面
├── components/            # React コンポーネント
│   └── GoalModal.js       # 得点入力モーダル
├── lib/
│   ├── firebase.js        # Firebase 設定
│   └── utils.js           # ユーティリティ関数
├── public/                # 静的ファイル
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## API リファレンス

### Firestore スキーマ

**matches コレクション**

```json
{
  "matchId": "string",
  "createdAt": "timestamp",
  "title": "string",
  "teamA": "string",
  "teamB": "string",
  "scoreA": "number",
  "scoreB": "number",
  "stats": {
    "teamA_shoot": "number",
    "teamA_ck": "number",
    "teamB_shoot": "number",
    "teamB_ck": "number"
  },
  "timer": {
    "startTime": "number",
    "pausedAt": "number | null",
    "elapsedSeconds": "number"
  },
  "goals": [
    {
      "time": "string",
      "team": "A | B",
      "scorer": "string",
      "assist": "string"
    }
  ]
}
```

## ブラウザ対応

- Chrome (推奨)
- Safari
- Firefox
- Edge
- モバイルブラウザ (iOS Safari, Chrome Android)

## ライセンス

MIT

## 問い合わせ

バグ報告や機能リクエストはGitHubのIssuesでお願いします。
