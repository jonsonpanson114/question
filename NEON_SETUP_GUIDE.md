# 🔧 Neonプロジェクト設定ガイド

プロジェクト: cold-pond-68242194
https://console.neon.tech/app/projects/cold-pond-68242194

## ステップ1: 新しいデータベースを作成（30秒）

### 手順:
1. 上記URLをクリックしてNeonコンソールを開く
2. 左側メニューから**「SQL Editor」**をクリック
3. 以下のSQLコマンドをコピーして貼り付け：

```sql
CREATE DATABASE dojo;
```

4. **「Run」**ボタンをクリック
5. 「Database 'dojo' created successfully」と表示されたらOK

---

## ステップ2: 接続文字列を取得（30秒）

### 手順:
1. 左側メニューから**「Connection Details」**をクリック
2. 「Connection string」を探す
3. 接続文字列の最後の部分を `/dojo` に変更

**例:**
```
変更前:
postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require

変更後:
postgresql://username:password@ep-xxx.aws.neon.tech/dojo?sslmode=require
                                                  ^^^^^^^^^^^^
                                            ここを「dojo」に変更
```

4. **「Copy」**ボタンをクリックしてコピー

---

## ステップ3: .env.local を更新（10秒）

### 手順:
1. エディタで `.env.local` ファイルを開く
2. `DATABASE_URL=...` の行全体を、コピーした接続文字列に置き換え

```env
# これをコピーした接続文字列に置き換え
DATABASE_URL=postgresql://username:password@ep-xxx.aws.neon.tech/dojo?sslmode=require
```

3. ファイルを保存

---

## ステップ4: データベースを初期化（1分）

### 手順:
```bash
# 1. 開発サーバーを起動（まだの場合）
npm run dev

# 2. ブラウザで以下を開く
# http://localhost:3000/setup-db

# 3. 「データベースを初期化する」ボタンをクリック

# 4. 以下のメッセージが表示されることを確認:
# ✓ push_subscriptions table created
# ✓ notification_preferences table created
# ✓ notification_history table created
# ✓ Index idx_push_subscriptions_active created
# ✓ Index idx_notification_preferences_subscription created
# ✓ Index idx_notification_history_subscription created
# ✓ Index idx_notification_history_sent_at created
```

---

## ステップ5: プッシュ通知をテスト（1分）

### 手順:
```bash
# 1. 練習ページを開く
# http://localhost:3000/practice

# 2. どれかのモードを選択（例：日常雑談）

# 3. 右上のベルアイコン 🔔 をクリック

# 4. 「通知を開始する」ボタンをクリック

# 5. ブラウザが通知の許可を求めてくるので「許可」をクリック

# 6. 「テスト通知を送信」ボタンをクリック

# 7. 通知が届くことを確認
```

---

## ✅ 完了！

これで設定完了です！お疲れ様でした。

---

## 🔍 トラブルシューティング

### 「Database 'dojo' already exists」と表示された場合
→ 既にデータベースが作成されています。「ステップ2」に進んでください。

### 接続文字列が見つからない場合
→ 「Connection Details」タブで「Connection string」という項目を探してください。

### 通知が届かない場合
→ 開発サーバーが起動しているか確認してください（`npm run dev`）

---

## 📊 確認方法

Neonコンソールでデータベースが作成されたことを確認：

```sql
-- Neon SQL Editorで実行
SELECT datname FROM pg_database WHERE datname = 'dojo';
```

結果に `dojo` が表示されればOKです。
