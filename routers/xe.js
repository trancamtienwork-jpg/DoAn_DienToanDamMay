// ===============================
// FILE: routers/xe.js
// ===============================
const express = require('express');
const router = express.Router();
const Xe = require('../models/xe');
const DongXe = require('../models/dongxe');
const multer = require('multer');
const path = require('path');

// ===============================
// CẤU HÌNH UPLOAD ẢNH
// ===============================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
        return res.redirect('/xe');
    }

    next();
}

// ===============================
// TRANG XEM XE (CẢ ADMIN + USER)
// ===============================
router.get('/', async (req, res) => {
    try {
        const { dongxe, tukhoa } = req.query;

        let dieuKien = {};

        if (dongxe) {
            dieuKien.DongXe = dongxe;
        }

        if (tukhoa) {
            dieuKien.TenXe = { $regex: tukhoa, $options: 'i' };
        }

        const xe = await Xe.find(dieuKien).populate('DongXe').lean();
        const dsDongXe = await DongXe.find().lean();

        res.render('danhsachxe', {
            title: 'Danh sách xe',
            xe,
            dsDongXe,
            boLocDongXe: dongxe || '',
            tuKhoa: tukhoa || ''
        });
    } catch (error) {
        console.error('Lỗi danh sách xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// ADMIN - QUẢN LÝ XE
// ===============================
router.get('/quanly', yeuCauAdmin, async (req, res) => {
    try {
        const { dongxe, tukhoa } = req.query;

        let dieuKien = {};

        if (dongxe) {
            dieuKien.DongXe = dongxe;
        }

        if (tukhoa) {
            dieuKien.TenXe = { $regex: tukhoa, $options: 'i' };
        }

        const xe = await Xe.find(dieuKien).populate('DongXe').lean();
        const dsDongXe = await DongXe.find().lean();

        res.render('quanlyxe', {
            title: 'Quản lý xe',
            xe,
            dsDongXe,
            boLocDongXe: dongxe || '',
            tuKhoa: tukhoa || ''
        });
    } catch (error) {
        console.error('Lỗi quản lý xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// FORM THÊM XE (ADMIN)
// ===============================
router.get('/them', yeuCauAdmin, async (req, res) => {
    try {
        const dongxe = await DongXe.find().lean();

        res.render('themxe', {
            title: 'Thêm xe',
            dongxe
        });
    } catch (error) {
        console.error('Lỗi mở form thêm xe:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// XỬ LÝ THÊM XE (ADMIN)
// ===============================
router.post('/them', yeuCauAdmin, upload.single('HinhAnhFile'), async (req, res) => {
    try {
        const {
            TenXe,
            DongXe: MaDongXe,
            Gia,
            NamSanXuat,
            MauSac,
            SoLuong,
            NoiBat,
            MoTa
        } = req.body;

        await Xe.create({
            TenXe: (TenXe || '').trim(),
            DongXe: MaDongXe,
            Gia: Number(Gia) || 0,
            NamSanXuat: Number(NamSanXuat) || new Date().getFullYear(),
            MauSac: (MauSac || '').trim(),
            SoLuong: Number(SoLuong) || 0,
            NoiBat: Number(NoiBat) || 0,
            MoTa: (MoTa || '').trim(),
            HinhAnh: req.file ? '/uploads/' + req.file.filename : ''
        });

        req.session.success = 'Thêm xe thành công.';
        res.redirect('/xe/quanly');
    } catch (error) {
        console.error('Lỗi thêm xe:', error);
        req.session.error = 'Thêm xe thất bại.';
        res.redirect('/xe/them');
    }
});

// ===============================
// FORM SỬA XE (ADMIN)
// ===============================
router.get('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id).lean();
        const dongxe = await DongXe.find().lean();

        if (!xe) {
            req.session.error = 'Không tìm thấy xe.';
            return res.redirect('/xe/quanly');
        }

        res.render('suaxe', {
            title: 'Sửa xe',
            xe,
            dongxe
        });
    } catch (error) {
        console.error('Lỗi mở form sửa xe:', error);
        req.session.error = 'Không tìm thấy xe.';
        res.redirect('/xe/quanly');
    }
});

// ===============================
// XỬ LÝ SỬA XE (ADMIN)
// ===============================
router.post('/sua/:id', yeuCauAdmin, upload.single('HinhAnhFile'), async (req, res) => {
    try {
        const {
            TenXe,
            DongXe,
            Gia,
            NamSanXuat,
            MauSac,
            SoLuong,
            NoiBat,
            MoTa
        } = req.body;

        console.log('===== DATA FORM SUA XE =====');
        console.log(req.body);

        // Tìm xe cũ
        const xeCu = await Xe.findById(req.params.id);

        if (!xeCu) {
            req.session.error = 'Không tìm thấy xe cần sửa.';
            return res.redirect('/xe/quanly');
        }

        // Chuẩn hóa nổi bật
        const noiBatValue = parseInt(NoiBat) === 1 ? 1 : 0;

        console.log('NoiBat sau xử lý =', noiBatValue);

        const dataUpdate = {
            TenXe: (TenXe || '').trim(),
            DongXe: DongXe,
            Gia: Number(Gia) || 0,
            NamSanXuat: Number(NamSanXuat) || new Date().getFullYear(),
            MauSac: (MauSac || '').trim(),
            SoLuong: Number(SoLuong) || 0,
            NoiBat: noiBatValue,
            MoTa: (MoTa || '').trim(),
            HinhAnh: xeCu.HinhAnh // giữ ảnh cũ mặc định
        };

        // Nếu có upload ảnh mới thì cập nhật ảnh mới
        if (req.file) {
            dataUpdate.HinhAnh = '/uploads/' + req.file.filename;
        }

        console.log('===== DATA UPDATE =====');
        console.log(dataUpdate);

        const ketQua = await Xe.findByIdAndUpdate(
            req.params.id,
            dataUpdate,
            { new: true }
        );

        console.log('===== SAU KHI UPDATE =====');
        console.log(ketQua);

        req.session.success = 'Cập nhật xe thành công.';
        res.redirect('/xe/quanly');
    } catch (error) {
        console.error('Lỗi cập nhật xe:', error);
        req.session.error = 'Cập nhật xe thất bại.';
        res.redirect('/xe/quanly');
    }
});

// ===============================
// XÓA XE (ADMIN)
// ===============================
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        await Xe.findByIdAndDelete(req.params.id);
        req.session.success = 'Xóa xe thành công.';
        res.redirect('/xe/quanly');
    } catch (error) {
        console.error('Lỗi xóa xe:', error);
        req.session.error = 'Xóa xe thất bại.';
        res.redirect('/xe/quanly');
    }
});

// ===============================
// CHI TIẾT XE
// ===============================
router.get('/chi-tiet/:id', async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id).populate('DongXe').lean();

        if (!xe) {
            return res.status(404).send('Xe không tồn tại');
        }

        res.render('chitietxe', {
            title: xe.TenXe,
            xe
        });
    } catch (error) {
        console.error('Lỗi chi tiết xe:', error);
        res.status(500).send('Lỗi server');
    }
});

module.exports = router;