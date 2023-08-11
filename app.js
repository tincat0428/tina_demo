const path = require('path');
const express = require('express');
const PORT = process.env.PORT || 3000;

const publicDirPath = path.join(__dirname, 'public')
const viewPath = path.join(__dirname, 'templates/views');

const app = express();

app.set('view engine', 'hbs'); // 設定 handlebars view engine
app.set('views', viewPath); // 更改 views 路徑資料夾

app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css'))); // 引用css
app.use(express.static(publicDirPath));  // 將服務指定到 public 資料夾下

app.get('/', (req, res) => {
    res.render('index')
});

app.get('*', function (req, res) {
    res.render('404')
});

app.listen(PORT, () => {
    console.log('Server is up on port' + PORT)
})