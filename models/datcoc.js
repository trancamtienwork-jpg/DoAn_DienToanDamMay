var mongoose = require('mongoose');

var datCocSchema = new mongoose.Schema({
    MaDatCoc: { type: String, required: true, unique: true },

    // Nếu khách có tài khoản thì lưu
    KhachHang: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', default: null },

    Xe: { type: mongoose.Schema.Types.ObjectId, ref: 'Xe', required: true },

    // Thông tin khách ngoài tài khoản
    // HoVaTen: { type: String },
    // SoDienThoai: { type: String },
    // CCCD: { type: String },
    // DiaChi: { type: String },

    SoTienCoc: { type: Number, required: true },
    NgayDat: { type: Date, default: Date.now },
    TrangThai: { type: String, default: 'ChoXuLy' },
    GhiChu: { type: String },

    KhachHangRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' }
});

var DatCoc = mongoose.model('DatCoc', datCocSchema);
module.exports = DatCoc;