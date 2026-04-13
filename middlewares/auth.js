function requireLogin(req, res, next) {
    if (!req.session.MaNguoiDung) {
        req.session.error = 'Vui lòng đăng nhập.';
        return res.redirect('/dangnhap');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.MaNguoiDung || req.session.QuyenHan !== 'admin') {
        req.session.error = 'Bạn không có quyền truy cập.';
        return res.redirect('/');
    }
    next();
}

module.exports = { requireLogin, requireAdmin };