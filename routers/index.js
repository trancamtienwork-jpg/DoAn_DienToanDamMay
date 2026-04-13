// ===============================
// FILE: routers/index.js
// ===============================
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Xe = require('../models/xe');
const DongXe = require('../models/dongxe');
const BaiViet = require('../models/baiviet');

// ===============================
// TRANG CHỦ
// ===============================
router.get('/', async (req, res) => {
    try {
        // XE NỔI BẬT
        const xeNoiBat = await Xe.find({ NoiBat: 1 })
            .populate('DongXe')
            .limit(6)
            .lean();

        // DÒNG XE
        const dongxe = await DongXe.find().lean();

        // BÀI VIẾT NỔI BẬT
        const baivietNoiBat = await BaiViet.find({
            NoiBat: 1,
            KiemDuyet: 1
        })
        .sort({ NgayDang: -1 })
        .limit(6)
        .lean();

        // RENDER 1 LẦN DUY NHẤT
        res.render('index', {
            title: 'Trang chủ',
            xeNoiBat,
            dongxe,
            baivietNoiBat
        });

    } catch (error) {
        console.error('Lỗi trang chủ:', error);
        res.status(500).send('Lỗi server');
    }
});

// ===============================
// GIỚI THIỆU
// ===============================
router.get('/gioithieu', async (req, res) => {
    res.render('gioithieu', { title: 'Giới thiệu' });
});

// ===============================
// LIÊN HỆ
// ===============================
router.get('/lienhe', async (req, res) => {
    res.render('lienhe', { title: 'Liên hệ' });
});

// ===============================
// CHI TIẾT XE
// ===============================
router.get('/xe/chi-tiet/:id', async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id).populate('DongXe');

        if (!xe) {
            return res.render('error', {
                title: 'Lỗi',
                message: 'Không tìm thấy xe.'
            });
        }

        const xecungdong = await Xe.find({
            DongXe: xe.DongXe ? xe.DongXe._id : null,
            _id: { $ne: xe._id }
        })
        .limit(4)
        .sort({ NoiBat: -1, Gia: 1 });

        res.render('chitietxe', {
            title: xe.TenXe,
            xe,
            xecungdong
        });
    } catch (error) {
        console.log(error);
        res.render('error', {
            title: 'Lỗi',
            message: 'Không thể tải chi tiết xe.'
        });
    }
});

module.exports = router;