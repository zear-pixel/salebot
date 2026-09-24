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

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB'ga muvaffaqiyatli ulandi"))
    .catch(err => console.error("Baza xatosi:", err));

// Admin middleware - Xavfsizlik uchun
const checkAdmin = (req, res, next) => {
    const userId = req.headers['x-telegram-user-id'];
    if (userId && userId.toString() === ADMIN_ID.toString()) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Ruxsat berilmagan! Faqat admin uchun.' });
    }
};

// --- API YO'LAKLARI ---

// Bo'limlarni olish
app.get('/api/categories', async (req, res) => {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
});

// Mahsulotlarni olish
app.get('/api/products', async (req, res) => {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const products = await Product.find(filter).populate('categoryId');
    res.json(products);
});

// ADMIN: Bo'lim qo'shish
app.post('/api/admin/categories', checkAdmin, async (req, res) => {
    const category = new Category(req.body);
    await category.save();
    res.json({ success: true, category });
});

// ADMIN: Bo'limni o'chirish
app.delete('/api/admin/categories/:id', checkAdmin, async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    await Product.deleteMany({ categoryId: req.params.id });
    res.json({ success: true });
});

// ADMIN: Mahsulot qo'shish / tahrirlash
app.post('/api/admin/products', checkAdmin, async (req, res) => {
    const { id, ...data } = req.body;
    if (id) {
        const updated = await Product.findByIdAndUpdate(id, data, { new: true });
        return res.json({ success: true, product: updated });
    }
    const product = new Product(data);
    await product.save();
    res.json({ success: true, product });
});

// ADMIN: Mahsulotni o'chirish
app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.get('/ping', (req, res) => res.send("OK"));

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
