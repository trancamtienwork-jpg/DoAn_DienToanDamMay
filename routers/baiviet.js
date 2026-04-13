// ===============================
// FILE: routers/baiviet.js
// ===============================
const express = require('express');
const router = express.Router();
const BaiViet = require('../models/baiviet');
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
        return res.redirect('/baiviet');
    }

    next();
}

// ===============================
// USER - DANH SÁCH BÀI VIẾT
// ===============================
router.get('/', async (req, res) => {
    try {
        const { tukhoa, noibat } = req.query;

        let dieuKien = {
            KiemDuyet: 1
        };

        if (tukhoa) {
            dieuKien.TieuDe = { $regex: tukhoa, $options: 'i' };
        }

        if (noibat === '1') {
            dieuKien.NoiBat = 1;
        }

        const baiviet = await BaiViet.find(dieuKien)
            .populate('TacGia')
            .sort({ NgayDang: -1 })
            .lean();

        res.render('danhsachbaiviet', {
            title: 'Danh sách bài viết',
            baiviet,
            tuKhoa: tukhoa || '',
            boLocNoiBat: noibat || ''
        });
    } catch (error) {
        console.error('Lỗi danh sách bài viết:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// ADMIN - QUẢN LÝ BÀI VIẾT
// ===============================
router.get('/quanly', yeuCauAdmin, async (req, res) => {
    try {
        const { tukhoa, kiemduyet } = req.query;

        let dieuKien = {};

        if (tukhoa) {
            dieuKien.TieuDe = { $regex: tukhoa, $options: 'i' };
        }

        if (kiemduyet !== undefined && kiemduyet !== '') {
            dieuKien.KiemDuyet = Number(kiemduyet);
        }

        const baiviet = await BaiViet.find(dieuKien)
            .populate('TacGia')
            .sort({ NgayDang: -1 })
            .lean();

        res.render('quanlybaiviet', {
            title: 'Quản lý bài viết',
            baiviet,
            tuKhoa: tukhoa || '',
            boLocKiemDuyet: kiemduyet || ''
        });
    } catch (error) {
        console.error('Lỗi quản lý bài viết:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// FORM THÊM BÀI VIẾT
// ===============================
router.get('/them', yeuCauDangNhap, async (req, res) => {
    try {
        res.render('thembaiviet', {
            title: 'Thêm bài viết'
        });
    } catch (error) {
        console.error('Lỗi mở form thêm bài viết:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// XỬ LÝ THÊM BÀI VIẾT
// ===============================
router.post('/them', yeuCauDangNhap, upload.single('HinhAnhFile'), async (req, res) => {
    try {
        const {
            TieuDe,
            TomTat,
            NoiDung,
            NoiBat
        } = req.body;

        await BaiViet.create({
            TieuDe: (TieuDe || '').trim(),
            TomTat: (TomTat || '').trim(),
            NoiDung: (NoiDung || '').trim(),
            NoiBat: Number(NoiBat) || 0,
            TacGia: req.session.MaNguoiDung,
            HinhAnh: req.file ? '/uploads/' + req.file.filename : '',
            KiemDuyet: req.session.QuyenHan === 'admin' ? 1 : 0
        });

        req.session.success = 'Thêm bài viết thành công.';
        res.redirect(req.session.QuyenHan === 'admin' ? '/baiviet/quanly' : '/baiviet/cuatoi');
    } catch (error) {
        console.error('Lỗi thêm bài viết:', error);
        req.session.error = 'Thêm bài viết thất bại.';
        res.redirect('/baiviet/them');
    }
});

// ===============================
// FORM SỬA BÀI VIẾT
// ===============================
router.get('/sua/:id', yeuCauDangNhap, async (req, res) => {
    try {
        const baiviet = await BaiViet.findById(req.params.id).lean();

        if (!baiviet) {
            req.session.error = 'Không tìm thấy bài viết.';
            return res.redirect('/baiviet');
        }

        const laAdmin = req.session.QuyenHan === 'admin';
        const laChuBai = baiviet.TacGia.toString() === req.session.MaNguoiDung;

        if (!laAdmin && !laChuBai) {
            req.session.error = 'Bạn không có quyền sửa bài viết này.';
            return res.redirect('/baiviet');
        }

        if (!laAdmin && baiviet.KiemDuyet == 1) {
            req.session.error = 'Bài viết đã duyệt không thể sửa.';
            return res.redirect('/baiviet/cuatoi');
        }

        res.render('suabaiviet', {
            title: 'Sửa bài viết',
            baiviet
        });
    } catch (error) {
        console.error('Lỗi mở form sửa bài viết:', error);
        req.session.error = 'Không tìm thấy bài viết.';
        res.redirect('/baiviet');
    }
});

// ===============================
// XỬ LÝ SỬA BÀI VIẾT
// ===============================
router.post('/sua/:id', yeuCauDangNhap, upload.single('HinhAnhFile'), async (req, res) => {
    try {
        const {
            TieuDe,
            TomTat,
            NoiDung,
            NoiBat
        } = req.body;

        const baiCu = await BaiViet.findById(req.params.id);

        if (!baiCu) {
            req.session.error = 'Không tìm thấy bài viết cần sửa.';
            return res.redirect('/baiviet');
        }

        const laAdmin = req.session.QuyenHan === 'admin';
        const laChuBai = baiCu.TacGia.toString() === req.session.MaNguoiDung;

        if (!laAdmin && !laChuBai) {
            req.session.error = 'Bạn không có quyền sửa bài viết này.';
            return res.redirect('/baiviet');
        }

        if (!laAdmin && baiCu.KiemDuyet == 1) {
            req.session.error = 'Bài viết đã duyệt không thể sửa.';
            return res.redirect('/baiviet/cuatoi');
        }

        const dataUpdate = {
            TieuDe: (TieuDe || '').trim(),
            TomTat: (TomTat || '').trim(),
            NoiDung: (NoiDung || '').trim(),
            NoiBat: parseInt(NoiBat) === 1 ? 1 : 0,
            HinhAnh: baiCu.HinhAnh
        };

        if (req.file) {
            dataUpdate.HinhAnh = '/uploads/' + req.file.filename;
        }

        // user sửa thì về chờ duyệt lại
        if (!laAdmin) {
            dataUpdate.KiemDuyet = 0;
        }

        await BaiViet.findByIdAndUpdate(req.params.id, dataUpdate, { new: true });

        req.session.success = 'Cập nhật bài viết thành công.';
        res.redirect(laAdmin ? '/baiviet/quanly' : '/baiviet/cuatoi');
    } catch (error) {
        console.error('Lỗi cập nhật bài viết:', error);
        req.session.error = 'Cập nhật bài viết thất bại.';
        res.redirect('/baiviet');
    }
});

// ===============================
// XÓA BÀI VIẾT
// ===============================
router.get('/xoa/:id', yeuCauDangNhap, async (req, res) => {
    try {
        const baiviet = await BaiViet.findById(req.params.id);

        if (!baiviet) {
            req.session.error = 'Không tìm thấy bài viết.';
            return res.redirect('/baiviet');
        }

        const laAdmin = req.session.QuyenHan === 'admin';
        const laChuBai = baiviet.TacGia.toString() === req.session.MaNguoiDung;

        if (!laAdmin && !laChuBai) {
            req.session.error = 'Bạn không có quyền xóa bài viết này.';
            return res.redirect('/baiviet');
        }

        if (!laAdmin && baiviet.KiemDuyet == 1) {
            req.session.error = 'Bài viết đã duyệt không thể xóa.';
            return res.redirect('/baiviet/cuatoi');
        }

        await BaiViet.findByIdAndDelete(req.params.id);

        req.session.success = 'Xóa bài viết thành công.';
        res.redirect(laAdmin ? '/baiviet/quanly' : '/baiviet/cuatoi');
    } catch (error) {
        console.error('Lỗi xóa bài viết:', error);
        req.session.error = 'Xóa bài viết thất bại.';
        res.redirect('/baiviet');
    }
});

// ===============================
// ADMIN - DUYỆT / BỎ DUYỆT
// ===============================
router.get('/duyet/:id', yeuCauAdmin, async (req, res) => {
    try {
        const baiviet = await BaiViet.findById(req.params.id);

        if (!baiviet) {
            req.session.error = 'Không tìm thấy bài viết.';
            return res.redirect('/baiviet/quanly');
        }

        baiviet.KiemDuyet = baiviet.KiemDuyet == 1 ? 0 : 1;
        await baiviet.save();

        req.session.success = 'Cập nhật trạng thái duyệt thành công.';
        res.redirect('/baiviet/quanly');
    } catch (error) {
        console.error('Lỗi duyệt bài viết:', error);
        req.session.error = 'Duyệt bài viết thất bại.';
        res.redirect('/baiviet/quanly');
    }
});

// ===============================
// USER - BÀI VIẾT CỦA TÔI
// ===============================
router.get('/cuatoi', yeuCauDangNhap, async (req, res) => {
    try {
        const baiviet = await BaiViet.find({ TacGia: req.session.MaNguoiDung })
            .sort({ NgayDang: -1 })
            .lean();

        res.render('baivietcuatoi', {
            title: 'Bài viết của tôi',
            baiviet
        });
    } catch (error) {
        console.error('Lỗi bài viết của tôi:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// CHI TIẾT BÀI VIẾT
// ===============================
router.get('/chi-tiet/:id', async (req, res) => {
    try {
        const baiviet = await BaiViet.findOne({
            _id: req.params.id,
            KiemDuyet: 1
        }).populate('TacGia').lean();

        if (!baiviet) {
            return res.status(404).send('Bài viết không tồn tại');
        }

        await BaiViet.findByIdAndUpdate(req.params.id, {
            $inc: { LuotXem: 1 }
        });

        const baivietlienquan = await BaiViet.find({
            _id: { $ne: req.params.id },
            KiemDuyet: 1
        })
            .sort({ NgayDang: -1 })
            .limit(3)
            .lean();

        res.render('chitietbaiviet', {
            title: baiviet.TieuDe,
            baiviet,
            baivietlienquan
        });
    } catch (error) {
        console.error('Lỗi chi tiết bài viết:', error);
        res.status(500).send('Lỗi server');
    }
});

module.exports = router;