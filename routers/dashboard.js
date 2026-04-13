var express = require('express');
var router = express.Router();

var Xe = require('../models/xe');
var KhachHang = require('../models/khachhang');
var DatCoc = require('../models/datcoc');
var ThanhToan = require('../models/thanhtoan');

// Trang dashboard
router.get('/', async (req, res) => {
    try {
        // Đếm số lượng
        const tongXe = await Xe.countDocuments();
        const tongKhach = await KhachHang.countDocuments();
        const tongDatCoc = await DatCoc.countDocuments();
        const tongThanhToan = await ThanhToan.countDocuments();

        // Tổng doanh thu
        const doanhThuData = await ThanhToan.find();
        let tongDoanhThu = 0;
        doanhThuData.forEach(item => {
            tongDoanhThu += item.SoTien || 0;
        });

        res.render('dashboard', {
            title: 'Dashboard',
            tongXe,
            tongKhach,
            tongDatCoc,
            tongThanhToan,
            tongDoanhThu
        });

    } catch (err) {
        console.log(err);
        res.redirect('/error');
    }
});

module.exports = router;