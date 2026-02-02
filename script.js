// ===============================
//  グローバル変数
// ===============================
let video = null;
let canvas = null;
let ctx = null;
let stream = null;

// 解析結果を PDF 生成用に保存
let lastAnalysisResult = {
  conditionLabel: "",
  pelvisR: 0,
  pelvisL: 0,
  abdR: 0,
  abdL: 0,
  addR: 0,
  addL: 0,
  speedPercent: 0,
  types: []
};

// ===============================
//  カメラ開始
// ===============================
async function startCamera() {
  video = document.getElementById("video");
  canvas = document.getElementById("analysisCanvas");
  ctx = canvas.getContext("2d");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("カメラを開始できませんでした: " + err);
  }
}

// ===============================
//  1フレームを Canvas に描画
// ===============================
function drawFrameToCanvas() {
  if (!video || video.readyState < 2) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

// ===============================
//  歩行解析（あなたの既存ロジックを想定）
// ===============================
function analyzeGait() {
  drawFrameToCanvas();

  // ここに Tsutomu の解析ロジックを入れる
  // （以下はダミーの計算例）

  lastAnalysisResult.conditionLabel = "通常歩行";
  lastAnalysisResult.pelvisR = 5.2;
  lastAnalysisResult.pelvisL = 4.8;
  lastAnalysisResult.abdR = 12.3;
  lastAnalysisResult.abdL = 11.9;
  lastAnalysisResult.addR = -3.1;
  lastAnalysisResult.addL = -2.8;
  lastAnalysisResult.speedPercent = 92.5;

  lastAnalysisResult.types = [
    "右骨盤がやや上がりやすい傾向があります。",
    "左股関節の外転角度がやや小さめです。",
    "歩行速度は標準の約90%です。"
  ];

  alert("解析が完了しました。PDFボタンからレポートを作成できます。");
}

// ===============================
//  イベント設定
// ===============================
document.getElementById("startCameraBtn").addEventListener("click", () => {
  startCamera();
});

document.getElementById("analyzeBtn").addEventListener("click", () => {
  analyzeGait();
});

// ★ PDF生成ボタン（重要）
document.getElementById("pdfBtn").addEventListener("click", () => {
  generatePdfReport();
});