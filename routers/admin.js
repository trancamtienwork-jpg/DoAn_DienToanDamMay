// ===============================
// FILE: routers/admin.js
// ===============================
const express = require('express');
const router = express.Router();
const Xe = require('../models/xe');
const DongXe = require('../models/dongxe');

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
        return res.redirect('/');
    }

    next();
}

// ===============================
// /admin/xe -> TRANG QUẢN LÝ XE
// ===============================
router.get('/xe', yeuCauAdmin, async (req, res) => {
    try {
        const xe = await Xe.find().populate('DongXe');

        res.render('quanlyxe', {
            title: 'Quản lý xe',
            xe
        });
    } catch (error) {
        console.error('Lỗi trang quản lý xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// /admin/dongxe -> TRANG QUẢN LÝ DÒNG XE
// ===============================
router.get('/dongxe', yeuCauAdmin, async (req, res) => {
    try {
        const dongxe = await DongXe.find();

        res.render('quanlydongxe', {
            title: 'Quản lý dòng xe',
            dongxe
        });
    } catch (error) {
        console.error('Lỗi trang quản lý dòng xe:', error);
        res.status(500).send('Lỗi server');
    }
});

module.exports = router;