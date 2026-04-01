/**
 * 「問いの道場」プッシュ通知スケジューラ
 * 
 * 使い方:
 * 1. https://script.google.com/ にアクセスし、新しいプロジェクトを作成します。
 * 2. このコードをエディタに貼り付けます。
 * 3. `VERCEL_APP_URL` と `CRON_SECRET` を適切に設定します。
 * 4. 「トリガー」（時計アイコン）で、朝（例: 7時〜8時）と夜（例: 21時〜22時）に 
 *    `checkAndSendMorningNotification` と `checkAndSendEveningNotification` 
 *    が実行されるように設定してください。
 */

const VERCEL_APP_URL = "https://question-one-theta.vercel.app"; // あなたのアプリのURL
const CRON_SECRET = "92bcbe56556f7763a71fccbcf8c4bacd4e3f38b6763ca3ba345e94c7234be333"; // Vercelの環境変数と一致させる

function sendPush(type) {
  const url = `${VERCEL_APP_URL}/api/push/send?type=${type}`;
  const options = {
    method: "post",
    headers: {
      "Authorization": `Bearer ${CRON_SECRET}`,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`Type: ${type}, Status: ${response.getResponseCode()}, Body: ${response.getContentText()}`);
}

function checkAndSendMorningNotification() {
  sendPush("morning");
}

function checkAndSendEveningNotification() {
  sendPush("evening");
}
