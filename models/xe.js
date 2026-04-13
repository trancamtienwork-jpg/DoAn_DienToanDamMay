// ===============================
// FILE: models/xe.js
// ===============================
const mongoose = require('mongoose');

const xeSchema = new mongoose.Schema({
    TenXe: { type: String, required: true },
    DongXe: { type: mongoose.Schema.Types.ObjectId, ref: 'DongXe', required: true },
    Gia: { type: Number, required: true, default: 0 },
    NamSanXuat: { type: Number, default: new Date().getFullYear() },
    MauSac: { type: String, default: '' },
    SoLuong: { type: Number, default: 0 },
    HinhAnh: { type: String, default: '' },
    NoiBat: { type: Number, default: 0 }, // 0 hoặc 1
    MoTa: { type: String, default: '' }
});

module.exports = mongoose.model('Xe', xeSchema);