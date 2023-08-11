/**
 * 遊戲主體類，控制遊戲的整體邏輯
 * @param {String} containerSelector 畫布外層容器的選擇器
 * @param {Object} opt_config 配置選項
 * @param {Object[]} questions_list 題目內容
 */
function Runner(containerSelector, questions_list, opt_config) {
    // 獲取遊戲的 “根” DOM 節點，整個遊戲都會輸出到這個節點裏
    this.outerContainerEl = document.querySelector(containerSelector);
    // canvas 的外層容器
    this.containerEl = null;

    this.config = opt_config || Runner.config;
    this.dimensions = Runner.defaultDimensions;

    this.time = 0; // 時鐘計時器
    this.currentSpeed = this.config.SPEED; // 當前的速度

    this.activated = false; // 遊戲彩蛋是否被激活（沒有被激活時，遊戲不會顯示出來）
    this.playing = false; // 遊戲是否進行中
    this.crashed = false; // 小明是否碰到了障礙物
    this.paused = false // 遊戲是否暫停

    this.runningTime = 0; // 遊戲運行的時間
    this.score = 0;

    this.msPerFrame = 1000 / FPS; // 每幀的時間

    this.distanceMeter = null; // 距離計數類
    this.distanceRan = 0; // 遊戲移動距離
    this.highestScore = 0; // 最高分

    this.startGameBtn = document.getElementById('start-game-btn') // 開始按鈕
    this.speedUpBtn = document.getElementById('speed-up-btn'); // 加速按鈕
    this.progressElem = document.getElementById('progress');

    this.tRex = null; // 小明

    this.questionsList = questions_list
    this.question = null;
    this.last_questions_amount = 5;
    this.showQuestion = false;

    // 加載雪碧圖，並初始化遊戲
    this.loadImages();
}

window['Runner'] = Runner;

var DEFAULT_WIDTH = 600;
var FPS = 60;

// 遊戲配置參數
Runner.config = {
    SPEED: 3, // 移動速度
    ARCADE_MODE_INITIAL_TOP_POSITION: 35, // 街機模式時，canvas 距頂部的初始距離
    ARCADE_MODE_TOP_POSITION_PERCENT: 0.1, // 街機模式時，canvas 距頁面頂部的距離，佔屏幕高度的百分比
    GAP_COEFFICIENT: 0.6, // 障礙物間隙係數
    MAX_OBSTACLE_DUPLICATION: 2, // 障礙物相鄰的最大重複
    CLEAR_TIME: 500, // 遊戲開始後，等待0.5秒再繪製障礙物
    MAX_SPEED: 10, // 遊戲的最大速度
    MIN_SPEED: 2, // 遊戲的最小速度
    SPEED_BREAKPOINT: 6, // 小明換姿勢時的速度
    ACCELERATION: -0.01, // 減速加速度
    ADD_ACCELERATION: 1, // 點擊加速度
    BOTTOM_PAD: 10, // 小明距 canvas 底部的距離
    MAX_BLINK_COUNT: 3, // 小明的最大眨眼次數,
    RACE_DUSTANCE: 300, // 跑道總長
};

// 遊戲畫布的默認尺寸
Runner.defaultDimensions = {
    WIDTH: DEFAULT_WIDTH,
    HEIGHT: 150,
};

// 遊戲用到的 className
Runner.classes = {
    CONTAINER: 'runner-container',
    CANVAS: 'runner-canvas',
    PLAYER: '', // 預留出的 className，用來控制 canvas 的樣式
    ARCADE_MODE: 'arcade-mode', // 全屏模式
};

// 雪碧圖中圖片的座標信息
Runner.spriteDefinition = {
    LDPI: {
        // 地面
        HORIZON: {
            x: 2,
            y: 54
        },
        // 雲朵
        CLOUD: {
            x: 86,
            y: 2
        },
        // 小仙人掌
        CACTUS_SMALL: {
            x: 228,
            y: 2
        },
        // 大仙人掌
        CACTUS_LARGE: {
            x: 332,
            y: 2
        },
        // 翼龍
        PTERODACTYL: {
            x: 134,
            y: 2
        },
        // 文字
        TEXT_SPRITE: {
            x: 655,
            y: 2
        }, // 小明
        TREX: {
            // x: 848,
            // y: 2
            x: 2,
            y: 104
        }, // 重置遊戲按鈕
        RESTART: {
            x: 110,
            y: 68
        },
        // 金幣
        COIN: {
            x: 400,
            y: 100
        }
    },
};

// 遊戲中用到的鍵盤碼
Runner.keyCodes = {
    JUMP: {
        '38': 1,
        '32': 1
    }, // Up, Space
    DUCK: {
        '40': 1
    }, // Down
    RESTART: {
        '13': 1
    }, // Enter
};

// 遊戲中用到的事件
Runner.events = {
    LOAD: 'load',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    ANIMATION_END: 'webkitAnimationEnd',
    BLUR: "blur",
    FOCUS: "focus"
};

Runner.prototype = {
    init: function () {
        // 生成 canvas 容器元素
        this.containerEl = document.createElement('div');
        this.containerEl.className = Runner.classes.CONTAINER;

        // 生成 canvas
        this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
            this.dimensions.HEIGHT, Runner.classes.PLAYER);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fill();

        // 加載背景類 Horizon
        this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions, this.config.GAP_COEFFICIENT);

        // 將遊戲添加到頁面中
        this.outerContainerEl.appendChild(this.containerEl);

        // 遊戲初始化時繪製出靜態的小明
        this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

        // 更新 canvas
        this.update();

        // 遊戲開始
        this.speedUpBtn.style.display = 'none'
        this.startGameBtn.addEventListener('click', function () {
            if (!this.playing) {
                this.setPlayStatus(true);
                this.update();
            }

            // 開始跳躍
            if (!this.tRex.jumping && !this.tRex.ducking) {
                this.tRex.startJump(this.currentSpeed);
            }
        }.bind(this))

        // 加載距離計數器類 DistanceMeter
        this.distanceMeter = new DistanceMeter(this.canvas,
            this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH);

        // 點擊按鈕加速
        this.speedUpBtn.addEventListener('click', this.speedUp.bind(this))

    },
    speedUp: function () {
        if (this.currentSpeed < this.config.MAX_SPEED) {
            this.currentSpeed += this.config.ADD_ACCELERATION;
        }
    },
    loadImages() {
        // 圖片在雪碧圖中的座標
        this.spriteDef = Runner.spriteDefinition.LDPI;

        // 獲取雪碧圖
        Runner.imageSprite = document.getElementById('offline-resources-1x');

        // 當圖片加載完成（complete 是 DOM 中 Image 對象自帶的一個屬性）
        if (Runner.imageSprite.complete) {
            this.init();
        } else { // 圖片沒有加載完成，監聽其 load 事件
            Runner.imageSprite.addEventListener(Runner.events.LOAD,
                this.init.bind(this));
        }
    },

    // 2
    /** * 更新遊戲幀並進行下一次更新 */
    update: function () {
        this.updatePending = false; // 等待更新 
        var now = getTimeStamp();
        var deltaTime = now - (this.time || now);
        this.time = now;

        if (this.playing) {
            this.clearCanvas();

            // 拿掉開始按鈕
            this.startGameBtn.style.display = 'none';
            this.speedUpBtn.style.display = 'flex'

            // 8
            if (this.tRex.jumping) {
                this.tRex.updateJump(deltaTime);
            }

            // 6 更新遊戲（移動距離）
            this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
            var playAchievementSound = this.distanceMeter.update(deltaTime,
                Math.ceil(this.distanceRan));

            // 5 遊戲減速
            if (this.currentSpeed > this.config.MIN_SPEED && !this.playing) {
                this.currentSpeed += this.config.ACCELERATION;
            }

            this.runningTime += deltaTime;
            var hasObstacles = this.runningTime > this.config.CLEAR_TIME;

            // 3 剛開始 this.playingIntro 未定義 !this.playingIntro 爲真
            // 6 直到開場動畫結束小明再移動地面
            if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                this.playIntro(); // 執行開場動畫
            }

            if (this.playingIntro) {
                //收到的第一個參數爲 0，這樣在這個方法內部計算出來的位移也是 0。所以只要還在執行開場動畫，地面就不會移動。
                this.horizon.update(0, this.currentSpeed, hasObstacles);
            } else {
                deltaTime = !this.activated ? 0 : deltaTime;
                this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);

            }
            // 時間紀錄
            var timeScore = this.runningTime / 1000;
            document.getElementById('time').innerHTML = Math.round(timeScore * 100) / 100;

            var question_gap = this.config.RACE_DUSTANCE / 6;
            if (this.distanceMeter.finishDistance ===
                question_gap * (6 - this.last_questions_amount)) {
                this.last_questions_amount -= 1;
                this.horizon.update(deltaTime, this.currentSpeed, hasObstacles, true);
            }

            //9 碰撞
            var collision = hasObstacles &&
                checkForCollision(this.horizon.obstacles[0], this.tRex);

            if (!collision) {
                this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;

                if (this.currentSpeed > this.config.MIN_SPEED) {
                    this.currentSpeed += this.config.ACCELERATION;
                }
            } else {
                this.collisionHandle(this.horizon.obstacles[0].typeConfig);
                this.horizon.obstacles[0].remove = true;
            }

            // 記錄行走距離
            this.progressElem.value = this.distanceMeter.finishDistance / this.config.RACE_DUSTANCE * 100;

            // 結束遊戲
            if (this.distanceMeter.finishDistance >= this.config.RACE_DUSTANCE) {
                this.gameOver();
            }
        }

        // 遊戲變爲開始狀態或小明還沒有眨三次眼
        if (this.playing || (!this.activated &&
                this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
            this.tRex.update(deltaTime);

            // 9 碰撞檢測
            var collision = hasObstacles &&
                checkForCollision(this.horizon.obstacles[0], this.tRex, this.ctx);

            // 進行下一次更新 
            this.scheduleNextUpdate();
        }
    },
    // 碰撞後得分或進入題目
    collisionHandle: function (obstacleConfig) {
        if (obstacleConfig.questionFlag && this.questionsList.length > 0) {
            this.showQuestion = true;
            this.question = new Question(this.questionsList[4 - this.last_questions_amount]);
            this.stop();
            this.clearQuestion();
            if (this.currentSpeed > this.config.MIN_SPEED + 2) {
                this.currentSpeed -= 2;
            }

        } else {
            this.addScore(obstacleConfig.score)
        }
    },
    clearQuestion: function () {
        // 繼續前進
        var keepGoingBtn = document.getElementById('keep-going-btn')
        keepGoingBtn.addEventListener('click', function () {
            if (this.question) {
                this.question.finish();
                this.addScore(this.question.result ? this.question.getScore : 0);
            }
            this.showQuestion = false;
            this.play();
            // 清除題目
            this.question = null;

        }.bind(this));
    },
    addScore: function (score) {
        this.score += score;
        document.getElementById('score').innerHTML = this.score;
    },
    clearCanvas: function () {
        this.ctx.clearRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
    },
    scheduleNextUpdate: function () {
        if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
    },
    // 監聽鍵盤事件
    startListening: function () {
        document.addEventListener(Runner.events.KEYDOWN, this);
        document.addEventListener(Runner.events.KEYUP, this);
    },
    stopListening: function () {
        document.removeEventListener(Runner.events.KEYDOWN, this);
        document.removeEventListener(Runner.events.KEYUP, this);
    },
    // 用來處理 EventTarget（這裏就是 Runner 類） 上發生的事件 
    // 當事件被發送到 EventListener 時，瀏覽器就會自動呼叫這個方法 
    handleEvent: function (e) {
        return (function (eType, events) {
            switch (eType) {
                case events.KEYDOWN:
                    this.onKeyDown(e);
                    break;
                case events.KEYUP:
                    this.onKeyUp(e);
                    break;
                default:
                    break;
            }
        }.bind(this))(e.type, Runner.events);
    },
    // onKeyDown 定義
    onKeyDown: function (e) {
        if (!this.crashed && !this.paused) {
            if (Runner.keyCodes.JUMP[e.keyCode]) {
                e.preventDefault();
                if (!this.playing) {
                    this.setPlayStatus(true);
                    this.update();
                }

                // 開始跳躍
                if (!this.tRex.jumping && !this.tRex.ducking) {
                    this.tRex.startJump(this.currentSpeed);
                }

                // 當按下 ↓ 鍵後，如果小明正在跳躍，就會快速下落，如果小明在地上，就會進入躲閃狀態
            } else if (this.playing && Runner.keyCodes.DUCK[e.keyCode]) {
                e.preventDefault();

                if (this.tRex.jumping) {
                    this.tRex.setSpeedDrop(); // 加速下落
                } else if (!this.tRex.jumping && !this.tRex.ducking) {
                    this.tRex.setDuck(true); // 進入躲閃狀態
                }
            }
        }
    },
    // onKeyUp 定義
    onKeyUp: function (e) {
        // 8
        var keyCode = String(e.keyCode);
        var isjumpKey = Runner.keyCodes.JUMP[keyCode];

        if (this.isRunning() && isjumpKey) { // 跳躍
            this.tRex.endJump();
        } else if (Runner.keyCodes.DUCK[keyCode]) { // 躲避狀態
            this.tRex.speedDrop = false;
            this.tRex.setDuck(false);
            // 10
        } else if (this.crashed) {
            var deltaTime = getTimeStamp() - this.time;
            // 按下回車鍵或者等待 750 毫秒後，按下空格鍵，重新開始遊戲
            if (Runner.keyCodes.RESTART[keyCode] ||
                (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
                    Runner.keyCodes.JUMP[keyCode])) {
                this.restart();
            }
        }
    },
    // 8 是否遊戲正在進行
    isRunning: function () {
        return !!this.raqId;
    },
    setPlayStatus: function (isPlaying) {
        this.playing = isPlaying;
    },

    // 3
    /**
     * 遊戲被激活時的開場動畫
     * 將 canvas 的寬度調整到最大
     */
    playIntro: function () {
        if (!this.activated && !this.crashed) {
            this.playingIntro = true; // 正在執行開場動畫
            this.tRex.playingIntro = true; // 小明執行開場動畫

            // 定義 CSS 動畫關鍵幀
            var keyframes = '@-webkit-keyframes intro { ' +
                'from { width:' + Trex.config.WIDTH + 'px }' +
                'to { width: ' + this.dimensions.WIDTH + 'px }' +
                '}';

            var styleEl = document.createElement('style'),
                styleSheet;

            // Append style element to head
            document.head.appendChild(styleEl);

            // Grab style sheet
            styleSheet = styleEl.sheet;

            // 將動畫關鍵幀插入頁面中的第一個樣式表
            styleSheet.insertRule(keyframes, 0);

            this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
            this.containerEl.style.width = this.dimensions.WIDTH + 'px';

            // 監聽動畫。當觸發結束事件時，設置遊戲爲開始狀態
            this.containerEl.addEventListener(Runner.events.ANIMATION_END,
                this.startGame.bind(this));

            this.setPlayStatus(true); // 設置遊戲爲進行狀態
            this.activated = true; // 遊戲彩蛋被激活
        } else if (!this.activated && this.crashed) {

            // 這個 restart 方法的邏輯這裏先不實現
            this.restart();
        }
    },
    /**
     * 更新遊戲爲開始狀態
     */
    startGame: function () {
        // 3
        // 全屏模式
        // this.setArcadeMode();
        // 8
        this.tRex.playingIntro = false; // 小明的開場動畫結束

        // 
        this.playingIntro = false; // 開場動畫結束
        this.containerEl.style.webkitAnimation = '';

        // 3 
        // 監聽窗口 blur、focus 事件
        window.addEventListener(Runner.events.BLUR,
            this.onVisibilityChange.bind(this));

        window.addEventListener(Runner.events.FOCUS,
            this.onVisibilityChange.bind(this));
    },
    /**
     * 當頁面失焦時，暫停遊戲
     */
    onVisibilityChange: function (e) {
        if (document.hidden || document.webkitHidden || e.type == 'blur' ||
            document.visibilityState != 'visible') {
            this.stop();

        } else if (!this.crashed && !this.showQuestion) {
            this.play();
        }
    },
    play: function () {
        if (!this.crashed) {
            this.setPlayStatus(true);
            this.paused = false;
            this.time = getTimeStamp();
            this.update();
            this.tRex.reset();
        }
    },
    stop: function () {
        this.setPlayStatus(false);
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    },
    /**
     * 設置進入街機模式時 canvas 容器的縮放比例
     */
    setArcadeModeContainerScale: function () {
        var windowHeight = window.innerHeight;
        var scaleHeight = windowHeight / this.dimensions.HEIGHT;
        var scaleWidth = window.innerWidth / this.dimensions.WIDTH;
        var scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
        var scaledCanvasHeight = this.dimensions.HEIGHT * scale;

        // 將 canvas 橫向佔滿屏幕，縱向距離頂部 10% 窗口高度處
        var translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
                    Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
                Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT)) *
            window.devicePixelRatio;
        this.containerEl.style.transform = 'scale(' + scale + ') translateY(' +
            translateY + 'px)';
    },
    /**
     * 開啓街機模式（全屏）
     */
    setArcadeMode: function () {
        document.body.classList.add(Runner.classes.ARCADE_MODE);
        this.setArcadeModeContainerScale();
    },

    // 6
    // 遊戲結束
    gameOver: function () {
        this.stop();
        // 10
        this.crashed = true; // 小明撞到了障礙物
        this.distanceMeter.achievement = false; // 結束分數閃動特效

        // 更新小明爲碰撞狀態
        this.tRex.update(100, Trex.status.CRASHED);

        // 繪製遊戲結束面板
        if (!this.gameOverPanel) {
            this.gameOverPanel = new GameOverPanel(this.canvas,
                this.spriteDef.TEXT_SPRITE, this.spriteDef.RESTART,
                this.dimensions);
        } else {
            this.gameOverPanel.draw();
        }
        // 出現結束彈窗
        document.getElementById('end-game-modal').classList.add('active');

        // 重置時間
        this.time = getTimeStamp();

        var timeScore = this.runningTime / 1000;
        document.getElementById('end-game-time').innerHTML = Math.round(timeScore * 100) / 100;
        document.getElementById('end-game-score').innerHTML = this.score;

    },

    // 重新開始遊戲
    restart: function () {
        if (!this.raqId) {
            this.runningTime = 0; // 重置遊戲運行時間
            this.setPlayStatus(true); // 遊戲重置爲進行狀態
            this.paused = false; // 遊戲沒有暫停
            this.crashed = false; // 小明沒有撞到障礙物
            this.distanceRan = 0; // 重置遊戲移動距離（分數）
            this.currentSpeed = this.config.SPEED; // 重置遊戲當前的速度
            this.time = getTimeStamp(); // 重置計時器
            this.score = 0; // 重置分數
            this.addScore(0);
            this.last_questions_amount = 5; // 重置剩餘題目數
            this.clearCanvas(); // 清空畫布
            this.distanceMeter.reset(); // 重置分數類
            this.horizon.reset(); // 重置背景類
            this.tRex.reset(); // 重置小明類
            this.update(); // 重置後更新遊戲
        }
    },
};

/**
 * 生成 canvas 元素
 * @param {HTMLElement} container canva 的容器
 * @param {Number} width canvas 的寬度
 * @param {Number} height canvas 的高度
 * @param {String} opt_className 給 canvas 添加的類名（可選）
 * @return {HTMLCanvasElement}
 */
function createCanvas(container, width, height, opt_className) {
    var canvas = document.createElement('canvas');
    canvas.className = opt_className ?
        opt_className + ' ' + Runner.classes.CANVAS :
        Runner.classes.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);

    return canvas;
}

/**
 * HorizonLine 地面背景類
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {Object} spritePos 雪碧圖中的位置
 */
function HorizonLine(canvas, spritePos) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.dimensions = {}; // 地面的尺寸
    this.spritePos = spritePos; // 雪碧圖中地面的位置
    this.sourceXPos = []; // 雪碧圖中地面的兩種地形的 x 座標
    this.xPos = []; // canvas 中地面的 x 座標
    this.yPos = 0; // canvas 中地面的 y 座標

    this.bumpThreshold = 0.5; // 隨機地形係數，控制兩種地形的出現頻率

    this.init();
    this.draw();
}

HorizonLine.dimensions = {
    WIDTH: 600,
    HEIGHT: 12,
    YPOS: 127, // 繪製到 canvas 中的 y 座標
};

HorizonLine.prototype = {
    // 1
    init: function () {
        for (const d in HorizonLine.dimensions) {
            if (HorizonLine.dimensions.hasOwnProperty(d)) {
                const elem = HorizonLine.dimensions[d];
                this.dimensions[d] = elem;
            }
        }
        this.sourceXPos = [this.spritePos.x,
            this.spritePos.x + this.dimensions.WIDTH
        ];
        this.xPos = [0, HorizonLine.dimensions.WIDTH];
        this.yPos = HorizonLine.dimensions.YPOS;
    },
    draw: function () {
        // 使用 canvas 中 9 個參數的 drawImage 方法
        this.ctx.drawImage(
            Runner.imageSprite, // 原圖片
            this.sourceXPos[0], this.spritePos.y, // 原圖中裁剪區域的起點座標
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
            this.xPos[0], this.yPos, // canvas 中繪製區域的起點座標
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
        );
        this.ctx.drawImage(
            Runner.imageSprite,
            this.sourceXPos[1], this.spritePos.y,
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
            this.xPos[1], this.yPos,
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
        );
    },
    /** * 更新地面的 x 座標 
     * * @param {Number} pos 地面的位置 
     * * @param {Number} incre 移動距離 
     * */
    updateXPos: function (pos, incre) {
        var line1 = pos;
        var line2 = pos === 0 ? 1 : 0; // 第一段地面向左移動，第二段地面隨之 
        this.xPos[line1] -= incre;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
        // 第一段地面移出了  canvas 
        if (this.xPos[line1] <= -this.dimensions.WIDTH) {
            // 將第一段地面放到 canvas 右側 
            this.xPos[line1] += this.dimensions.WIDTH * 2; // 此時第二段地面的 x 座標剛好和 canvas 的 x 座標對齊 
            this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH; // 給放到 canvas 後面的地面隨機地形 
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
    },
    // 2
    /** * 獲取隨機的地形 */
    getRandomType: function () {
        return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
    },

    /** * 更新地面 
     * * @param {Number} deltaTime 間隔時間 
     * * @param {Number} speed 速度 
     * */
    update: function (deltaTime, speed) {
        // 計算地面每次移動的距離（距離 = 速度 x 時間）時間由幀率和間隔時間共同決定 
        var incre = Math.floor(speed * (FPS / 1000) * deltaTime);
        if (this.xPos[0] <= 0) {
            this.updateXPos(0, incre);
        } else {
            this.updateXPos(1, incre);
        }
        this.draw();
    },
    // 重置兩段地面的座標
    reset: function () {
        this.xPos[0] = 0;
        this.xPos[1] = HorizonLine.dimensions.WIDTH;
    },
};

/**
 * Horizon 背景類
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {Object} spritePos 雪碧圖中的位置
 */
function Horizon(canvas, spritePos, dimensions, gapCoefficient) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.spritePos = spritePos;

    // 4
    this.dimensions = dimensions;

    // 5
    this.gapCoefficient = gapCoefficient;
    this.obstacles = []; // 存儲障礙物
    this.obstacleHistory = []; // 記錄存儲的障礙物的類型
    this.questionFlag = false;

    // 雲的頻率
    this.cloudFrequency = Cloud.config.CLOUD_FREQUENCY;

    // 雲
    this.clouds = [];
    this.cloudSpeed = Cloud.config.BG_CLOUD_SPEED;

    // 地面
    this.horizonLine = null;

    this.init();
}

Horizon.prototype = {
    init: function () {
        this.addCloud();
        this.horizonLine = new HorizonLine(this.canvas, this.spritePos.HORIZON);
    },

    // 2
    update: function (deltaTime, currentSpeed, updateObstacles, questionFlag) {
        this.horizonLine.update(deltaTime, currentSpeed);
        this.updateCloud(deltaTime, currentSpeed);
        this.questionFlag = questionFlag;

        if (updateObstacles) {
            this.updateObstacles(deltaTime, currentSpeed);
        }
    },

    // 4
    addCloud: function () {
        this.clouds.push(new Cloud(this.canvas, this.spritePos.CLOUD, this.dimensions.WIDTH));
    },
    updateCloud: function (deltaTime, speed) {
        var cloudSpeed = Math.ceil(deltaTime * this.cloudSpeed * speed / 1000);
        var numClouds = this.clouds.length;

        if (numClouds) {
            for (var i = numClouds - 1; i >= 0; i--) {
                this.clouds[i].update(cloudSpeed);
            }

            var lastCloud = this.clouds[numClouds - 1];

            // 檢查是否需要添加新的雲朵
            // 添加雲朵的條件：雲朵數量少於最大數量、
            // 最後一個雲朵後面的空間大於它的間隙、
            // 雲朵出現頻率符合要求
            if (numClouds < Cloud.config.MAX_CLOUDS &&
                (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
                this.cloudFrequency > Math.random()) {
                this.addCloud();
            }

            // 刪除 remove 屬性爲 true 的雲朵
            this.clouds = this.clouds.filter(function (item) {
                return !item.remove;
            });
        } else {
            this.addCloud();
        }
    },

    // 5
    addNewObstacle: function (currentSpeed, questionFlag) {
        // 隨機障礙物
        var obstacleTypeIndex = questionFlag ? 1 : 0;
        var obstacleType = Obstacle.types[obstacleTypeIndex];

        // 通過檢查後，存儲新添加的障礙物
        var obstacleSpritePos = this.spritePos[obstacleType.type];

        // 存儲障礙物
        this.obstacles.push(new Obstacle(this.canvas, obstacleType,
            obstacleSpritePos, this.dimensions,
            this.gapCoefficient, currentSpeed, obstacleType.width));

        // 存儲障礙物類型
        this.obstacleHistory.unshift(obstacleType.type);

        // 若 history 數組長度大於 1， 清空最前面兩個數據
        if (this.obstacleHistory.length > 1) {
            this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
        }
    },
    updateObstacles: function (deltaTime, currentSpeed) {
        if (this.questionFlag) {
            console.log('建立仙人掌')
            this.addNewObstacle(currentSpeed, this.questionFlag);
        }

        // 複製存儲的障礙物
        var updatedObstacles = this.obstacles.slice(0);

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.update(deltaTime, currentSpeed);

            // 刪除被標記的障礙物
            if (obstacle.remove) {
                updatedObstacles.shift();
            }
        }

        // 更新存儲的障礙物
        this.obstacles = updatedObstacles;


        if (this.obstacles.length > 0) {
            var lastObstacle = this.obstacles[this.obstacles.length - 1];

            // 滿足添加障礙物的條件
            if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                lastObstacle.isVisible() &&
                (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                this.dimensions.WIDTH) {
                this.addNewObstacle(currentSpeed);
                lastObstacle.followingObstacleCreated = true;
            }
        } else { // 沒有存儲障礙物，直接添加
            this.addNewObstacle(currentSpeed, '');
        }
    },
    // 重置背景類
    reset: function () {
        this.obstacles = []; // 清空障礙物
        this.horizonLine.reset(); // 重置地面
    },
};

// 獲取時間戳 
function getTimeStamp() {
    return performance.now();
}

/**
 * 雲朵類
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {Object} spritePos 圖片在雪碧圖中的位置信息
 * @param {Number} containerWidth 容器的寬度
 */
function Cloud(canvas, spritePos, containerWidth) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.containerWidth = containerWidth;

    // 座標
    this.xPos = containerWidth;
    this.yPos = 0;

    // 該雲朵是否需要刪除
    this.remove = false;
    // 隨機雲朵之間的間隙
    this.cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP,
        Cloud.config.MAX_CLOUD_GAP);

    this.init();
}

Cloud.config = {
    WIDTH: 46,
    HEIGHT: 14,
    MIN_CLOUD_GAP: 100, // 雲之間的最小間隙
    MAX_CLOUD_GAP: 400, // 雲之間的最大間隙
    MIN_SKY_LEVEL: 71, // 雲的最小高度
    MAX_SKY_LEVEL: 30, // 雲的最大高度
    BG_CLOUD_SPEED: 0.2, // 雲的速度
    CLOUD_FREQUENCY: 0.5, // 雲的頻率
    MAX_CLOUDS: 6 // 雲的最大數量
};

Cloud.prototype = {
    init: function () {
        this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL,
            Cloud.config.MIN_SKY_LEVEL);
        this.draw();
    },
    draw: function () {
        this.ctx.save();

        var sourceWidth = Cloud.config.WIDTH;
        var sourceHeight = Cloud.config.HEIGHT;
        var outputWidth = sourceWidth;
        var outputHeight = sourceHeight;

        this.ctx.drawImage(
            Runner.imageSprite,
            this.spritePos.x, this.spritePos.y,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            outputWidth, outputHeight
        );

        this.ctx.restore();
    },
    update: function (speed) {
        if (!this.remove) {
            this.xPos -= speed;
            this.draw();

            // 雲朵移出 canvas，將其刪除
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    },
    // 雲朵是否移出 canvas
    isVisible: function () {
        return this.xPos + Cloud.config.WIDTH > 0;
    },
};

/**
 * 獲取 [min, max] 之間的隨機數
 * @param {Number} min 最小值
 * @param {Number} max 最大值
 * @return {Number}
 */
function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 障礙物類
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {String} type 障礙物類型
 * @param {Object} spriteImgPos 在雪碧圖中的位置
 * @param {Object} dimensions 畫布尺寸
 * @param {Number} gapCoefficient 間隙係數
 * @param {Number} speed 速度
 * @param {Number} opt_xOffset x 座標修正
 */
function Obstacle(canvas, type, spriteImgPos, dimensions,
    gapCoefficient, speed, opt_xOffset) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.typeConfig = type; // 障礙物類型
    this.spritePos = spriteImgPos; // 在雪碧圖中的位置
    this.gapCoefficient = gapCoefficient; // 間隔係數
    this.dimensions = dimensions;
    this.collisionBoxes = []; // 存儲碰撞盒子

    // 每組障礙物的數量（隨機 1~3 個）
    this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);

    this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
    this.yPos = 0;

    this.remove = false; // 是否可以被刪除
    this.gap = 0; // 間隙

    // 非靜態障礙物的屬性
    this.currentFrame = 0; // 當前動畫幀
    this.timer = 0; // 動畫幀切換計時器

    this.init(speed);
}

Obstacle.MAX_GAP_COEFFICIENT = 1.5; // 最大間隙係數
Obstacle.MAX_OBSTACLE_LENGTH = 1; // 每組障礙物的最大數量

Obstacle.types = [{
    type: 'COIN', // 金幣
    width: 35,
    height: 35,
    yPos: 95, // 在 canvas 上的 y 座標
    minGap: 120, // 最小間距
    minSpeed: 0,
    score: 10
}, {
    type: 'CACTUS_LARGE', // 大仙人掌
    width: 25,
    height: 50,
    yPos: 90,
    minGap: 10,
    minSpeed: 0,
    questionFlag: true
}];

Obstacle.prototype = {
    init: function (speed) {

        this.width = this.typeConfig.width * this.size;


        // 檢查障礙物是否可以被放置在不同的高度
        if (Array.isArray(this.typeConfig.yPos)) {
            var yPosConfig = this.typeConfig.yPos;
            // 隨機高度
            this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
        } else {
            this.yPos = this.typeConfig.yPos;
        }

        this.draw();

        // 障礙物的間隙隨遊戲速度變化而改變
        this.gap = this.getGap(this.gapCoefficient, speed);
    },
    /**
     * 獲取障礙物的間隙
     * @param {Number} gapCoefficient 間隙係數
     * @param {Number} speed 速度
     */
    getGap: function (gapCoefficient, speed) {
        var minGap = Math.round(this.width * speed +
            this.typeConfig.minGap * gapCoefficient);
        var maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
        return getRandomNum(minGap, maxGap);
    },
    draw: function () {
        var sourceWidth = this.typeConfig.width;
        var sourceHeight = this.typeConfig.height;

        // 根據每組障礙物的數量計算障礙物在雪碧圖上的座標
        var sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) +
            this.spritePos.x;

        // 如果存在動畫幀，則計算當前動畫幀在雪碧圖中的座標
        if (this.currentFrame > 0) {
            sourceX += sourceWidth * this.currentFrame;
        }

        this.ctx.drawImage(
            Runner.imageSprite,
            sourceX, this.spritePos.y,
            sourceWidth * this.size, sourceHeight,
            this.xPos, this.yPos,
            this.typeConfig.width * this.size, this.typeConfig.height
        );
    },
    update: function (deltaTime, speed) {
        if (!this.remove) {
            this.xPos -= Math.floor((speed * FPS / 1000) * Math.round(deltaTime));

            // 如果有動畫幀，則更新
            if (this.typeConfig.numFrames) {
                this.timer += deltaTime;

                if (this.timer >= this.typeConfig.frameRate) {
                    // 第一幀 currentFrame 爲 0，第二幀 currentFrame 爲 1
                    this.currentFrame =
                        this.currentFrame == this.typeConfig.numFrames - 1 ?
                        0 : this.currentFrame + 1;
                    this.timer = 0;
                }
            }
            this.draw();

            // 標記移出畫布的障礙物
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    },
    // 障礙物是否還在畫布中
    isVisible: function () {
        return this.xPos + this.width > 0;
    },
    // 複製碰撞盒子
    cloneCollisionBoxes: function () {
        var collisionBoxes = this.typeConfig.collisionBoxes;

        for (var i = collisionBoxes.length - 1; i >= 0; i--) {
            this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
                collisionBoxes[i].y, collisionBoxes[i].width,
                collisionBoxes[i].height);
        }
    },
};

/**
 * 記錄移動的距離（分數等於移動距離）
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {Object} spritePos 圖片在雪碧圖中的位置
 * @param {Number} canvasWidth 畫布的寬度
 */
function DistanceMeter(canvas, spritePos, canvasWidth) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.config = DistanceMeter.config;
    this.spritePos = spritePos;

    this.x = 0; // 分數顯示在 canvas 中的 x 座標
    this.y = 5;

    this.maxScore = 0; // 遊戲分數上限
    this.highScore = []; // 存儲最高分數的每一位數字

    this.digits = []; // 存儲分數的每一位數字
    this.achievement = false; // 是否進行閃動特效
    this.defaultString = ''; // 遊戲的默認距離（00000）
    this.flashTimer = 0; // 動畫計時器
    this.flashIterations = 0; // 特效閃動的次數

    this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS; // 分數的最大位數
    this.finishDistance = 0, // 已行走距離

        this.init(canvasWidth);
}

DistanceMeter.config = {
    MAX_DISTANCE_UNITS: 5, // 分數的最大位數
    ACHIEVEMENT_DISTANCE: 100, // 每 100 米觸發一次閃動特效
    COEFFICIENT: 0.025, // 將像素距離轉換爲比例單位的係數
    FLASH_DURATION: 1000 / 4, // 一閃的時間（一次閃動分別兩閃：從有到無，從無到有）
    FLASH_ITERATIONS: 3, // 閃動的次數
};

DistanceMeter.dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11, // 加上間隔後每個數字的寬度
};

DistanceMeter.prototype = {
    init: function (width) {
        var maxDistanceStr = ''; // 遊戲的最大距離

        this.calcXPos(width); // 計算分數顯示在 canvas 中的 x 座標

        for (var i = 0; i < this.maxScoreUnits; i++) {
            // this.draw(i, 0); // 第一次遊戲，不繪製最高分
            this.defaultString += '0'; // 默認初始分數 00000
            maxDistanceStr += '9'; // 默認最大分數 99999
        }

        this.maxScore = parseInt(maxDistanceStr);
    },
    calcXPos: function (canvasWidth) {
        this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH *
            (this.maxScoreUnits + 1));
    },
    /**
     * 將分數繪製到 canvas 上
     * @param {Number} digitPos 數字在分數中的位置
     * @param {Number} value 數字的具體值（0-9）
     * @param {Boolean} opt_highScore 是否顯示最高分
     */
    draw: function (digitPos, value, opt_highScore) {
        // 在雪碧圖中的座標
        var sourceX = this.spritePos.x + DistanceMeter.dimensions.WIDTH * value;
        var sourceY = this.spritePos.y + 0;
        var sourceWidth = DistanceMeter.dimensions.WIDTH;
        var sourceHeight = DistanceMeter.dimensions.HEIGHT;

        // 繪製到 canvas 時的座標
        var targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
        var targetY = this.y;
        var targetWidth = DistanceMeter.dimensions.WIDTH;
        var targetHeight = DistanceMeter.dimensions.HEIGHT;

        this.ctx.save();

        if (opt_highScore) { // 顯示最高分
            var hightScoreX = this.x - (this.maxScoreUnits * 2) *
                DistanceMeter.dimensions.WIDTH;

            this.ctx.translate(hightScoreX, this.y);
        } else { // 不顯示最高分
            this.ctx.translate(this.x, this.y);
        }

        this.ctx.drawImage(
            Runner.imageSprite,
            sourceX, sourceY,
            sourceWidth, sourceHeight,
            targetX, targetY,
            targetWidth, targetHeight
        );

        this.ctx.restore();
    },
    /**
     * 將遊戲移動的像素距離轉換爲真實的距離
     * @param {Number} distance 遊戲移動的像素距離
     */
    getActualDistance: function (distance) {
        return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
    },
    update: function (deltaTime, distance) {
        var paint = false; // 是否繪製分數
        var playSound = false; // 是否播放音效

        distance = this.getActualDistance(distance);

        // 分數超出上限時，上限增加一位數。超出上限兩位數時，分數置零
        if (distance > this.maxScore &&
            this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS) {
            this.maxScoreUnits++;
            this.maxScore = parseInt(this.maxScore + '9');
        } else {
            this.distance = 0;
        }

        if (distance > 0) {
            // 分數前面補零來湊位數
            var distanceStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
            this.digits = distanceStr.split('');
        } else {
            // 將默認分數 00000 中的每一位數字存到數組中
            this.digits = this.defaultString.split('');
        }

        // 繪製當前分
        if (paint) {
            for (var i = this.digits.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.digits[i]));
            }
        }

        this.finishDistance = distance

        // 繪製最高分
        return playSound;
    },
    // 重置當前分數爲 '00000'
    reset: function () {
        this.update(0); // 更新分數
        this.achievement = false; // 分數不進行閃動特效
    }
};

/**
 * 小明類
 * @param {HTMLCanvasElement} canvas 畫布
 * @param {Object} spritePos 圖片在雪碧圖中的座標
 */
function Trex(canvas, spritePos) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spritePos;

    this.xPos = 0;
    this.yPos = 0;
    this.groundYPos = 0; // 小明在地面上時的 y 座標

    this.currentFrame = 0; // 當前的動畫幀
    this.currentAnimFrames = []; // 存儲當前狀態的動畫幀在雪碧圖中的 x 座標
    this.blinkDelay = 0; // 眨眼間隔的時間（隨 機）
    this.blinkCount = 0; // 眨眼次數
    this.animStartTime = 0; // 小明眨眼動畫開始時間
    this.timer = 0; // 計時器
    this.msPerFrame = 1000 / FPS; // 幀率
    this.status = Trex.status.WAITING; // 當前的狀態
    this.config = Trex.config;

    this.jumping = false; // 是否跳躍
    this.ducking = false; // 是否閃避（俯身）
    this.jumpVelocity = 0; // 跳躍的速度
    this.reachedMinHeight = false; // 是否達到最低高度
    this.speedDrop = false; // 是否加速下降
    this.jumpCount = 0; // 跳躍的次數
    this.jumpspotX = 0; // 跳躍點的 x 座標

    this.init();
}

Trex.config = {
    GRAVITY: 0.6, // 引力
    WIDTH: 44, // 站立時的寬度
    HEIGHT: 62,
    WIDTH_DUCK: 59, // 俯身時的寬度
    HEIGHT_DUCK: 25,
    MAX_JUMP_HEIGHT: 30, // 最大跳躍高度
    MIN_JUMP_HEIGHT: 30, // 最小跳躍高度
    SPRITE_WIDTH: 262, // 站立的小明在雪碧圖中的總寬度
    DROP_VELOCITY: -5, // 下落的速度
    INITIAL_JUMP_VELOCITY: -10, // 初始跳躍速度
    SPEED_DROP_COEFFICIENT: 3, // 下落時的加速係數（越大下落的越快）
    INTRO_DURATION: 1500, // 開場動畫的時間
    START_X_POS: 50, // 開場動畫結束後，小明在 canvas 上的 x 座標
};

Trex.BLINK_TIMING = 7000; // 眨眼最大間隔的時間

// 小明的狀態
Trex.status = {
    CRASHED: 'CRASHED', // 撞到障礙物
    DUCKING: 'DUCKING', // 正在閃避（俯身）
    JUMPING: 'JUMPING', // 正在跳躍
    RUNNING: 'RUNNING', // 正在奔跑
    WAITING: 'WAITING', // 正在等待（未開始遊戲）
};

// 爲不同的狀態配置不同的動畫幀
Trex.animFrames = {
    WAITING: {
        frames: 0,
        msPerFrame: 1000 / 3
    },
    RUNNING: {
        frames: [80, 160],
        msPerFrame: 1000 / 12
    },
    CRASHED: {
        frames: [240],
        msPerFrame: 1000 / 60
    },
    JUMPING: {
        frames: [240],
        msPerFrame: 1000 / 60
    },
    DUCKING: {
        frames: [264, 323],
        msPerFrame: 1000 / 8
    },
};

Trex.prototype = {
    init: function () {
        // 獲取小明站在地面上時的 y 座標
        this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
            Runner.config.BOTTOM_PAD;
        this.yPos = this.groundYPos; // 小明的 y 座標初始化

        this.draw(0, 0); // 繪製小明的第一幀圖片

        this.update(0, Trex.status.WAITING); // 初始爲等待狀態

        // 最低跳躍高度
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
    },
    /**
     * 繪製小明
     * @param {Number} x 當前幀相對於第一幀的 x 座標
     * @param {Number} y 當前幀相對於第一幀的 y 座標
     */
    draw: function (x, y) {
        // 在雪碧圖中的座標
        var sourceX = x + this.spritePos.x;
        var sourceY = y + this.spritePos.y;

        // 在雪碧圖中的寬高
        var sourceWidth = this.ducking && this.status != Trex.status.CRASHED ?
            this.config.WIDTH_DUCK : this.config.WIDTH;
        var sourceHeight = this.config.HEIGHT;

        // 繪製到 canvas 上時的高度
        var outputHeight = sourceHeight;

        // 躲避狀態.
        if (this.ducking && this.status != Trex.status.CRASHED) {
            this.ctx.drawImage(
                Runner.imageSprite,
                sourceX, sourceY,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                this.config.WIDTH_DUCK, outputHeight
            );
        } else {
            // 躲閃狀態下撞到障礙物
            if (this.ducking && this.status == Trex.status.CRASHED) {
                this.xPos++;
            }
            // 奔跑狀態
            this.ctx.drawImage(
                Runner.imageSprite,
                sourceX, sourceY,
                sourceWidth, sourceHeight,
                this.xPos, this.yPos,
                this.config.WIDTH, outputHeight
            );
        }

        this.ctx.globalAlpha = 1;
    },
    /**
     * 更新小明
     * @param {Number} deltaTime 間隔時間
     * @param {String} opt_status 小明的狀態
     */
    update: function (deltaTime, opt_status) {
        this.timer += deltaTime;

        // 更新狀態的參數
        if (opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;

            if (opt_status == Trex.status.WAITING) {
                this.animStartTime = getTimeStamp(); // 設置眨眼動畫開始的時間
                this.setBlinkDelay(); // 設置眨眼間隔的時間
            }
        }

        if (this.status == Trex.status.WAITING) {
            // 小明眨眼
            this.blink(getTimeStamp());
        } else {
            // 繪製動畫幀
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }

        if (this.timer >= this.msPerFrame) {
            // 更新當前動畫幀，如果處於最後一幀就更新爲第一幀，否則更新爲下一幀
            this.currentFrame = this.currentFrame ==
                this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
            // 重置計時器
            this.timer = 0;
        }

        // 正在執行開場動畫，將小明向右移動 50 像素
        if (this.playingIntro && this.xPos < this.config.START_X_POS) {
            this.xPos += Math.round((this.config.START_X_POS /
                this.config.INTRO_DURATION) * deltaTime);
        }
    },
    // 設置眨眼間隔的時間
    setBlinkDelay: function () {
        this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
    },
    // 小明眨眼
    blink: function (time) {
        var deltaTime = time - this.animStartTime;

        // 間隔時間大於隨機獲取的眨眼間隔時間才能眨眼
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);

            // 正在眨眼
            if (this.currentFrame == 1) {
                this.setBlinkDelay(); // 重新設置眨眼間隔的時間
                this.animStartTime = time; // 更新眨眼動畫開始的時間
                this.blinkCount++; // 眨眼次數加一
            }
        }
    },
    // 開始跳躍
    startJump: function (speed) {
        if (!this.jumping) {
            // 更新小明爲跳躍狀態 
            this.update(0, Trex.status.JUMPING);

            // 根據遊戲的速度調整跳躍的速度
            this.jumpVelocity = this.config.INITIAL_JUMP_VELOCITY - (speed / 10);

            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
        }
    },
    // 更新小明跳躍時的動畫幀
    updateJump: function (deltaTime) {
        var msPerFrame = Trex.animFrames[this.status].msPerFrame; // 獲取當前狀態的幀率
        var framesElapsed = deltaTime / msPerFrame;

        // 加速下落
        if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity *
                this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
        } else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }

        // 跳躍的速度受重力的影響，向上逐漸減小，然後反向
        this.jumpVelocity += this.config.GRAVITY * framesElapsed;

        // 達到了最低允許的跳躍高度
        if (this.yPos < this.minJumpHeight || this.speedDrop) {
            this.reachedMinHeight = true;
        }

        // 達到了最高允許的跳躍高度
        if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
            this.endJump(); // 結束跳躍
        }

        // 重新回到地面，跳躍完成
        if (this.yPos > this.groundYPos) {
            this.reset(); // 重置小明的狀態
            this.jumpCount++; // 跳躍次數加一
        }
    },
    // 跳躍結束
    endJump: function () {
        if (this.reachedMinHeight &&
            this.jumpVelocity < this.config.DROP_VELOCITY) {
            this.jumpVelocity = this.config.DROP_VELOCITY; // 下落速度重置爲默認
        }
    },
    // 重置小明狀態
    reset: function () {
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Trex.status.RUNNING);
        this.speedDrop = false;
        this.jumpCount = 0;
    },
    // 設置小明爲加速下落，立即取消當前的跳躍
    setSpeedDrop: function () {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    },
    // 設置小明奔跑時是否躲閃
    setDuck: function (isDucking) {
        if (isDucking && this.status != Trex.status.DUCKING) { // 躲閃狀態
            this.update(0, Trex.status.DUCKING);
            this.ducking = true;
        } else if (this.status == Trex.status.DUCKING) { // 奔跑狀態
            this.update(0, Trex.status.RUNNING);
            this.ducking = false;
        }
    },
};

/**
 * 用於生成碰撞盒子
 * @param {Number} x X 座標
 * @param {Number} y Y座標
 * @param {Number} w 寬度
 * @param {Number} h 高度
 */
function CollisionBox(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
};

// 小明的碰撞盒子
Trex.collisionBoxes = {
    DUCKING: [
        new CollisionBox(1, 18, 55, 25)
    ],
    RUNNING: [
        new CollisionBox(22, 0, 17, 16),
        new CollisionBox(1, 18, 30, 9),
        new CollisionBox(10, 35, 14, 8),
        new CollisionBox(1, 24, 29, 5),
        new CollisionBox(5, 30, 21, 4),
        new CollisionBox(9, 34, 15, 4)
    ]
};

/**
 * 比較兩個矩形是否相交
 * @param {CollisionBox} tRexBox 小明的碰撞盒子
 * @param {CollisionBox} obstacleBox 障礙物的碰撞盒子
 */
function boxCompare(tRexBox, obstacleBox) {
    var crashed = false;

    // 兩個矩形相交
    if (tRexBox.x < obstacleBox.x + obstacleBox.width &&
        tRexBox.x + tRexBox.width > obstacleBox.x &&
        tRexBox.y < obstacleBox.y + obstacleBox.height &&
        tRexBox.height + tRexBox.y > obstacleBox.y) {
        crashed = true;
    }

    return crashed;
};

/**
 * 檢測盒子是否碰撞
 * @param {Object} obstacle 障礙物
 * @param {Object} tRex 小明
 * @param {HTMLCanvasContext} opt_canvasCtx 畫布上下文
 */
function checkForCollision(obstacle, tRex, opt_canvasCtx) {
    // 調整碰撞盒子的邊界，因爲小明和障礙物有 1 像素的白邊
    var tRexBox = new CollisionBox( // 小明最外層的碰撞盒子
        tRex.xPos,
        tRex.yPos,
        tRex.config.WIDTH,
        tRex.config.HEIGHT);

    var obstacleBox = new CollisionBox( // 障礙物最外層的碰撞盒子
        obstacle.xPos,
        obstacle.yPos,
        obstacle.typeConfig.width * obstacle.size,
        obstacle.typeConfig.height);

    // 繪製調試邊框
    if (opt_canvasCtx) {
        // drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
    }

    var crashed = boxCompare(tRexBox, obstacleBox);
    return crashed;
};

/**
 * 調整碰撞盒子
 * @param {!CollisionBox} box 原始的盒子
 * @param {!CollisionBox} adjustment 要調整成的盒子
 * @return {CollisionBox} 被調整的盒子對象
 */
function createAdjustedCollisionBox(box, adjustment) {
    return new CollisionBox(
        box.x + adjustment.x,
        box.y + adjustment.y,
        box.width,
        box.height);
};

/**
 * 繪製碰撞盒子的邊框
 * @param {HTMLCanvasContext} canvasCtx canvas 上下文
 * @param {CollisionBox} tRexBox 小明的碰撞盒子
 * @param {CollisionBox} obstacleBox 障礙物的碰撞盒子
 */
function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
    canvasCtx.save();
    canvasCtx.strokeStyle = '#f00';
    canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);

    canvasCtx.strokeStyle = '#0f0';
    canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
        obstacleBox.width, obstacleBox.height);
    canvasCtx.restore();
};

/**
 * 遊戲結束面板類
 * @param {!HTMLCanvasElement} 畫布元素
 * @param {Object} textImgPos 文字 "Game Over" 在雪碧圖中的位置
 * @param {Object} restartImgPos 重置按鈕在雪碧圖中的位置
 * @param {!Object} dimensions 遊戲畫布的尺寸
 */
function GameOverPanel(canvas, textImgPos, restartImgPos, dimensions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasDimensions = dimensions;
    this.textImgPos = textImgPos;
    this.restartImgPos = restartImgPos;

    this.draw();
};

// 配置參數
GameOverPanel.dimensions = {
    TEXT_X: 0, // 文字 "Game Over" 的 x 座標
    TEXT_Y: 13,
    TEXT_WIDTH: 191, // 文字 "Game Over" 的寬度
    TEXT_HEIGHT: 11,
    RESTART_WIDTH: 36, // 重置按鈕的寬度
    RESTART_HEIGHT: 32,
};

GameOverPanel.prototype = {
    draw: function () {
        var dimensions = GameOverPanel.dimensions;
        var centerX = this.canvasDimensions.WIDTH / 2;

        // 文字 "Game Over"
        var textSourceX = dimensions.TEXT_X;
        var textSourceY = dimensions.TEXT_Y;
        var textSourceWidth = dimensions.TEXT_WIDTH;
        var textSourceHeight = dimensions.TEXT_HEIGHT;

        var textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
        var textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
        var textTargetWidth = dimensions.TEXT_WIDTH;
        var textTargetHeight = dimensions.TEXT_HEIGHT;

        // 重置按鈕
        var restartSourceWidth = dimensions.RESTART_WIDTH;
        var restartSourceHeight = dimensions.RESTART_HEIGHT;
        var restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
        var restartTargetY = this.canvasDimensions.HEIGHT / 2;

        textSourceX += this.textImgPos.x;
        textSourceY += this.textImgPos.y;

        // 文字 "Game over"
        this.ctx.drawImage(Runner.imageSprite,
            textSourceX, textSourceY, textSourceWidth, textSourceHeight,
            textTargetX, textTargetY, textTargetWidth, textTargetHeight);

        // 重置按鈕
        this.ctx.drawImage(Runner.imageSprite,
            this.restartImgPos.x, this.restartImgPos.y,
            restartSourceWidth, restartSourceHeight,
            restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
            dimensions.RESTART_HEIGHT);
    }
};

/**
 * 題目物件
 * @param {Object} quetion 題目內容
 */
function Question(quetion) {
    this.discussion = quetion.discussion;
    this.options = quetion.options;
    this.active = false;
    this.getScore = quetion.gift.score;
    this.gift = quetion.gift.name;
    this.anser_index = quetion.anser_index;

    this.container = document.getElementById('quetion-modal')
    this.discussion_elem = document.getElementById('quetion-discussion')
    this.options_elem = document.getElementById('quetion-options');
    this.anserBox_elem = document.getElementById('anser-box');
    this.result_elem = document.getElementById('result');
    this.anser_elem = document.getElementById('anser');
    this.gift_elem = document.getElementById('gift');
    this.score_elem = document.getElementById('question-score');
    this.keepGoingBtn = document.createComment('button')

    this.init();
}

Question.prototype = {
    init: function () {
        this.container.classList.add('active');
        this.discussion_elem.innerHTML = this.discussion;
        for (let i = 0; i < this.options.length; i++) {
            this.createOption(this.options[i], i);
        }
    },
    createOption: function (optionContent, index) {
        let optionBtn = document.createElement('button');
        optionBtn.innerHTML = optionContent;
        this.options_elem.appendChild(optionBtn);
        optionBtn.classList.add('option-item')
        optionBtn.addEventListener('click', function () {
            this.showAnser(this.anser_index === index);
        }.bind(this))
    },
    showAnser: function (bool) {
        this.result = bool;
        this.anserBox_elem.style.display = 'block';
        this.result_elem.innerHTML = this.result ? '恭喜答對' : '答錯了';
        this.result_elem.classList.add(this.result ? 'correct' : 'wrong');
        this.anser_elem.innerHTML = '正確答案：' + this.options[this.anser_index];
        this.options_elem.innerHTML = null;
        if (bool) {
            this.gift_elem.innerHTML = '獲得：' + this.gift;
            this.score_elem.innerHTML = '分數 + ' + this.getScore;
        }
    },
    finish: function () {
        this.container.classList.remove('active');
        this.anserBox_elem.style.display = 'none';
        this.discussion_elem.innerHTML = null;
        this.result_elem.innerHTML = null;
        this.result_elem.classList.remove('correct', 'wrong')
        this.anser_elem.innerHTML = null;
        this.gift.innerHTML = null;
        this.score_elem.innerHTML = null;
    }
}