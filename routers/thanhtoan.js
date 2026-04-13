
const express = require('express');
const router = express.Router();

const ThanhToan = require('../models/thanhtoan');
const DatCoc = require('../models/datcoc');

const KhachHang = require('../models/khachhang');

// Middleware kiểm tra admin
function yeuCauAdmin(req, res, next) {
    if (!req.session || !req.session.MaNguoiDung || req.session.QuyenHan !== 'admin') {
        req.session.error = 'Bạn không có quyền truy cập chức năng này.';
        return res.redirect('/dangnhap');
    }
    next();
}

// Tạo mã giao dịch tự động nếu chưa nhập
async function taoMaGiaoDich() {
    const tong = await ThanhToan.countDocuments();
    return 'TT' + String(tong + 1).padStart(4, '0');
}



// ===============================
// GET: Danh sách thanh toán
// ===============================
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        const tukhoa = req.query.tukhoa ? req.query.tukhoa.trim() : '';

        let dsThanhToan = await ThanhToan.find()
            .populate({
                path: 'DatCoc',
                populate: [
                    { path: 'KhachHangRef' },
                    {
                        path: 'Xe',
                        populate: { path: 'DongXe' }
                    }
                ]
            })
            .sort({ NgayThanhToan: -1 });

        if (tukhoa) {
            const keyword = tukhoa.toLowerCase();
            dsThanhToan = dsThanhToan.filter(tt =>
                tt.MaGiaoDich?.toLowerCase().includes(keyword) ||
                tt.PhuongThuc?.toLowerCase().includes(keyword) ||
                tt.TrangThai?.toLowerCase().includes(keyword) ||
                tt.DatCoc?.MaDatCoc?.toLowerCase().includes(keyword) ||
                tt.DatCoc?.KhachHangRef?.HoVaTen?.toLowerCase().includes(keyword) ||
                tt.DatCoc?.KhachHangRef?.SoDienThoai?.toLowerCase().includes(keyword) ||
                tt.DatCoc?.KhachHangRef?.TenDangNhap?.toLowerCase().includes(keyword) ||
                tt.DatCoc?.Xe?.TenXe?.toLowerCase().includes(keyword)
            );
        }

        res.render('thanhtoan', {
            title: 'Quản lý thanh toán',
            thanhtoan: dsThanhToan,
            tukhoa
        });
    } catch (error) {
        console.log(error);
        req.session.error = 'Không thể tải danh sách thanh toán.';
        res.redirect('/');
    }
});

router.get('/chi-tiet/:id', yeuCauAdmin, async (req, res) => {
    const tt = await ThanhToan.findById(req.params.id)
        .populate({
            path: 'DatCoc',
            populate: [
                { path: 'KhachHangRef' },
                { path: 'Xe', populate: { path: 'DongXe' } }
            ]
        });

    res.render('thanhtoan_chitiet', { tt });
});

// ===============================
// GET: Form thêm thanh toán
// ===============================
router.get('/them', yeuCauAdmin, async (req, res) => {
    try {
        const datcoc = await DatCoc.find()
            .populate('KhachHangRef')
            .populate({
                path: 'Xe',
                populate: { path: 'DongXe' }
            })
            .sort({ NgayDat: -1 });

        res.render('thanhtoan_them', {
            title: 'Thêm thanh toán',
            datcoc
        });
    } catch (error) {
        console.log(error);
        req.session.error = 'Không thể mở form thêm thanh toán.';
        res.redirect('/thanhtoan');
    }
});

// ===============================
// POST: Thêm thanh toán
// ===============================
router.post('/them', yeuCauAdmin, async (req, res) => {
    try {
        const {
            DatCoc: DatCocId,
            SoTien,
            PhuongThuc,
            MaGiaoDich,
            TrangThai,
            NgayThanhToan
        } = req.body;

        const phieuDatCoc = await DatCoc.findById(DatCocId).populate('Xe');

        if (!phieuDatCoc) {
            req.session.error = 'Không tìm thấy phiếu đặt cọc.';
            return res.redirect('/thanhtoan');
        }

        const giaXe = Number(phieuDatCoc.Xe?.GiaBan || 0); // đổi lại nếu field giá khác
        const soTienCoc = Number(phieuDatCoc.SoTienCoc || 0);
        const soTienConLai = Math.max(giaXe - soTienCoc, 0);
        const soTienThanhToan = Number(SoTien || 0);

        const maGD = MaGiaoDich && MaGiaoDich.trim() ? MaGiaoDich.trim() : await taoMaGiaoDich();

        const daTonTai = await ThanhToan.findOne({ DatCoc: DatCocId });

        if (daTonTai) {
            req.session.error = 'Phiếu đặt cọc này đã có giao dịch thanh toán.';
            return res.redirect('/thanhtoan/them');
        }

        const giaoDichMoi = await ThanhToan.create({
            DatCoc: DatCocId,
            SoTien: soTienThanhToan,
            PhuongThuc,
            MaGiaoDich: maGD,
            TrangThai: TrangThai || 'DaThanhToan',
            NgayThanhToan: NgayThanhToan || new Date()
        });

        // ===============================
        // ⭐ CẬP NHẬT KHÁCH HÀNG
        // ===============================
        const trangThaiFinal = TrangThai || 'DaThanhToan';

        if (trangThaiFinal === 'DaThanhToan') {

            const dc = await DatCoc.findById(DatCocId).populate('Xe');

            if (!dc) {
                console.log("❌ Không tìm thấy đặt cọc");
                return;
            }

            const giaXe = Number(
                dc.Xe?.GiaBan ||
                dc.Xe?.GiaXe ||
                dc.Xe?.Gia ||
                0
            );

            let khach = await KhachHang.findById(dc.KhachHangRef);

            if (!khach) {
                khach = await KhachHang.create({
                    HoVaTen: dc.HoVaTen,
                    SoDienThoai: dc.SoDienThoai,
                    CCCD: dc.CCCD,
                    DiaChi: dc.DiaChi,
                    TongChiTieu: giaXe,
                    SoLanMua: 1
                });

                console.log("🆕 TẠO KHÁCH MỚI");
            } else {
                khach.TongChiTieu += giaXe;
                khach.SoLanMua += 1;
                await khach.save();

                console.log("✅ UPDATE KHÁCH:", khach.HoVaTen);
            }
        }

        // Nếu thanh toán thành công thì cập nhật trạng thái đặt cọc
        if (TrangThai === 'DaThanhToan') {
            await DatCoc.findByIdAndUpdate(DatCocId, {
                TrangThai: 'DaXacNhan'
            });
        }

        req.session.success = 'Thêm thanh toán thành công.';
        res.redirect('/thanhtoan');
    } catch (error) {
        console.log(error);
        req.session.success = 'Thanh toán thành công và đã tạo hóa đơn.';
        res.redirect('/thanhtoan/hoadon/' + giaoDichMoi._id);
    }
});

// ===============================
// GET: Form sửa thanh toán
// ===============================
router.get('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        const thanhtoan = await ThanhToan.findById(req.params.id);
        const datcoc = await DatCoc.find()
            .populate('KhachHangRef')
            .populate({
                path: 'Xe',
                populate: { path: 'DongXe' }
            })
            .sort({ NgayDat: -1 });

        if (!thanhtoan) {
            req.session.error = 'Không tìm thấy phiếu thanh toán.';
            return res.redirect('/thanhtoan');
        }

        res.render('thanhtoan_sua', {
            title: 'Sửa thanh toán',
            thanhtoan,
            datcoc
        });
    } catch (error) {
        console.log(error);
        req.session.error = 'Không thể mở form sửa thanh toán.';
        res.redirect('/thanhtoan');
    }
});

// ===============================
// POST: Sửa thanh toán
// ===============================
router.post('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        const {
            DatCoc: DatCocId,
            SoTien,
            PhuongThuc,
            MaGiaoDich,
            TrangThai,
            NgayThanhToan
        } = req.body;

        await ThanhToan.findByIdAndUpdate(req.params.id, {
            DatCoc: DatCocId,
            SoTien,
            PhuongThuc,
            MaGiaoDich,
            TrangThai,
            NgayThanhToan
        });

        if (TrangThai === 'DaThanhToan') {

            const dc = await DatCoc.findById(DatCocId)
                .populate('Xe')
                .populate('KhachHangRef');

            let khach = await KhachHang.findById(dc.KhachHangRef);

            if (khach) {
                khach.TongChiTieu += Number(dc.Xe?.GiaBan || 0);
                khach.SoLanMua += 1;
                await khach.save();

                console.log("ĐÃ UPDATE KHÁCH:", khach.HoVaTen);
            } else {
                console.log("KHÔNG TÌM THẤY KHÁCH");
            }
        }

        req.session.success = 'Cập nhật thanh toán thành công.';
        res.redirect('/thanhtoan');
    } catch (error) {
        console.log(error);
        req.session.error = 'Cập nhật thanh toán thất bại.';
        res.redirect('/thanhtoan');
    }
});

// ===============================
// GET: Xóa thanh toán
// ===============================
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        await ThanhToan.findByIdAndDelete(req.params.id);
        req.session.success = 'Xóa thanh toán thành công.';
        res.redirect('/thanhtoan');
    } catch (error) {
        console.log(error);
        req.session.error = 'Xóa thanh toán thất bại.';
        res.redirect('/thanhtoan');
    }
});

// ===============================
// GET: Đổi trạng thái nhanh
// ===============================
router.get('/trangthai/:id', yeuCauAdmin, async (req, res) => {
    try {
        const thanhtoan = await ThanhToan.findById(req.params.id);

        if (!thanhtoan) {
            req.session.error = 'Không tìm thấy phiếu thanh toán.';
            return res.redirect('/thanhtoan');
        }

        const thuTu = ['DaThanhToan', 'ChoThanhToan', 'ThatBai'];
        const index = thuTu.indexOf(thanhtoan.TrangThai);
        thanhtoan.TrangThai = thuTu[(index + 1) % thuTu.length];

        await thanhtoan.save();

        if (thanhtoan.TrangThai === 'DaThanhToan') {
            await DatCoc.findByIdAndUpdate(thanhtoan.DatCoc, {
                TrangThai: 'DaXacNhan'
            });
        }

        req.session.success = 'Cập nhật trạng thái thanh toán thành công.';
        res.redirect('/thanhtoan');
    } catch (error) {
        console.log(error);
        req.session.error = 'Không thể cập nhật trạng thái thanh toán.';
        res.redirect('/thanhtoan');
    }
});

// ===============================
// GET: Tạo thanh toán từ đặt cọc
// ===============================
router.get('/tao/:id', yeuCauAdmin, async (req, res) => {
    try {
        const datcoc = await DatCoc.findById(req.params.id)
            .populate('KhachHangRef')
            .populate({
                path: 'Xe',
                populate: { path: 'DongXe' }
            });

        if (!datcoc) {
            req.session.error = 'Không tìm thấy phiếu đặt cọc.';
            return res.redirect('/datcoc');
        }

        const daTonTai = await ThanhToan.findOne({ DatCoc: datcoc._id });

        if (daTonTai) {
            req.session.error = 'Phiếu này đã được thanh toán.';
            return res.redirect('/datcoc');
        }

        const giaXe = Number(
            datcoc.Xe?.GiaBan ||
            datcoc.Xe?.GiaXe ||
            datcoc.Xe?.Gia ||
            datcoc.Xe?.DonGia ||
            datcoc.Xe?.GiaNiemYet ||
            0
        );

        const soTienCoc = Number(datcoc.SoTienCoc || 0);
        const soTienConLai = Math.max(giaXe - soTienCoc, 0);

        res.render('thanhtoan_tao', {
            title: 'Thanh toán số tiền còn lại',
            datcoc,
            giaXe,
            soTienCoc,
            soTienConLai
        });

    } catch (err) {
        console.log(err);
        req.session.error = 'Không thể tạo thanh toán.';
        res.redirect('/datcoc');
    }
});

module.exports = router;

// ===============================
// GET: Hóa đơn thanh toán
// ===============================
router.get('/hoadon/:id', yeuCauAdmin, async (req, res) => {
    try {
        const tt = await ThanhToan.findById(req.params.id)
            .populate({
                path: 'DatCoc',
                populate: [
                    { path: 'KhachHangRef' },
                    {
                        path: 'Xe',
                        populate: { path: 'DongXe' }
                    }
                ]
            });

        if (!tt) {
            req.session.error = 'Không tìm thấy hóa đơn.';
            return res.redirect('/thanhtoan');
        }

        const giaXe = Number(
            tt.DatCoc?.Xe?.GiaBan ||
            tt.DatCoc?.Xe?.GiaXe ||
            tt.DatCoc?.Xe?.Gia ||
            tt.DatCoc?.Xe?.DonGia ||
            tt.DatCoc?.Xe?.GiaNiemYet ||
            0
        );

        const soTienCoc = Number(tt.DatCoc?.SoTienCoc || 0);
        const soTienThanhToan = Number(tt.SoTien || 0);

        res.render('thanhtoan_hoadon', {
            title: 'Hóa đơn thanh toán',
            tt,
            giaXe,
            soTienCoc,
            soTienThanhToan
        });

    } catch (error) {
        console.log(error);
        req.session.error = 'Không thể mở hóa đơn.';
        res.redirect('/thanhtoan');
    }
});