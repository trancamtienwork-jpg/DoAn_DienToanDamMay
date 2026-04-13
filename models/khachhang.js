const mongoose = require('mongoose');

const khachHangSchema = new mongoose.Schema({
    HoVaTen: String,
    SoDienThoai: String,
    CCCD: String,
    DiaChi: String,

    TongChiTieu: { type: Number, default: 0 },
    SoLanMua: { type: Number, default: 0 },

    NgayTao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KhachHang', khachHangSchema);