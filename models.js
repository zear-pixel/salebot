const mongoose = require('mongoose');

// Bo'limlar va Menyular sxemasi
const CategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, default: '📦' },
    order: { type: Number, default: 0 }
});

// Mahsulotlar sxemasi
const ProductSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    mediaUrl: { type: String, default: '' }, // Rasm yoki Video URL
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);

module.exports = { Category, Product };
