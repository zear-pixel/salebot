const express = require('express');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { Category, Product } = require('./models');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;
const ADMIN_ID = process.env.ADMIN_ID; // Sizning Telegram ID raqamingiz

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB bazasiga ulanish
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB'ga muvaffaqiyatli ulandi"))
    .catch(err => console.error("Baza xatosi:", err));

// Admin middleware - Xavfsizlik uchun
const checkAdmin = (req, res, next) => {
    const userId = req.headers['x-telegram-user-id'];
    if (userId && ADMIN_ID && userId.toString() === ADMIN_ID.toString()) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Ruxsat berilmagan! Faqat admin uchun.' });
    }
};

// --- API YO'LAKLARI ---

// 1. ADMIN EKANLIGINI TEKSHIRISH (Frontend uchun)
app.get('/api/admin/check', (req, res) => {
    const userId = req.headers['x-telegram-user-id'];
    if (userId && ADMIN_ID && userId.toString() === ADMIN_ID.toString()) {
        return res.json({ isAdmin: true });
    }
    return res.json({ isAdmin: false });
});

// 2. Bo'limlarni olish (Barcha foydalanuvchilar uchun)
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Mahsulotlarni olish (Barcha foydalanuvchilar uchun)
app.get('/api/products', async (req, res) => {
    try {
        const { categoryId } = req.query;
        const filter = categoryId ? { categoryId } : {};
        const products = await Product.find(filter).populate('categoryId');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. ADMIN: Bo'lim qo'shish
app.post('/api/admin/categories', checkAdmin, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. ADMIN: Bo'limni o'chirish
app.delete('/api/admin/categories/:id', checkAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        await Product.deleteMany({ categoryId: req.params.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. ADMIN: Mahsulot qo'shish / tahrirlash
app.post('/api/admin/products', checkAdmin, async (req, res) => {
    try {
        const { id, ...data } = req.body;
        if (id) {
            const updated = await Product.findByIdAndUpdate(id, data, { new: true });
            return res.json({ success: true, product: updated });
        }
        const product = new Product(data);
        await product.save();
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. ADMIN: Mahsulotni o'chirish
app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cron-job serverni uyg'otib turishi uchun
app.get('/ping', (req, res) => res.send("OK"));

// Bot buyruqlari
bot.start((ctx) => {
    ctx.reply("Do'konga xush kelibsiz!", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🛍️ Do'konni ochish", web_app: { url: process.env.WEB_APP_URL } }]
            ]
        }
    });
});

bot.launch();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
