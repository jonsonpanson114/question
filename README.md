# 問いの道場 (Toi no Dojo)

フォローアップクエスチョンを磨く、静かな練習の場。Web Push通知機能付きのNext.jsアプリケーション。

## 🎯 特徴

- **4つの練習モード**: 日常雑談、仕事の1on1、自己内省、読書振り返り
- **AIフィードバック**: Gemini APIを使った質問の評価と改善提案
- **PWA対応**: オフラインでも動作するプログレッシブウェブアプリ
- **プッシュ通知**: 毎日の朝・夜に練習リマインダー通知を送信
- **継続記録**: 稽古の回数や連続記録（ストリーク）を可視化

## 🚀 クイックスタート

### 環境セットアップ

```bash
# 依存関係をインストール
npm install

# 環境変数を設定（.env.localファイルを作成）
cp .env.example .env.local
```

### 環境変数の設定

`.env.local`ファイルを編集して、以下の環境変数を設定：

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Security Keys
CRON_SECRET=your_generated_random_secret
SETUP_KEY=your_generated_random_secret

# Neon Database
DATABASE_URL=your_neon_database_url
```

**📖 詳細なセットアップ手順**: [QUICKSTART.md](QUICKSTART.md) を参照してください。

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### データベースの初期化

1. [http://localhost:3000/setup-db](http://localhost:3000/setup-db) にアクセス
2. 「データベースを初期化する」ボタンをクリック

## 📱 プッシュ通知機能

このアプリにはWeb Push通知機能が実装されています：

- **朝・夜のリマインダー**: ユーザーが設定した時間に練習を促す通知
- **カスタマイズ可能**: 通知時間と有効/無効を設定可能
- **自動配信**: Vercel Cron Jobsで毎時チェックして送信
- **複数デバイス対応**: 複数のブラウザ/デバイスで通知を受信可能

詳細は [PUSH_NOTIFICATION_SETUP.md](PUSH_NOTIFICATION_SETUP.md) を参照してください。

## 🏗️ 技術スタック

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **React**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **AI**: [Google Gemini 2.5 Flash](https://ai.google.dev/)
- **Database**: [Neon Postgres](https://neon.tech/)
- **Push Notifications**: [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- **Deployment**: [Vercel](https://vercel.com/)

## 📁 プロジェクト構造

```
app/
├── api/                      # API Routes
│   ├── push/                # プッシュ通知API
│   ├── cron/                # Cron Jobs
│   └── dojo-*/              # 練習機能API
├── practice/                # 練習ページ
│   ├── [mode]/              # 各モードの練習画面
│   └── components/          # UIコンポーネント
├── _hooks/                  # React Hooks
└── layout.tsx               # ルートレイアウト
public/
├── sw.js                    # Service Worker
└── manifest.json            # PWA Manifest
```

## 🚀 デプロイ

### Vercelへのデプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel --prod
```

詳細なデプロイ手順は [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) を参照してください。

### 必要な環境変数（Vercel）

- `DATABASE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`
- `SETUP_KEY`
- `GEMINI_API_KEY`

## 📚 ドキュメント

- [QUICKSTART.md](QUICKSTART.md) - クイックスタートガイド
- [PUSH_NOTIFICATION_SETUP.md](PUSH_NOTIFICATION_SETUP.md) - プッシュ通知の詳細設定
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Vercelデプロイ手順
- [database-schema.sql](database-schema.sql) - データベーススキーマ

## 🧪 テスト

### プッシュ通知のテスト

1. 練習ページで通知設定アイコン（ベル）をクリック
2. 「通知を開始する」でプッシュ通知を購読
3. 「テスト通知を送信」で動作確認

### Cronジョブのテスト

VercelダッシュボードからCronジョブを手動実行して、通知が配信されることを確認します。

## 🔧 開発

### データベースマイグレーション

```bash
# 自動初期化（API経由）
curl -X POST http://localhost:3000/api/init-db

# または手動でNeon SQL Editorで実行
# database-schema.sql の内容をコピーして貼り付け
```

### VAPIDキーの生成

```bash
npx web-push generate-vapid-keys
```

## 📈 監視と管理

### データベースの確認

NeonコンソールからSQLを実行：

```sql
-- 購読者数の確認
SELECT COUNT(*) FROM push_subscriptions WHERE is_active = true;

-- 通知配信履歴
SELECT type, COUNT(*) FROM notification_history
GROUP BY type;
```

### Vercelのログ確認

1. Vercelダッシュボード →「Deployments」
2. デプロイを選択 →「View Logs」

## 🤝 貢献

バグ報告や機能要望は [GitHub Issues](https://github.com/your-repo/issues) まで。

## 📄 ライセンス

MIT

---

Built with [Next.js](https://nextjs.org/) and ❤️
