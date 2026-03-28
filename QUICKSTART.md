# 🚀 問いの道場 - クイックスタートガイド

プッシュ通知機能を含む「問いの道場」アプリを素早くセットアップするための手順です。

## ⏱️ 全体の流れ（約10分）

1. **Neonデータベースの作成** (3分)
2. **環境変数の設定** (2分)
3. **データベースの初期化** (1分)
4. **Vercelへのデプロイ** (4分)

---

## ステップ1: Neonデータベースの作成 (3分)

### 1. アカウント作成
1. [console.neon.tech](https://console.neon.tech/) にアクセス
2. 「Sign Up」で無料アカウントを作成

### 2. プロジェクト作成
1. 「Create a project」をクリック
2. プロジェクト名: `dojo-notifications`（任意）
3. リージョン: `Asia East (Tokyo)` または最も近いリージョン
4. 「Create Project」をクリック

### 3. 接続文字列の取得
1. 作成したプロジェクトを開く
2. 「Connection Details」タブをクリック
3. 「Connection string」をコピー
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dojo?sslmode=require
   ```

---

## ステップ2: 環境変数の設定 (2分)

### `.env.local`ファイルを編集

`.env.local`ファイルの`DATABASE_URL`を、Neonからコピーした接続文字列に置き換え：

```env
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dojo?sslmode=require
```

### 確認
他の環境変数が正しく設定されていることを確認：

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PRIVATE_KEY=u_8ag6szbtmuJPH9wSPgdIUeN68-vG0T873Tzn_cJPI
CRON_SECRET=92bcbe56556f7763a71fccbcf8c4bacd4e3f38b6763ca3ba345e94c7234be333
SETUP_KEY=8a9b3973493187d07796c1bbb2571f8d1203780d07fbcb288471d5a24ef81bb7
```

---

## ステップ3: データベースの初期化 (1分)

### ローカル開発環境

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/setup-db` にアクセス

3. 「データベースを初期化する」ボタンをクリック

4. すべてのテーブルが作成されたことを確認

### または、Neon SQL Editorで直接実行

1. Neonコンソール →「SQL Editor」をクリック
2. [database-schema.sql](database-schema.sql) の内容をコピーして貼り付け
3. 「Run」をクリック

---

## ステップ4: Vercelへのデプロイ (4分)

### 1. Vercelプロジェクトの作成

1. [vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」または「Log In」
3. 「Add New Project」→ GitHubリポジトリをインポート

### 2. 環境変数の設定

Vercelプロジェクトの「Settings」→「Environment Variables」で以下を追加：

| 名前 | 値 |
|------|---|
| `DATABASE_URL` | Neonの接続文字列 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo` |
| `VAPID_PUBLIC_KEY` | `BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo` |
| `VAPID_PRIVATE_KEY` | `u_8ag6szbtmuJPH9wSPgdIUeN68-vG0T873Tzn_cJPI` |
| `CRON_SECRET` | `92bcbe56556f7763a71fccbcf8c4bacd4e3f38b6763ca3ba345e94c7234be333` |
| `SETUP_KEY` | `8a9b3973493187d07796c1bbb2571f8d1203780d07fbcb288471d5a24ef81bb7` |
| `GEMINI_API_KEY` | `AIzaSyDUOtbzeeQeie2WGVgpS0hX4cDJZpOqtAA` |

**重要**: すべての環境変数を `Production`、`Preview`、`Development` のすべてに適用（「All」を選択）

### 3. デプロイ実行

1. 「Deployments」タブ→「Redeploy」
2. デプロイ完了を待つ（2-3分）

### 4. 本番環境のデータベース初期化

1. `https://your-app.vercel.app/setup-db` にアクセス
2. 「データベースを初期化する」をクリック

---

## ✅ 動作確認

### プッシュ通知のテスト

1. `https://your-app.vercel.app/practice` にアクセス
2. 右上のベルアイコン 🔔 をクリック
3. 「通知を開始する」ボタンをクリック
4. ブラウザの通知許可ダイアログで「許可」を選択
5. 「テスト通知を送信」をクリック
6. 通知が届くことを確認 ✅

### Cronジョブの確認

1. Vercelダッシュボード →「Settings」→「Cron Jobs」
2. `/api/cron/daily-reminders` が登録されていることを確認
3. 「Test」ボタンで手動実行も可能

---

## 📚 詳細ドキュメント

- [プッシュ通知機能の詳細](PUSH_NOTIFICATION_SETUP.md)
- [Vercelデプロイの詳細](VERCEL_DEPLOYMENT.md)
- [データベーススキーマ](database-schema.sql)

---

## 🆘 トラブルシューティング

### 「DATABASE_URL not configured」エラー

**原因**: `.env.local`ファイルの`DATABASE_URL`が正しく設定されていない

**解決策**:
1. `.env.local`ファイルを開く
2. `DATABASE_URL`をNeonの接続文字列に置き換え
3. 開発サーバーを再起動

### 通知が届かない

**原因**: 複数の可能性（Service Worker未登録、権限未設定、Cronジョブ未実行など）

**解決策**:
1. `chrome://serviceworker-internals/` でService Workerを確認
2. ブラウザの通知設定を確認（設定 → サイト設定 → 通知）
3. VercelのCronジョブログを確認

### Cronジョブが失敗する

**原因**: `CRON_SECRET`が正しく設定されていない

**解決策**:
1. Vercelの環境変数で`CRON_SECRET`を確認
2. `.env.local`と同じ値であることを確認
3. Cronジョブを再デプロイ

---

## 🔗 役立つリンク

- **Neonコンソール**: https://console.neon.tech/
- **Vercelダッシュボード**: https://vercel.com/dashboard
- **Neonドキュメント**: https://neon.tech/docs
- **Vercelドキュメント**: https://vercel.com/docs

---

## 🎉 セットアップ完了！

おめでとうございます！これで「問いの道場」アプリにプッシュ通知機能が実装されました。

ユーザーは朝・夜の設定時間に練習リマインダーを受け取れるようになります。

---

**お困りの際は**: 各詳細ドキュメントを参照するか、開発者にお問い合わせください。
