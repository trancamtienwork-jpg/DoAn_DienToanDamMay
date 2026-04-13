var mongoose = require('mongoose');

var thanhToanSchema = new mongoose.Schema({
    DatCoc: { type: mongoose.Schema.Types.ObjectId, ref: 'DatCoc', required: true },
    SoTien: { type: Number, required: true },
    PhuongThuc: { type: String },
    MaGiaoDich: { type: String },
    TrangThai: { type: String, default: 'ChoThanhToan' },
    NgayThanhToan: { type: Date, default: Date.now },

    KhachHangRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' }
});

var ThanhToan = mongoose.model('ThanhToan', thanhToanSchema);
module.exports = ThanhToan;