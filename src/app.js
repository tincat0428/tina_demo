const path = require('path');
const express = require('express');

const publicDirPath = path.join(__dirname, '../public')

const app = express();

app.use(express.static(publicDirPath));  // 將服務指定到 public 資料夾下

app.listen(3000, () => {
    console.log('Server is up on port 3000')
})