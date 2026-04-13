var mongoose = require('mongoose');

var hoaDonSchema = new mongoose.Schema({
    MaHoaDon: { type: String, required: true },
    
    ThanhToan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ThanhToan'
    },

    TongTien: { type: Number, default: 0 },

    NgayLap: { type: Date, default: Date.now },

    TrangThai: { 
        type: String, 
        default: 'DaXuat' // DaXuat / Huy
    }
});

module.exports = mongoose.model('HoaDon', hoaDonSchema);