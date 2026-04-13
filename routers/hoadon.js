var express = require('express');
var router = express.Router();

var HoaDon = require('../models/hoadon');
var ThanhToan = require('../models/thanhtoan');

// DANH SÁCH
router.get('/', async (req, res) => {
    const hoadon = await HoaDon.find()
        .populate({
            path: 'ThanhToan',
            populate: {
                path: 'DatCoc',
                populate: [
                    { path: 'Xe' },
                    { path: 'KhachHangRef' }
                ]
            }
        });

    res.render('hoadon', { hoadon });
});

// TẠO HÓA ĐƠN TỪ THANH TOÁN
router.get('/tao/:id', async (req, res) => {
    const tt = await ThanhToan.findById(req.params.id);

    if (!tt) return res.redirect('/thanhtoan');

    const newHD = new HoaDon({
        MaHoaDon: 'HD' + Date.now(),
        ThanhToan: tt._id,
        TongTien: tt.SoTien
    });

    await newHD.save();

    res.redirect('/hoadon');
});

// XÓA
router.get('/xoa/:id', async (req, res) => {
    await HoaDon.findByIdAndDelete(req.params.id);
    res.redirect('/hoadon');
});

module.exports = router;