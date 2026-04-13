require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Kết nối MongoDB Atlas thành công!');
        process.exit();
    })
    .catch(err => {
        console.log('❌ Kết nối thất bại:');
        console.log(err);
        process.exit();
    });