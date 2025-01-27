# Feedback-Bot-CF  

<p style="text-align:center;">Hey, This Is <a href="/">Feedback Bot</a> Made By Using JavaScript And Made to deploy on cloudflare by <b><a href="https://github.com/AkkilMG/AkkilMG/">AkKiL</a></b> 😇.
</p>

  This Bot Works Like Independent @LivegramBot, But With Logs Of The User..

## 👽 Variables
```javascript
const BOT_TOKEN = '1234567890:ABCDEfghijklmno-PQrstuvwxYZ'; // Your Bot's Token (from BotFather
const BOT_SECRET = 'akkil123456'; // Secret for webhook verification
const LOG_CHANNEL = '-1234567890'; // Channel ID for logs
const OWNER_ID = 1428968542; // Your Telegram User ID (Admin)
```

### 🛠️ Setup:
- Get `BOT_TOKEN` from [@botfather](https://t.me/botfather).
- Change `BOT_SECRET` with a powerful secret text (only `[A-Z, a-z, 0-9, _, -]` are allowed).
- Get `BOT_OWNER` from [@googleimgbot](https://t.me/googleimgbot).
- Get `LOG_CHANNEL` id by forwarding a message from channel to [@googleimgbot](https://t.me/googleimgbot).
  - Channel **ID** must start with `-100`.
  - Bot must be **admin** in channel with **edit rights**.

<br>

## ⚙️Deploy
- Create a [Cloudflare](https://www.cloudflare.com/) **account**.
- Navigate to `Workers & Pages > Create > Create Worker`.
- Deploy the worker by clicking **Deploy**.
- Edit the code by clicking **Edit Code**.
- Upload `worker.js` into **Cloudflare**.
- Modify the [variables](#Variables).
- Finally, **Deploy**.

<!-- [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/AkkilMG/Feedback-Bot-CF) -->

### Setup:
- Once you deployed the bot on Cloudflare.
- Open `XXX.YYYYY.workers.dev/register` to register your bot webhook.
- Then you can start using your bot.

<br>

<b>If Anyone Want To Contribute Some Commits. They Can Upgrade It.. With Description About Update And A Test Bot.</b>

<br>

## Credits

- Thanks To <b>[AkKiL](https://telegram.dog/HeimanCreatiin/)</b> 
