const express = require('express');
const router = express.Router();
const KhachHang = require('../models/khachhang');
const DatCoc = require('../models/datcoc');
const ThanhToan = require('../models/thanhtoan');

// ===============================
// DANH SÁCH KHÁCH HÀNG
// ===============================
router.get('/', async (req, res) => {
    try {
        const tukhoa = req.query.tukhoa ? req.query.tukhoa.trim() : '';

        let ds = await KhachHang.find().sort({ NgayTao: -1 });

        // 🔍 SEARCH
        if (tukhoa) {
            const keyword = tukhoa.toLowerCase();
            ds = ds.filter(k =>
                k.HoVaTen?.toLowerCase().includes(keyword) ||
                k.SoDienThoai?.includes(keyword)
            );
        }

        res.render('khachhang', {
            title: 'Quản lý khách hàng',
            khachhang: ds,
            tukhoa // ⭐ THÊM DÒNG NÀY
        });

    } catch (err) {
        console.log(err);
        res.send('Lỗi');
    }
});

router.get('/:id', async (req, res) => {

    const khach = await KhachHang.findById(req.params.id);

    const datcoc = await DatCoc.find({
    KhachHangRef: khach._id
}).populate('Xe');

    res.render('khachhang_chitiet', {
        khach,
        datcoc
    });
});

// ===============================
// GET: FORM SỬA
// ===============================
router.get('/sua/:id', async (req, res) => {
    const khach = await KhachHang.findById(req.params.id);

    res.render('khachhang_sua', {
        title: 'Sửa khách hàng',
        khach
    });
});

// ===============================
// POST: SỬA
// ===============================
router.post('/sua/:id', async (req, res) => {
    const { HoVaTen, SoDienThoai, CCCD, DiaChi } = req.body;

    await KhachHang.findByIdAndUpdate(req.params.id, {
        HoVaTen,
        SoDienThoai,
        CCCD,
        DiaChi
    });

    res.redirect('/khachhang');
});

// ===============================
// XÓA
// ===============================
router.get('/xoa/:id', async (req, res) => {
    await KhachHang.findByIdAndDelete(req.params.id);
    res.redirect('/khachhang');
});

module.exports = router;