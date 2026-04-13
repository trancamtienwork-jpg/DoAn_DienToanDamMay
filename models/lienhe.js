var mongoose = require('mongoose');

var lienHeSchema = new mongoose.Schema({
    HoVaTen: { type: String, required: true },
    Email: { type: String },
    SoDienThoai: { type: String },
    NoiDung: { type: String, required: true },
    NgayGui: { type: Date, default: Date.now },
    DaXuLy: { type: Number, default: 0 }
});

var LienHe = mongoose.model('LienHe', lienHeSchema);
module.exports = LienHe;