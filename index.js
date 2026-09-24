const express = require('express');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// Middleware: Web App'ni ko'rsatish uchun "public" papkasini ulash
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB bazasiga ulanish (keyingi qadamda sozlaymiz)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB'ga muvaffaqiyatli ulandi"))
  .catch(err => console.error("Baza ulanishida xatolik:", err));

// Cron-job.org uchun maxsus yo'lak (Serverni 24/7 uyg'oq tutish uchun)
app.get('/ping', (req, res) => {
    res.status(200).send("Server faol holatda!");
});

// Bot komandalari
bot.start((ctx) => {
    ctx.reply("Assalomu alaykum! Ilovani ochish uchun pastdagi tugmani bosing.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Ilovani ochish", web_app: { url: process.env.WEB_APP_URL } }]
            ]
        }
    });
});

// Botni ishga tushirish
bot.launch();

// Express serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});

// Xatoliklarni ushlash
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
