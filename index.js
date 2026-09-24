const express = require('express');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;
const ADMIN_ID = process.env.ADMIN_ID; 

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- BAZA SXEMALARI ---
const User = mongoose.model('User', new mongoose.Schema({
    telegramId: String, firstName: String, balance: { type: Number, default: 0 }, role: String
}));
const Category = mongoose.model('Category', new mongoose.Schema({
    name: String, icon: String, isActive: { type: Boolean, default: true }
}));
const Product = mongoose.model('Product', new mongoose.Schema({
    categoryId: mongoose.Schema.Types.ObjectId, title: String, price: Number, stock: Number, imageUrl: String, isActive: { type: Boolean, default: true }
}));

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB ulangan"));

// --- API YO'LLARI ---
app.post('/api/user', async (req, res) => {
    const { telegramId, firstName } = req.body;
    let user = await User.findOne({ telegramId });
    if (!user) user = await User.create({ telegramId, firstName, role: telegramId === ADMIN_ID ? 'admin' : 'user' });
    else if (telegramId === ADMIN_ID && user.role !== 'admin') { user.role = 'admin'; await user.save(); }
    res.json({ success: true, user });
});

// Kategoriyalarni olish va qo'shish
app.get('/api/categories', async (req, res) => {
    const categories = await Category.find();
    res.json({ success: true, categories });
});
app.post('/api/categories', async (req, res) => {
    const newCategory = await Category.create(req.body);
    res.json({ success: true, category: newCategory });
});

// Mahsulotlarni olish va qo'shish
app.get('/api/products/:categoryId', async (req, res) => {
    const products = await Product.find({ categoryId: req.params.categoryId });
    res.json({ success: true, products });
});
app.post('/api/products', async (req, res) => {
    const newProduct = await Product.create(req.body);
    res.json({ success: true, product: newProduct });
});

app.get('/ping', (req, res) => res.status(200).send("OK"));

bot.start((ctx) => {
    ctx.reply("Xush kelibsiz! Ilovani oching:", {
        reply_markup: { inline_keyboard: [[{ text: "Ilovani ochish", web_app: { url: process.env.WEB_APP_URL } }]] }
    });
});

bot.launch();
app.listen(PORT, () => console.log(`Server ishladi: ${PORT}`));
