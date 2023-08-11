var game, scoreData

window.onload = function () {
    var chromeDino = document.getElementById('chrome-dino');
    chromeDino.classList.add('offline');

    // 建立遊戲
    game = new Runner('#chrome-dino', questions_demo);

    // 取得遊戲分數
    document.getElementById('endgame-submit').addEventListener('click', function () {
        this.scoreData = {
            time: this.game.runningTime,
            score: this.game.score
        }
        console.log(this.scoreData)
    }.bind(this));

    // 重新遊戲
    document.getElementById('restart-btn').addEventListener('click', function () {
        document.getElementById('end-game-modal').classList.remove('active');
        this.game.restart();
    }.bind(this))
};

// 遊戲題目
var questions_demo = [{
    discussion: '閱讀下列杜詩,依據詩意與格律,ＯＯ內最適合填入的詞語依序是:<br>甲、灩澦既沒孤根深,西來水多愁太陰。江天ＯＯ鳥雙去,風雨ＯＯ龍一吟。<br>乙、舍西柔桑葉可拈,江畔細麥復ＯＯ。人生幾何春已夏,不放香醪如蜜甜。',
    options: ['漠漠/瑟瑟/亭亭', '漠漠/時時/纖纖', '朗朗/時時/亭亭', '朗朗/瑟瑟/纖纖'],
    gift: {
        name: 'item1',
        score: 20
    },
    anser_index: 1
}, {
    discussion: '______ the photos with dates and keywords help you sort them easily in your file.',
    options: ['Tagging', 'Flocking', 'Rolling', 'Snapping'],
    gift: {
        name: 'item2',
        score: 30
    },
    anser_index: 0
}, {
    discussion: '某冰淇淋店最少需準備 n 桶不同口味的冰淇淋,才能滿足廣告所稱「任選兩球不同口味冰淇淋的組合數超過 100 種」。試問來店顧客從 n 桶中任選兩球(可為同一口味)共有幾種方法?',
    options: ['101', '105', '115', '120', '225'],
    gift: {
        name: 'item3',
        score: 40
    },
    anser_index: 3
}, {
    discussion: '自然界的基本交互作用中,哪幾種對日常天氣現象的影響最為明顯常見?',
    options: ['強作用(強核力)', '夸克作用', '電磁力作用', '重力作用'],
    gift: {
        name: 'item4',
        score: 50
    },
    anser_index: 3
}, {
    discussion: '一位學者提到:過去歷史研究的主體,往往偏重於統治者的歷史,比較忽略人民的歷史,其實,人民才是我們應該關心的主體。下列哪個主題最接近這位學者主張的研究方向?',
    options: ['鄭氏王朝在臺的屯田政策', '清代臺灣職官制度的演變', '清代臺灣沿海的王爺信仰', '日本在臺殖民體制的建立'],
    gift: {
        name: 'item5',
        score: 60
    },
    anser_index: 2
}]