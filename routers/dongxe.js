// ===============================
// FILE: routers/dongxe.js
// ===============================
const express = require('express');
const router = express.Router();
const DongXe = require('../models/dongxe');
const Xe = require('../models/xe');

// ===============================
// MIDDLEWARE ĐĂNG NHẬP
// ===============================
function yeuCauDangNhap(req, res, next) {
    if (!req.session || !req.session.MaNguoiDung) {
        req.session.error = 'Vui lòng đăng nhập.';
        return res.redirect('/dangnhap');
    }
    next();
}

// ===============================
// MIDDLEWARE ADMIN
// ===============================
function yeuCauAdmin(req, res, next) {
    if (!req.session || !req.session.MaNguoiDung) {
        req.session.error = 'Vui lòng đăng nhập.';
        return res.redirect('/dangnhap');
    }

    if (req.session.QuyenHan !== 'admin') {
        req.session.error = 'Bạn không có quyền truy cập.';
        return res.redirect('/dongxe');
    }

    next();
}

// ===============================
// TRANG XEM DÒNG XE (CẢ ADMIN + USER)
// ===============================
router.get('/', async (req, res) => {
    try {
        const dongxe = await DongXe.find().lean();
        const dsXe = await Xe.find().populate('DongXe').lean();

        // đếm số xe theo từng dòng
        const dongxeCoDem = dongxe.map(dx => {
            const soXe = dsXe.filter(x => x.DongXe && x.DongXe._id.toString() === dx._id.toString()).length;
            return {
                ...dx,
                SoXe: soXe
            };
        });

        res.render('danhsachdongxe', {
            title: 'Dòng xe',
            dongxe: dongxeCoDem
        });
    } catch (error) {
        console.error('Lỗi danh sách dòng xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// ADMIN - QUẢN LÝ DÒNG XE
// ===============================
router.get('/quanly', yeuCauAdmin, async (req, res) => {
    try {
        const dongxe = await DongXe.find();
        res.render('quanlydongxe', {
            title: 'Quản lý dòng xe',
            dongxe
        });
    } catch (error) {
        console.error('Lỗi quản lý dòng xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// FORM THÊM DÒNG XE (ADMIN)
// ===============================
router.get('/them', yeuCauAdmin, async (req, res) => {
    res.render('themdongxe', {
        title: 'Thêm dòng xe'
    });
});

// ===============================
// XỬ LÝ THÊM DÒNG XE (ADMIN)
// ===============================
router.post('/them', yeuCauAdmin, async (req, res) => {
    try {
        const { TenDongXe, MoTa } = req.body;
        await DongXe.create({ TenDongXe, MoTa });

        req.session.success = 'Thêm dòng xe thành công.';
        res.redirect('/dongxe/quanly');
    } catch (error) {
        console.error(error);
        req.session.error = 'Thêm dòng xe thất bại.';
        res.redirect('/dongxe/them');
    }
});

// ===============================
// FORM SỬA DÒNG XE (ADMIN)
// ===============================
router.get('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        const dongxe = await DongXe.findById(req.params.id);
        res.render('suadongxe', {
            title: 'Sửa dòng xe',
            dongxe
        });
    } catch (error) {
        console.error(error);
        req.session.error = 'Không tìm thấy dòng xe.';
        res.redirect('/dongxe/quanly');
    }
});

// ===============================
// XỬ LÝ SỬA DÒNG XE (ADMIN)
// ===============================
router.post('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        const { TenDongXe, MoTa } = req.body;

        await DongXe.findByIdAndUpdate(req.params.id, {
            TenDongXe,
            MoTa
        });

        req.session.success = 'Cập nhật dòng xe thành công.';
        res.redirect('/dongxe/quanly');
    } catch (error) {
        console.error(error);
        req.session.error = 'Cập nhật dòng xe thất bại.';
        res.redirect('/dongxe/quanly');
    }
});

// ===============================
// XÓA DÒNG XE (ADMIN)
// ===============================
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        await DongXe.findByIdAndDelete(req.params.id);
        req.session.success = 'Xóa dòng xe thành công.';
        res.redirect('/dongxe/quanly');
    } catch (error) {
        console.error(error);
        req.session.error = 'Xóa dòng xe thất bại.';
        res.redirect('/dongxe/quanly');
    }
});

module.exports = router;