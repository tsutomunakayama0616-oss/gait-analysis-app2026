/* ---------------------------------------------------------
   グローバル変数
--------------------------------------------------------- */
let poseLandmarker = null;
let runningMode = "IMAGE";
let liveStream = null;
let liveAnimationId = null;
let videoAnimationId = null;

let compareChart = null;

const historyLabels = [];
const historyPelvis = [];
const historyHipAbd = [];
const historyHipAdd = [];
const historySpeed = [];

let previousStability = null;
let previousSymmetry = null;

/* ---------------------------------------------------------
   MediaPipe PoseLandmarker 初期化
--------------------------------------------------------- */
async function initPoseLandmarker() {
  if (poseLandmarker) return;

  if (!window.FilesetResolver || !window.PoseLandmarker || !window.DrawingUtils) {
    console.error("MediaPipe がまだ読み込まれていません。");
    return;
  }

  const vision = await window.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await window.PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  runningMode = "VIDEO";
}

/* ---------------------------------------------------------
   手術日 → 手術前◯日 / 手術後◯日
--------------------------------------------------------- */
document.getElementById("surgeryDate").addEventListener("change", () => {
  const inputDate = new Date(document.getElementById("surgeryDate").value);
  const today = new Date();

  if (isNaN(inputDate.getTime())) {
    document.getElementById("surgeryDiffText").textContent = "";
    return;
  }

  const diffDays = Math.floor((today - inputDate) / (1000 * 60 * 60 * 24));

  const text =
    diffDays >= 0
      ? `手術後 ${diffDays}日`
      : `手術前 ${Math.abs(diffDays)}日`;

  document.getElementById("surgeryDiffText").textContent = text;
});

/* ---------------------------------------------------------
   モード切替
--------------------------------------------------------- */
document.getElementById("liveModeBtn").addEventListener("click", () => {
  document.getElementById("liveSection").classList.add("active");
  document.getElementById("videoSection").classList.remove("active");

  document.getElementById("liveModeBtn").classList.add("active");
  document.getElementById("videoModeBtn").classList.remove("active");
});

document.getElementById("videoModeBtn").addEventListener("click", () => {
  document.getElementById("videoSection").classList.add("active");
  document.getElementById("liveSection").classList.remove("active");

  document.getElementById("videoModeBtn").classList.add("active");
  document.getElementById("liveModeBtn").classList.remove("active");
});

/* ---------------------------------------------------------
   撮影補助モード：チェックリスト
--------------------------------------------------------- */
const prechecks = document.querySelectorAll(".precheck");
prechecks.forEach((chk) => {
  chk.addEventListener("change", () => {
    const allChecked = [...prechecks].every((c) => c.checked);
    document.getElementById("startLiveBtn").disabled = !allChecked;
  });
});

/* ---------------------------------------------------------
   角度計算
--------------------------------------------------------- */
function angleDeg(ax, ay, bx, by, cx, cy) {
  const v1x = ax - bx;
  const v1y = ay - by;
  const v2x = cx - bx;
  const v2y = cy - by;

  const dot = v1x * v2x + v1y * v2y;
  const n1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const n2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (n1 === 0 || n2 === 0) return 0;

  let cos = dot / (n1 * n2);
  cos = Math.min(1, Math.max(-1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

/* ---------------------------------------------------------
   撮影補助モード：カメラ起動
--------------------------------------------------------- */
document.getElementById("startLiveBtn").addEventListener("click", async () => {
  try {
    await initPoseLandmarker();

    if (!poseLandmarker) {
      document.getElementById("liveError").textContent =
        "骨格モデルの読み込みに失敗しました。";
      return;
    }

    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    const video = document.getElementById("liveVideo");
    const canvas = document.getElementById("liveCanvas");
    const ctx = canvas.getContext("2d");

    video.srcObject = liveStream;

    // ★ フルスクリーン防止
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true;

    await video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    document.getElementById("liveStatus").textContent = "カメラ起動中…";

    const drawingUtils = new window.DrawingUtils(ctx);

    function liveLoop() {
      if (!poseLandmarker) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const nowInMs = performance.now();
      const result = poseLandmarker.detectForVideo(video, nowInMs);

      if (result && result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];

        drawingUtils.drawLandmarks(landmarks, {
          radius: 3,
          color: "#ff3b30",
        });
        drawingUtils.drawConnectors(
          landmarks,
          window.PoseLandmarker.POSE_CONNECTIONS,
          { color: "#007aff", lineWidth: 2 }
        );
      }

      ctx.restore();
      liveAnimationId = requestAnimationFrame(liveLoop);
    }

    liveLoop();
  } catch (err) {
    console.error(err);
    document.getElementById("liveError").textContent =
      "カメラを起動できませんでした。";
  }
});

/* ---------------------------------------------------------
   カメラ停止
--------------------------------------------------------- */
document.getElementById("stopLiveBtn").addEventListener("click", () => {
  if (liveAnimationId) {
    cancelAnimationFrame(liveAnimationId);
    liveAnimationId = null;
  }
  if (liveStream) {
    liveStream.getTracks().forEach((t) => t.stop());
    liveStream = null;
  }
  document.getElementById("liveStatus").textContent = "カメラ停止";
});

/* ---------------------------------------------------------
   動画読み込み
--------------------------------------------------------- */
let loadedVideoURL = null;

document.getElementById("videoFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  loadedVideoURL = URL.createObjectURL(file);
  const video = document.getElementById("analysisVideo");

  // ★ フルスクリーン防止
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.muted = true;

  video.src = loadedVideoURL;
});

/* ---------------------------------------------------------
   グラフ更新
--------------------------------------------------------- */
function updateCompareChart() {
  const ctx = document.getElementById("compareChart").getContext("2d");

  if (compareChart) {
    compareChart.destroy();
  }

  compareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: historyLabels,
      datasets: [
        {
          label: "骨盤傾斜（最大）",
          data: historyPelvis,
          borderColor: "#ff3b30",
          backgroundColor: "rgba(255,59,48,0.1)",
          tension: 0.3,
        },
        {
          label: "股関節外転（最大）",
          data: historyHipAbd,
          borderColor: "#007aff",
          backgroundColor: "rgba(0,122,255,0.1)",
          tension: 0.3,
        },
        {
          label: "股関節内転（最大）",
          data: historyHipAdd,
          borderColor: "#ffcc00",
          backgroundColor: "rgba(255,204,0,0.1)",
          tension: 0.3,
        },
        {
          label: "歩行速度（推定）",
          data: historySpeed,
          borderColor: "#34c759",
          backgroundColor: "rgba(52,199,89,0.1)",
          tension: 0.3,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: { display: true, text: "角度（度）" },
        },
        y1: {
          position: "right",
          title: { display: true, text: "速度（m/秒）" },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/* ---------------------------------------------------------
   動作解析
--------------------------------------------------------- */
async function analyzeVideo() {
  if (!loadedVideoURL) {
    document.getElementById("videoError").textContent =
      "動画が選択されていません。";
    return;
  }

  await initPoseLandmarker();

  if (!poseLandmarker) {
    document.getElementById("videoError").textContent =
      "骨格モデルの読み込みに失敗しました。";
    return;
  }

  const video = document.getElementById("analysisVideo");
  const canvas = document.getElementById("analysisCanvas");
  const ctx = canvas.getContext("2d");
  const drawingUtils = new window.DrawingUtils(ctx);

  // ★ フルスクリーン防止
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.muted = true;

  // controls のフルスクリーン誘発を防ぐ
  video.controls = false;

  await video.play();

  // 再生開始後に controls を戻す
  setTimeout(() => {
    video.controls = true;
  }, 300);

  video.currentTime = 0;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let maxPelvisTilt = 0;
  let maxHipAbduction = 0;
  let maxHipAdduction = 0;

  let firstFrameTime = null;
  let lastFrameTime = null;
  let firstFootX = null;
  let lastFootX = null;

  function processFrame() {
    if (video.paused || video.ended) {
      finishAnalysis();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const nowInMs = performance.now();
    const result = poseLandmarker.detectForVideo(video, nowInMs);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];

      drawingUtils.drawLandmarks(lm, {
        radius: 3,
        color: "#ff3b30",
      });
      drawingUtils.drawConnectors(
        lm,
        window.PoseLandmarker.POSE_CONNECTIONS,
        { color: "#007aff", lineWidth: 2 }
      );

      const rightHip = lm[24];
      const rightKnee = lm[26];
      const rightAnkle = lm[28];
      const leftHip = lm[23];

      const pelvisCenter = {
        x: (rightHip.x + leftHip.x) / 2,
        y: (rightHip.y + leftHip.y) / 2,
      };

      const pelvisTilt = angleDeg(
        leftHip.x,
        leftHip.y,
        pelvisCenter.x,
        pelvisCenter.y,
        rightHip.x,
        rightHip.y
      );
      if (pelvisTilt > maxPelvisTilt) maxPelvisTilt = pelvisTilt;

      const hipAngle = angleDeg(
        rightKnee.x,
        rightKnee.y,
        rightHip.x,
        rightHip.y,
        pelvisCenter.x,
        pelvisCenter.y
      );

      if (hipAngle >= 20 && hipAngle > maxHipAbduction) {
        maxHipAbduction = hipAngle;
      }
      if (hipAngle <= 10 && hipAngle > 0 && hipAngle > maxHipAdduction) {
        maxHipAdduction = hipAngle;
      }

      const currentTime = video.currentTime;
      const currentFootX = rightAnkle.x;

      if (firstFrameTime === null) {
        firstFrameTime = currentTime;
        firstFootX = currentFootX;
      }
      lastFrameTime = currentTime;
      lastFootX = currentFootX;
    }

    ctx.restore();
    videoAnimationId = requestAnimationFrame(processFrame);
  }

  function finishAnalysis() {
    if (videoAnimationId) {
      cancelAnimationFrame(videoAnimationId);
      videoAnimationId = null;
    }

    let gaitSpeed = 0;
    if (
      firstFrameTime !== null &&
      lastFrameTime !== null &&
      lastFrameTime > firstFrameTime &&
      firstFootX !== null &&
      lastFootX !== null
    ) {
      const dx = Math.abs(lastFootX - firstFootX);
      const distanceMeters = dx * 1.0;
      const dt = lastFrameTime - firstFrameTime;
      gaitSpeed = distanceMeters / dt;
    }

    const currentStability = 100 - maxPelvisTilt;
    const currentSymmetry = 100 - Math.abs(maxPelvisTilt);

    const stabilityElem = document.getElementById("stabilityResult");
    const symmetryElem = document.getElementById("symmetryResult");

    const threshold = 1.0;

    if (previousStability === null) {
      stabilityElem.textContent =
        "歩行の安定性：今回が初回の測定です。前回との比較はありません。";
    } else {
      const diff = currentStability - previousStability;
      if (diff > threshold) {
        stabilityElem.textContent = "歩行の安定性：良くなってきています";
      } else if (Math.abs(diff) <= threshold) {
        stabilityElem.textContent = "歩行の安定性：変わりありません";
      } else {
        stabilityElem.textContent = "歩行の安定性：悪くなっています";
      }
    }

    if (previousSymmetry === null) {
      symmetryElem.textContent =
        "左右差：今回が初回の測定です。前回との比較はありません。";
    } else {
      const diff = currentSymmetry - previousSymmetry;
      if (diff > threshold) {
        symmetryElem.textContent = "左右差：良くなってきています";
      } else if (Math.abs(diff) <= threshold) {
        symmetryElem.textContent = "左右差：変わりありません";
      } else {
        symmetryElem.textContent = "左右差：悪くなっています";
      }
    }

    previousStability = currentStability;
    previousSymmetry = currentSymmetry;

    document.getElementById("pelvisResult").textContent =
      `骨盤傾斜（最大）：${maxPelvisTilt.toFixed(1)}°`;
    document.getElementById("hipAbductionResult").textContent =
      `股関節外転角度（最大）：${maxHipAbduction.toFixed(1)}°`;
    document.getElementById("hipAdductionResult").textContent =
      `股関節内転角度（最大）：${maxHipAdduction.toFixed(1)}°`;
    document.getElementById("speedResult").textContent =
      `歩行速度（推定）：${gaitSpeed.toFixed(2)} m/秒`;

    document.getElementById("resultBox").style.display = "block";
    document.getElementById("videoStatus").textContent = "解析完了";

    const tbody = document.querySelector("#resultTable tbody");
    const row = document.createElement("tr");

    const conditionLabel =
      document.getElementById("surgeryDiffText").textContent || "未設定";

    row.innerHTML = `
      <td>${conditionLabel}</td>
      <td>${maxPelvisTilt.toFixed(1)}</td>
      <td>${maxHipAbduction.toFixed(1)}</td>
      <td>${maxHipAdduction.toFixed(1)}</td>
      <td>${gaitSpeed.toFixed(2)}</td>
    `;
    tbody.appendChild(row);

    historyLabels.push(conditionLabel);
    historyPelvis.push(maxPelvisTilt.toFixed(1));
    historyHipAbd.push(maxHipAbduction.toFixed(1));
    historyHipAdd.push(maxHipAdduction.toFixed(1));
    historySpeed.push(gaitSpeed.toFixed(2));

    updateCompareChart();
  }

  processFrame();
}

/* ---------------------------------------------------------
   解析ボタン
--------------------------------------------------------- */
document
  .getElementById("analyzeVideoBtn")
  .addEventListener("click", analyzeVideo);