const express = require('express');
const router = express.Router();

const DatCoc = require('../models/datcoc');
const TaiKhoan = require('../models/taikhoan');
const Xe = require('../models/xe');
const KhachHang = require('../models/khachhang'); // ⭐ THÊM

// ===============================
// Middleware kiểm tra admin
// ===============================
function yeuCauAdmin(req, res, next) {
    if (!req.session || !req.session.MaNguoiDung || req.session.QuyenHan !== 'admin') {
        req.session.error = 'Bạn không có quyền truy cập chức năng này.';
        return res.redirect('/dangnhap');
    }
    next();
}

// ===============================
// USER - GET: Mở form đặt cọc
// ===============================
router.get('/tao/:id', async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id).populate('DongXe');

        if (!xe) {
            req.session.error = 'Không tìm thấy xe.';
            return res.redirect('/xe');
        }

        res.render('datcoc_khach', {
            title: 'Phiếu đặt cọc',
            xe
        });
    } catch (error) {
        console.log(error);
        res.redirect('/xe');
    }
});

// ===============================
// USER - POST: Gửi đặt cọc (ĐÃ NÂNG CẤP)
// ===============================
router.post('/tao/:id', async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id);

        if (!xe) {
            req.session.error = 'Xe không tồn tại.';
            return res.redirect('/xe');
        }

        const {
            HoVaTen,
            SoDienThoai,
            CCCD,
            DiaChi,
            SoTienCoc,
            GhiChu
        } = req.body;

        if (!HoVaTen || !SoDienThoai || !SoTienCoc) {
            req.session.error = 'Thiếu thông tin.';
            return res.redirect('/datcoc/tao/' + req.params.id);
        }

        // ===============================
        // ⭐ TẠO / TÌM KHÁCH HÀNG
        // ===============================
        let khach = await KhachHang.findOne({ SoDienThoai });

        if (!khach) {
            khach = await KhachHang.create({
                HoVaTen,
                SoDienThoai,
                CCCD,
                DiaChi
            });
        }

        // Nếu có đăng nhập thì gắn tài khoản
        let khachHangId = null;
        if (req.session && req.session.MaNguoiDung) {
            khachHangId = req.session.MaNguoiDung;
        }

        const maDatCoc = await taoMaDatCoc();


        await DatCoc.create({
            MaDatCoc: maDatCoc,
            KhachHangRef: khach._id,
            Xe: xe._id,
            SoTienCoc,
            NgayDat: new Date(),
            TrangThai: 'ChoXuLy',
            GhiChu
        });

        req.session.success = 'Đặt cọc thành công.';
        res.redirect('/xe/chi-tiet/' + xe._id);

    } catch (error) {
        console.log(error);
        req.session.error = 'Lỗi đặt cọc.';
        res.redirect('/xe');
    }
});

// ===============================
// Tạo mã đặt cọc
// ===============================
async function taoMaDatCoc() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return 'DC' + Date.now().toString().slice(-6) + random;
}

// ===============================
// ADMIN - DANH SÁCH
// ===============================
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        const tukhoa = req.query.tukhoa ? req.query.tukhoa.trim() : '';

        let dsDatCoc = await DatCoc.find()
            .populate('KhachHangRef') // ⭐ THÊM
            .populate({
                path: 'Xe',
                populate: { path: 'DongXe' }
            })
            .sort({ NgayDat: -1 });

        if (tukhoa) {
            const keyword = tukhoa.toLowerCase();

            dsDatCoc = dsDatCoc.filter(dc =>
                dc.MaDatCoc?.toLowerCase().includes(keyword) ||
                dc.KhachHangRef?.HoVaTen?.toLowerCase().includes(keyword) ||
                dc.HoVaTen?.toLowerCase().includes(keyword) ||
                dc.SoDienThoai?.includes(keyword) ||
                dc.Xe?.TenXe?.toLowerCase().includes(keyword)
            );
        }

        res.render('datcoc', {
            title: 'Quản lý đặt cọc',
            datcoc: dsDatCoc,
            tukhoa
        });

    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

// ===============================
// ADMIN - XÓA
// ===============================
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        await DatCoc.findByIdAndDelete(req.params.id);
        res.redirect('/datcoc');
    } catch (error) {
        console.log(error);
        res.redirect('/datcoc');
    }
});

// ===============================
// ADMIN - ĐỔI TRẠNG THÁI
// ===============================
router.get('/trangthai/:id', yeuCauAdmin, async (req, res) => {
    try {
        const datcoc = await DatCoc.findById(req.params.id);

        const thuTu = ['ChoXuLy', 'DaXacNhan', 'DaHuy'];
        const index = thuTu.indexOf(datcoc.TrangThai);
        datcoc.TrangThai = thuTu[(index + 1) % thuTu.length];

        await datcoc.save();

        res.redirect('/datcoc');

    } catch (error) {
        console.log(error);
        res.redirect('/datcoc');
    }
});

module.exports = router;