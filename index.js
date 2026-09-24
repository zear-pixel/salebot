const express = require('express');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;
const ADMIN_ID = process.env.ADMIN_ID; // Sizning Telegram ID raqamingiz

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB Sxemalari
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    balance: { type: Number, default: 0 },
    role: { type: String, default: 'user' }
});
const User = mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: String,
    order: Number,
    isActive: { type: Boolean, default: true }
});
const Category = mongoose.model('Category', categorySchema);

const productSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 100 },
    imageUrl: String,
    isActive: { type: Boolean, default: true }
});
const Product = mongoose.model('Product', productSchema);

// MongoDB'ga ulanish
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB'ga ulandi"))
    .catch(err => console.error("Baza xatosi:", err));

// API: Foydalanuvchini ro'yxatga olish va ma'lumotini berish
app.post('/api/user', async (req, res) => {
    const { telegramId, firstName } = req.body;
    try {
        let user = await User.findOne({ telegramId });
        if (!user) {
            user = new User({ telegramId, firstName, role: telegramId === ADMIN_ID ? 'admin' : 'user' });
            await user.save();
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Bo'limlarni (Kategoriyalarni) olish
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cron-job uchun
app.get('/ping', (req, res) => res.status(200).send("OK"));

// Bot komandalari
bot.start((ctx) => {
    ctx.reply("Assalomu alaykum! Xizmatlardan foydalanish uchun ilovani oching.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Ilovani ochish", web_app: { url: process.env.WEB_APP_URL } }]
            ]
        }
    });
});

bot.launch();
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
