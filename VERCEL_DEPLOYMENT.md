# Vercel デプロイガイド

このガイドでは、問いの道場アプリをVercelにデプロイする手順を説明します。

## 📋 デプロイ前のチェックリスト

- [ ] Neonデータベースアカウントを作成
- [ ] Neonプロジェクトを作成し、接続文字列を取得
- [ ] GitHubリポジトリにコードをプッシュ
- [ ] `.env.local`ファイルの環境変数を設定済み

## 🚀 デプロイ手順

### ステップ1: Vercelプロジェクトの作成

1. [vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」または「Log In」
3. 「Add New Project」をクリック
4. GitHubリポジトリをインポート（または「Git Integration」で連携）
5. プロジェクト名を入力（例: `toi-no-dojo`）
6. Framework Presetで「Next.js」を選択
7. 「Create」をクリック

### ステップ2: 環境変数の設定

プロジェクト設定ページで：

1. 「Settings」タブ →「Environment Variables」をクリック
2. 以下の環境変数を追加：

| 名前 | 値 | Environment |
|------|---|---|
| `DATABASE_URL` | Neonの接続文字列 | **All** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID公開鍵 | **All** |
| `VAPID_PUBLIC_KEY` | VAPID公開鍵 | **All** |
| `VAPID_PRIVATE_KEY` | VAPID秘密鍵 | **All** |
| `CRON_SECRET` | ランダムなシークレット | **All** |
| `SETUP_KEY` | ランダムなシークレット | **All** |
| `GEMINI_API_KEY` | Gemini APIキー | **All** |

**重要**:
- すべての環境変数を `Production`、`Preview`、`Development` のすべてに適用
- `Environment`カラムで「All」を選択

### ステップ3: 環境変数の具体的な値

**現在のプロジェクトの値:**

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dojo?sslmode=require
```
- Neonコンソールから取得した接続文字列に置き換えてください

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PRIVATE_KEY=u_8ag6szbtmuJPH9wSPgdIUeN68-vG0T873Tzn_cJPI
```
- 既に生成されたキー（このまま使用可）

```bash
CRON_SECRET=92bcbe56556f7763a71fccbcf8c4bacd4e3f38b6763ca3ba345e94c7234be333
SETUP_KEY=8a9b3973493187d07796c1bbb2571f8d1203780d07fbcb288471d5a24ef81bb7
```
- 生成されたシークレットキー（このまま使用可）

```bash
GEMINI_API_KEY=AIzaSyDUOtbzeeQeie2WGVgpS0hX4cDJZpOqtAA
```
- 既存のGemini APIキー

### ステップ4: デプロイ実行

1. 環境変数を保存した後、「Deployments」タブに移動
2. 最新のデプロイをクリック
3. 「Redeploy」をクリックして再デプロイ
4. デプロイが完了するまで待機（通常2-3分）

### ステップ5: データベースの初期化

1. デプロイ完了後、`https://your-app.vercel.app/setup-db` にアクセス
2. 以下の情報を確認：
   - Database URLが「configured」になっていること
   - テーブルが未作成（「未初期化」）になっていること
3. 「データベースを初期化する」ボタンをクリック
4. 全てのテーブルが作成されたことを確認

**注意**: 初期化が完了したら、Vercelの環境変数から`SETUP_KEY`を削除することを推奨します。

### ステップ6: Cron Jobsの確認

1. Vercelプロジェクトの「Settings」→「Cron Jobs」を確認
2. 以下のCronジョブが登録されているはず：

```
Path: /api/cron/daily-reminders
Schedule: 0 * * * *
```

3. 「Test」ボタンをクリックしてCronジョブをテスト

### ステップ7: プッシュ通知のテスト

1. `https://your-app.vercel.app/practice` にアクセス
2. 右上のベルアイコンをクリック
3. 「通知を開始する」ボタンをクリック
4. ブラウザの通知許可を求められたら「許可」を選択
5. 「テスト通知を送信」をクリック
6. 通知が届くことを確認

## 🔧 Vercel CLIを使ったデプロイ

ローカルからデプロイする場合：

```bash
# Vercel CLIのインストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel --prod

# 環境変数を設定
vercel env add DATABASE_URL
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add SETUP_KEY
vercel env add GEMINI_API_KEY
```

## 📊 デプロイ後の管理

### 環境変数の更新

1. Vercelダッシュボード →「Settings」→「Environment Variables」
2. 更新したい変数を編集
3. 「Redeploy」で再デプロイ

### ログの確認

1. 「Deployments」タブ
2. デプロイを選択
3. 「View Logs」でログを確認

### Cron Jobsの確認

1. 「Settings」→「Cron Jobs」
2. 各ジョブの実行履歴を確認
3. 「Test」で手動実行も可能

### データベースの確認

1. Neonコンソールにアクセス
2. 「SQL Editor」でクエリを実行：

```sql
-- 購読者数の確認
SELECT COUNT(*) as total_subscriptions
FROM push_subscriptions
WHERE is_active = true;

-- 通知配信履歴
SELECT type, COUNT(*) as count,
       COUNT(CASE WHEN delivered = true THEN 1 END) as delivered
FROM notification_history
GROUP BY type;
```

## 🐅 トラブルシューティング

### デプロイが失敗する

1. ビルドログを確認
2. 環境変数が正しく設定されているか確認
3. Node.jsのバージョンを確認（18.x以上推奨）

### データベース接続エラー

1. `DATABASE_URL`が正しいか確認
2. Neonプロジェクトがアクティブか確認
3. IP制限がかかっていないか確認

### プッシュ通知が動作しない

1. Service Workerが登録されているか確認
2. VAPIDキーが正しく設定されているか確認
3. ブラウザの通知設定を確認
4. Cronジョブが実行されているか確認

## 🔒 セキュリティのベストプラクティス

1. **環境変数の保護**: `.env.local`を`.gitignore`に追加済み
2. **シークレットキーの定期更新**: 定期的に更新を推奨
3. **SETUP_KEYの削除**: データベース初期化後は削除を推奨
4. **Cronジョブの保護**: `CRON_SECRET`で保護済み

## 📈 パフォーマンスの監視

Vercel Analyticsを有効にする：

1. プロジェクト設定→「Analytics」
2. 「Enable Analytics」をクリック
3. 無料でアクセス解析、パフォーマンス監視が可能

## 🔄 継続的デプロイ

GitHubにプッシュするたびに自動デプロイ：

- `main`ブランチにプッシュ → Productionデプロイ
- その他のブランチにプッシュ → Previewデプロイ

ブランチ設定は「Settings」→「Git」で変更可能。

---

お困りの際は、[Vercelドキュメント](https://vercel.com/docs)または[Neonドキュメント](https://neon.tech/docs)を参照してください。
