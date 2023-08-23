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

const projects = [
    { title: '滑鼠繪圖', description: 'Canvas練習：滑鼠監聽、顏色參數變化', url: './test001', image: 'test001.jpg' },
    { title: '好評洗版', description: 'Canvas練習：利用範圍內的亂數，隨機調整內容、顏色、位置分布', url: './test002', image: 'test002.jpg' },
    { title: '趣味競賽', description: 'Canvas練習：小恐龍遊戲改寫，與HTML資料傳遞', url: './game', image: 'game.jpg' },
    { title: '88net', description: '專案應用：重複使用Canvas製作的背景元件，圖形渲染更高效', url: './88net', image: '88net.jpg' },
    { title: 'SG活動頁：Play and Win', description: '專案應用：打雷特效', url: 'https://spade-event.com/enews/event/playandwin_June', image: 'thunder.jpg' },
    { title: 'SG活動頁：國慶中秋', description: '專案應用：煙火特效', url: 'https://spade-event.com/enews/event/2023_MidAutumn_RedPacket', image: 'firework.jpg' },
]

app.get('/', (req, res) => {
    res.render('index', { projects })
});

app.get('*', function (req, res) {
    res.render('404')
});

app.listen(PORT, () => {
    console.log('Server is up on port' + PORT)
})