// ===============================
// FILE: models/baiviet.js
// ===============================
const mongoose = require('mongoose');

const baiVietSchema = new mongoose.Schema({
    TieuDe: { type: String, required: true },
    TomTat: { type: String, default: '' },
    NoiDung: { type: String, default: '' },
    HinhAnh: { type: String, default: '' },

    TacGia: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },

    NoiBat: { type: Number, default: 0 },      // 0 hoặc 1
    KiemDuyet: { type: Number, default: 0 },   // 0: chờ duyệt | 1: đã duyệt
    LuotXem: { type: Number, default: 0 },

    NgayDang: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BaiViet', baiVietSchema);