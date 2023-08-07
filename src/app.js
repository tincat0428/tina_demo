const path = require('path');
const express = require('express');
const PORT = process.env.PORT || 3000;

const publicDirPath = path.join(__dirname, '../public')

const app = express();

app.use(express.static(publicDirPath));  // 將服務指定到 public 資料夾下

app.listen(PORT, () => {
    console.log('Server is up on port' + PORT)
})