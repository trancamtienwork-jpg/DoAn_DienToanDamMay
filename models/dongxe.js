var mongoose = require('mongoose');

var dongXeSchema = new mongoose.Schema({
    TenDongXe: { type: String, required: true, unique: true },
    MoTa: { type: String },
    HinhAnh: { type: String }
});

var DongXe = mongoose.model('DongXe', dongXeSchema);
module.exports = DongXe;