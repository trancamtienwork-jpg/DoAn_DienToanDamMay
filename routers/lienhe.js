const express = require('express');
const router = express.Router();
const LienHe = require('../models/lienhe');

// GET: Trang liên hệ
router.get('/', (req, res) => {
    res.render('lienhe');
});

// POST: Gửi liên hệ
router.post('/gui', async (req, res) => {
    try {
        const { HoTen, Email, SoDienThoai, NoiDung } = req.body;

        await LienHe.create({
            HoTen,
            Email,
            SoDienThoai,
            NoiDung
        });

        req.flash('success', 'Gửi liên hệ thành công!');
        res.redirect('/lienhe');
    } catch (error) {
        console.log(error);
        res.send('Lỗi gửi liên hệ');
    }
});

// GET: Admin xem danh sách liên hệ
router.get('/admin/list', async (req, res) => {
    try {
        const lienhe = await LienHe.find().sort({ createdAt: -1 });
        res.send(lienhe); // tạm, để không lỗi
    } catch (error) {
        console.log(error);
        res.send('Lỗi lấy danh sách liên hệ');
    }
});

// GET: Đánh dấu đã xử lý
router.get('/xuly/:id', async (req, res) => {
    try {
        await LienHe.findByIdAndUpdate(req.params.id, { TrangThai: 1 });
        res.redirect('/lienhe/admin/list');
    } catch (error) {
        console.log(error);
        res.send('Lỗi cập nhật liên hệ');
    }
});

module.exports = router;