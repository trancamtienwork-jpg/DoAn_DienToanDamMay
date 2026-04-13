// FILE: index.js
// BẢN ĐÚNG ĐẦY ĐỦ

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();

const indexRouter = require('./routers/index');
const xeRouter = require('./routers/xe');
const dongxeRouter = require('./routers/dongxe');
const authRouter = require('./routers/auth');
const adminRouter = require('./routers/admin');
const baivietRouter = require('./routers/baiviet');
const datcocRouter = require('./routers/datcoc');
const thanhToanRouter = require('./routers/thanhtoan');
const khachhangRouter = require('./routers/khachhang');
const dashboardRouter = require('./routers/dashboard');
const hoadonRouter = require('./routers/hoadon');



mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Kết nối MongoDB Atlas thành công'))
    .catch(err => console.log(err));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(session({
    name: 'ShowroomPorsche',
    secret: 'showroom_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.currentPath = req.path;

    const err = req.session.error;
    const msg = req.session.success;

    delete req.session.error;
    delete req.session.success;

    res.locals.message = '';
    if (err) res.locals.message = `<div class="alert alert-danger">${err}</div>`;
    if (msg) res.locals.message = `<div class="alert alert-success">${msg}</div>`;

    next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/xe', xeRouter);
app.use('/dongxe', dongxeRouter);
app.use('/baiviet', baivietRouter);
app.use('/admin', adminRouter);
app.use('/datcoc', datcocRouter);
app.use('/thanhtoan', thanhToanRouter);
app.use('/khachhang', khachhangRouter);
app.use('/dashboard', dashboardRouter);
app.use('/hoadon', hoadonRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});