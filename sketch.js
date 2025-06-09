let grid = []; // 儲存星星狀態的網格
let cols, rows; // 網格的欄數和行數
let size = 10; // 每個網格單元的大小，也代表星星的大小

let handPose; // ml5.js handPose 模型
let video; // 攝影機影像物件
let hands = []; // 偵測到的手部資料
// 攝影機影像與模型輸入都設定為左右翻轉，以符合鏡像操作
let options = {
    flipped: true
};

let score = 0; // 當前分數
let gameOver = false; // 遊戲是否結束
let lastScoreTime = 0; // 上次得分的毫秒時間
const SCORE_INTERVAL = 5000; // 每 5 秒得 1 分 (5000 毫秒)

function preload() {
    // 預載入 ml5.js 的 handPose 模型
    handPose = ml5.handPose(options);
}

function setup() {
    createCanvas(640, 480); // 創建 640x480 的畫布
    // 捕捉攝影機影像並設定為左右翻轉顯示
    video = createCapture(VIDEO, { flipped: true });
    video.size(width, height); // 設定影像尺寸與畫布相同
    video.hide(); // 隱藏原始的影像元素

    // 啟動 handPose 模型，偵測到手部時呼叫 gotHands 函式
    handPose.detectStart(video, gotHands);

    // 初始化遊戲網格，所有單元設為 0 (無星星)
    cols = floor(width / size);
    rows = floor(height / size);
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            grid[i][j] = 0;
        }
    }
    lastScoreTime = millis(); // 記錄遊戲開始時間，作為計分起點
}

function draw() {
    background(0); // 清除畫布並設定背景為黑色
    image(video, 0, 0, width, height); // 顯示攝影機影像

    // 顯示分數於畫布右上角
    fill(255, 255, 0); // 黃色文字
    textSize(32);
    textAlign(RIGHT, TOP);
    text('分數: ' + score, width - 20, 20);

    // 遊戲進行中的邏輯
    if (!gameOver) {
        // 時間計分邏輯：每隔 SCORE_INTERVAL 時間增加一分
        if (millis() - lastScoreTime >= SCORE_INTERVAL) {
            if (score < 5) { // 分數上限為 5
                score++;
            }
            lastScoreTime = millis(); // 重置計時器
        }

        // 依據手部食指位置生成星星
        for (let i = 0; i < hands.length; i++) {
            let hand = hands[i];
            // 取得食指尖的關鍵點 (索引 8)
            let indexFinger = hand.keypoints[8];
            addStars(indexFinger.x, indexFinger.y);
        }

        drawRect(); // 繪製網格中所有星星

        // 星星掉落物理模擬 (每 5 幀更新一次，控制掉落速度)
        if (frameCount % 5 == 0) {
            let nextGrid = []; // 用於儲存下一幀的網格狀態
            for (let i = 0; i < cols; i++) {
                nextGrid[i] = [];
                for (let j = 0; j < rows; j++) {
                    nextGrid[i][j] = 0; // 預設為空
                }
            }

            // 遍歷當前網格，計算星星的下一個位置
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let state = grid[i][j]; // 當前星星的狀態 (亮度/透明度)
                    if (state > 0) { // 如果有星星存在
                        if (j + 1 < rows) { // 如果下方還在畫布範圍內
                            let below = grid[i][j + 1]; // 正下方狀態
                            let dir = (random() < 0.5) ? 1 : -1; // 隨機左右偏向

                            let belowDiag = (i + dir >= 0 && i + dir <= cols - 1) ? grid[i + dir][j + 1] : undefined; // 斜下方狀態

                            if (below == 0) {
                                nextGrid[i][j + 1] = state; // 正下方為空，直接掉落
                            } else if (belowDiag == 0) {
                                nextGrid[i + dir][j + 1] = state; // 斜下方為空，斜向掉落
                            } else {
                                nextGrid[i][j] = state; // 無法掉落，停留在原位
                            }
                        } else {
                            nextGrid[i][j] = state; // 已達最底層，停留在原位
                        }
                    }
                }
            }
            grid = nextGrid; // 更新網格狀態
        }
    } else {
        // 遊戲結束畫面
        fill(255, 255, 255); // 白色文字
        textSize(64);
        textAlign(CENTER, CENTER);
        text('教育科技讚!', width / 2, height / 2);
    }

    // 遊戲結束條件判斷
    if (score >= 5 && !gameOver) {
        gameOver = true; // 分數達到 5 分時結束遊戲
    }
}

// 繪製網格中存在的星星
function drawRect() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] > 0) { // 如果有星星數據
                noStroke(); // 無邊框
                // 隨機顏色，透明度由星星狀態決定
                fill(random(255), random(255), random(255), grid[i][j]);
                // 繪製 5 點星星
                star(i * size + size / 2, j * size + size / 2, size / 4, size / 2, 5);
            }
        }
    }
}

// 輔助函式：繪製星星
function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2; // 外點
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1; // 內點
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}

// 在指定座標添加新的星星
function addStars(fingerX, fingerY) {
    let x = floor(fingerX / size); // 轉換為網格 X 座標
    let y = floor(fingerY / size); // 轉換為網格 Y 座標
    x = constrain(x, 0, cols - 1); // 限制 X 座標在範圍內
    y = constrain(y, 0, rows - 1); // 限制 Y 座標在範圍內

    // 只有在遊戲未結束時才生成星星
    if (!gameOver) {
        // 設定星星亮度/透明度，使其在生成時有變化效果
        grid[x][y] = (frameCount % 205) + 50;
    }
}

// ml5.js 偵測到手部時的回呼函式
function gotHands(results) {
    hands = results; // 更新手部資料
}