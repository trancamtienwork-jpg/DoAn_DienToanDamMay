// ===============================
// FILE: routers/auth.js
// ===============================
console.log('AUTH ROUTER ĐANG CHẠY');

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan');

// ===============================
// GET: Đăng ký
// ===============================
router.get('/dangky', async (req, res) => {
    res.render('dangky', { title: 'Đăng ký' });
});

// ===============================
// POST: Đăng ký
// ===============================
router.post('/dangky', async (req, res) => {
    const { HoVaTen, Email, TenDangNhap, MatKhau, XacNhanMatKhau } = req.body;

    if (MatKhau !== XacNhanMatKhau) {
        req.session.error = 'Xác nhận mật khẩu không khớp.';
        return res.redirect('/dangky');
    }

    const tonTai = await TaiKhoan.findOne({ TenDangNhap });
    if (tonTai) {
        req.session.error = 'Tên đăng nhập đã tồn tại.';
        return res.redirect('/dangky');
    }

    const matKhauMaHoa = bcrypt.hashSync(MatKhau, 10);

    await TaiKhoan.create({
        HoVaTen,
        Email,
        TenDangNhap,
        MatKhau: matKhauMaHoa,
        QuyenHan: 'user',
        KichHoat: 1
    });

    req.session.success = 'Đăng ký thành công. Vui lòng đăng nhập.';
    res.redirect('/dangnhap');
});

// ===============================
// GET: Đăng nhập
// ===============================
router.get('/dangnhap', async (req, res) => {
    res.render('dangnhap', { title: 'Đăng nhập' });
});

// ===============================
// POST: Đăng nhập
// ===============================
router.post('/dangnhap', async (req, res) => {
    const { TenDangNhap, MatKhau } = req.body;

    console.log('INPUT USERNAME:', `[${TenDangNhap}]`);

    const danhSachTaiKhoan = await TaiKhoan.find();
    console.log('ALL USERS:', danhSachTaiKhoan);

    const taikhoan = danhSachTaiKhoan.find(
        tk => tk.TenDangNhap && tk.TenDangNhap.trim() === TenDangNhap.trim()
    );

    console.log('USER TÌM THỦ CÔNG:', taikhoan);

    if (!taikhoan) {
        req.session.error = 'Tên đăng nhập không tồn tại.';
        return res.redirect('/dangnhap');
    }

    const hopLe = bcrypt.compareSync(MatKhau, taikhoan.MatKhau);
    console.log('MẬT KHẨU ĐÚNG?', hopLe);

    if (!hopLe) {
        req.session.error = 'Mật khẩu không chính xác.';
        return res.redirect('/dangnhap');
    }

    if (taikhoan.KichHoat == 0) {
        req.session.error = 'Tài khoản đã bị khóa.';
        return res.redirect('/dangnhap');
    }

    req.session.MaNguoiDung = taikhoan._id;
    req.session.HoVaTen = taikhoan.HoVaTen;
    req.session.QuyenHan = taikhoan.QuyenHan;

    req.session.success = 'Đăng nhập thành công.';
    res.redirect('/');
});

// ===============================
// GET: Đăng xuất
// ===============================
router.get('/dangxuat', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('LỖI ĐĂNG XUẤT:', err);
            return res.redirect('/');
        }

        res.clearCookie('connect.sid');
        res.redirect('/dangnhap');
    });
});

module.exports = router;