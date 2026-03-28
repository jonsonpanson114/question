# プッシュ通知機能セットアップガイド

このガイドでは、「問いの道場」アプリに実装したWeb Push通知機能のセットアップ手順を説明します。

## 🎯 機能概要

- 毎日の朝・夜に練習リマインダー通知を送信
- ユーザーは通知時間をカスタマイズ可能
- Vercel Cron Jobsで自動配信
- Neonデータベースで購読情報を管理

## 📋 前提条件

- Vercelアカウント（無料プランでOK）
- Neonアカウント（無料プランでOK）
- Node.js 18+ がインストールされていること

## 🚀 セットアップ手順

### ステップ1: Neonデータベースの作成

1. [console.neon.tech](https://console.neon.tech/) にアクセス
2. サインアップまたはログイン
3. 「Create a project」をクリック
4. プロジェクト名を入力（例: `dojo-notifications`）
5. リージョンを選択（推奨: `Asia East (Tokyo)` または最も近いリージョン）
6. 「Create Project」をクリック

### ステップ2: データベース接続文字列の取得

1. Neonコンソールで作成したプロジェクトを開く
2. 「Connection Details」タブをクリック
3. 「Connection string」をコピー
4. 形式: `postgresql://username:password@ep-xxx.region.aws.neon.tech/dojo?sslmode=require`

### ステップ3: 環境変数の設定

1. `.env.local`ファイルを開く
2. `DATABASE_URL`の値をNeonの接続文字列に置き換え：

```env
# Neon Database
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dojo?sslmode=require
```

3. その他の環境変数が正しく設定されていることを確認：

```env
# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PUBLIC_KEY=BGw3wx1wE1qM1JWpk26ACPZx6VUSMqdeSAuRzraXF-NDarJ-01GQPEIfHCWVUY4GqWE_MtS7NIxyPIIURoN9pIo
VAPID_PRIVATE_KEY=u_8ag6szbtmuJPH9wSPgdIUeN68-vG0T873Tzn_cJPI
CRON_SECRET=dojo-cron-secret-change-in-production
```

**重要**: `CRON_SECRET`は本番環境で必ず変更してください。ランダムな文字列を使用してください。

### ステップ4: データベースの初期化

開発環境でデータベーステーブルを作成するには：

```bash
npm run dev
```

アプリケーションが初回起動時にテーブルを自動作成します。または、以下の手動で作成することもできます：

```bash
# Node.jsスクリプトで初期化
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

sql\`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    keys TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP
  )
\`.then(() => console.log('Tables created successfully'));
"
```

### ステップ5: ローカルでのテスト

1. 開発サーバーを起動：

```bash
npm run dev
```

2. ブラウザで `http://localhost:3000/practice` を開く

3. 通知設定ボタン（ベルアイコン）をクリック

4. 「通知を開始する」ボタンをクリック

5. ブラウザが通知の許可を求めてくるので「許可」をクリック

6. 「テスト通知を送信」ボタンをクリックして、通知が届くことを確認

### ステップ6: Vercelへのデプロイ

1. Vercelプロジェクトのダッシュボードを開く
2. 「Settings」タブ →「Environment Variables」をクリック
3. 以下の環境変数を追加：

| 名前 | 値 | Environment |
|------|---|---|
| `DATABASE_URL` | Neonの接続文字列 | Production, Preview, Development |
| `VAPID_PUBLIC_KEY` | 生成した公開鍵 | All |
| `VAPID_PRIVATE_KEY` | 生成した秘密鍵 | All |
| `CRON_SECRET` | ランダムな秘密鍵 | All |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 生成した公開鍵 | All |

4. 「Deployments」タブで最新のデプロイをクリック
5. デプロイ完了後、アプリケーションを開いて通知機能をテスト

### ステップ7: Cron Jobsの確認

1. Vercelプロジェクトの「Settings」タブ →「Cron Jobs」をクリック
2. 以下のCronジョブが設定されていることを確認：

```
Path: /api/cron/daily-reminders
Schedule: 0 * * * * (毎時0分に実行)
```

3. 「Test」ボタンをクリックしてCronジョブをテスト

## 🔍 通知の動作仕組み

1. **購読フロー**:
   - ユーザーが「通知を開始する」をクリック
   - ブラウザが通知を許可
   - Service Workerがプッシュ購読を作成
   - 購読情報がNeonデータベースに保存

2. **通知配信フロー**:
   - Vercel Cron Jobsが毎時実行
   - `/api/cron/daily-reminders`エンドポイントが呼び出される
   - 現在の時刻（日本時間）に一致する設定を持つユーザーを取得
   - 該当するユーザーにプッシュ通知を送信

3. **通知受信**:
   - ブラウザがプッシュ通知を受信
   - Service Workerが通知を表示
   - ユーザーがクリックするとアプリが開く

## 🧪 テスト方法

### 手動テスト

1. 通知設定で朝・夜の時間を設定
2. 現在の時刻に合わせて設定し、「テスト通知を送信」をクリック
3. 通知が届くことを確認

### Cronジョブのテスト

1. VercelダッシュボードからCronジョブを手動実行
2. ログで実行結果を確認
3. 対象ユーザーに通知が届くことを確認

### 複数デバイスでのテスト

1. 複数のブラウザ/デバイスからアプリを開く
2. それぞれで通知を有効化
3. すべてのデバイスで通知が届くことを確認

## 🐅 トラブルシューティング

### 通知が届かない

1. ブラウザの通知設定を確認（設定 → サイト設定 → 通知）
2. Service Workerが登録されているか確認（`chrome://serviceworker-internals/`）
3. データベースに購読情報が保存されているか確認
4. Cronジョブが正常に実行されているか確認

### Cronジョブが失敗する

1. `CRON_SECRET`が正しく設定されているか確認
2. Vercelのログでエラーメッセージを確認
3. データベース接続が正常か確認

### データベースエラー

1. `DATABASE_URL`が正しく設定されているか確認
2. Neonプロジェクトがアクティブか確認
3. テーブルが作成されているか確認

## 📊 運用管理

### 通知の配信状況を確認する

Neonコンソールから以下のクエリを実行：

```sql
-- 配信した通知の統計
SELECT
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN delivered = true THEN 1 END) as delivered,
  COUNT(CASE WHEN delivered = false THEN 1 END) as failed
FROM notification_history
GROUP BY type;

-- 直近の配信履歴
SELECT * FROM notification_history
ORDER BY sent_at DESC
LIMIT 20;
```

### 購読者数を確認する

```sql
SELECT COUNT(*) as active_subscriptions
FROM push_subscriptions
WHERE is_active = true;
```

### 古い購読情報をクリーンアップ

```sql
-- 30日以上使用されていない購読を無効化
UPDATE push_subscriptions
SET is_active = false
WHERE last_used_at < NOW() - INTERVAL '30 days';
```

## 🔒 セキュリティのベストプラクティス

1. **CRON_SECRET**: 本番環境では強力なランダム文字列を使用
2. **VAPIDキー**: 秘密鍵は絶対に公開しない
3. **データベース**: NeonのSSL接続を使用
4. **エラーハンドリング**: エラーメッセージには機密情報を含めない

## 📝 変更履歴

- 2025-03-29: プッシュ通知機能を実装
- VAPIDキーを生成
- Neonデータベースを統合
- Vercel Cron Jobsを設定

---

お困りの際は、[GitHub Issues](https://github.com/your-repo/issues)までご連絡ください。
