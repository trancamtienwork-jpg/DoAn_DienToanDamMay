const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan');

// GET: Danh sách tài khoản
router.get('/', async (req, res) => {
    try {
        const taikhoan = await TaiKhoan.find().sort({ createdAt: -1 });
        res.render('admin/taikhoan', { taikhoan });
    } catch (error) {
        console.log(error);
        res.send('Lỗi lấy danh sách tài khoản');
    }
});

// GET: Hồ sơ cá nhân
router.get('/hoso', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/dangnhap');

        const user = await TaiKhoan.findById(req.session.user._id);
        res.render('hoso', { user });
    } catch (error) {
        console.log(error);
        res.send('Lỗi tải hồ sơ');
    }
});

// GET: Form thêm tài khoản
router.get('/them', (req, res) => {
    res.send('Trang thêm tài khoản - sẽ làm giao diện sau');
});

// POST: Thêm tài khoản
router.post('/them', async (req, res) => {
    try {
        const { HoVaTen, Email, SoDienThoai, MatKhau, VaiTro } = req.body;

        const hash = await bcrypt.hash(MatKhau, 10);

        await TaiKhoan.create({
            HoVaTen,
            Email,
            SoDienThoai,
            MatKhau: hash,
            VaiTro: VaiTro || 'user'
        });

        res.redirect('/taikhoan');
    } catch (error) {
        console.log(error);
        res.send('Lỗi thêm tài khoản');
    }
});

// GET: Form sửa tài khoản
router.get('/sua/:id', async (req, res) => {
    try {
        const taikhoan = await TaiKhoan.findById(req.params.id);
        if (!taikhoan) return res.send('Không tìm thấy tài khoản');
        res.send(`Trang sửa tài khoản: ${taikhoan.HoVaTen} - sẽ làm giao diện sau`);
    } catch (error) {
        console.log(error);
        res.send('Lỗi tải form sửa tài khoản');
    }
});

// POST: Cập nhật tài khoản
router.post('/sua/:id', async (req, res) => {
    try {
        const { HoVaTen, Email, SoDienThoai, VaiTro, TrangThai, MatKhau } = req.body;

        const dataUpdate = {
            HoVaTen,
            Email,
            SoDienThoai,
            VaiTro,
            TrangThai
        };

        if (MatKhau && MatKhau.trim() !== '') {
            dataUpdate.MatKhau = await bcrypt.hash(MatKhau, 10);
        }

        await TaiKhoan.findByIdAndUpdate(req.params.id, dataUpdate);
        res.redirect('/taikhoan');
    } catch (error) {
        console.log(error);
        res.send('Lỗi cập nhật tài khoản');
    }
});

// GET: Xóa tài khoản
router.get('/xoa/:id', async (req, res) => {
    try {
        await TaiKhoan.findByIdAndDelete(req.params.id);
        res.redirect('/taikhoan');
    } catch (error) {
        console.log(error);
        res.send('Lỗi xóa tài khoản');
    }
});

module.exports = router;