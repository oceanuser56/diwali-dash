
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from '@mediapipe/tasks-vision';

// ==========================================
// DIWALI DASH - IMPROVED HAND TRACKING
// ==========================================

const video = document.getElementById('webcam');
const canvas = document.getElementById('hand-overlay');
const ctx = canvas.getContext('2d');
const button = document.getElementById('camera-button');
const status = document.getElementById('gesture-status');

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  // Gesture sensitivity
  horizontalThreshold: 0.75,
  verticalThreshold: 0.65,

  // Time allowed for a swipe
  gestureWindow: 420,

  // Minimum swipe duration
  minGestureTime: 65,

  // Time between accepted gestures
  cooldown: 280,

  // Return movement required to reset
  rearmDistance: 0.35,

  // Smoothing factor (0-1)
  smoothing: 0.45,

  // Direction filtering
  directionRatio: 1.25,

  // Camera
  cameraWidth: 640,
  cameraHeight: 480,

  // Maximum processing rate
  targetFPS: 30
};

// ==========================================
// TRACKING STATE
// ==========================================

let landmarker = null;
let drawingUtils = null;

let active = false;
let lastVideoTime = -1;
let lastProcessTime = 0;

let smoothedPalm = null;
let gestureHistory = [];

let lastGestureTime = -Infinity;
let gestureArmed = true;
let gestureOrigin = null;
let neutralStart = null;

let missingFrames = 0;
let currentHandSize = 0.15;

// ==========================================
// GAME EVENT
// ==========================================

function emitGesture(gesture) {
  lastGestureTime = performance.now();

  status.textContent = `Detected: ${gesture}`;

  window.dispatchEvent(
    new CustomEvent('diwaliGesture', {
      detail: { gesture }
    })
  );

  console.log('[Diwali Dash]', gesture);
}

// ==========================================
// PALM CENTER CALCULATION
// ==========================================

function getPalmCenter(landmarks) {
  // Wrist and four finger-base joints.
  // These are more stable than fingertips.

  const indices = [0, 5, 9, 13, 17];

  let x = 0;
  let y = 0;

  for (const index of indices) {
    x += landmarks[index].x;
    y += landmarks[index].y;
  }

  x /= indices.length;
  y /= indices.length;

  // Mirror X to match the selfie preview.
  return {
    x: 1 - x,
    y
  };
}

// ==========================================
// HAND SIZE ESTIMATION
// ==========================================

function getHandSize(landmarks) {
  const wrist = landmarks[0];
  const middleBase = landmarks[9];

  const distance = Math.hypot(
    wrist.x - middleBase.x,
    wrist.y - middleBase.y
  );

  // Avoid division by very small values.
  return Math.max(distance, 0.055);
}

// ==========================================
// POSITION SMOOTHING
// ==========================================

function smoothPosition(point) {
  if (!smoothedPalm) {
    smoothedPalm = { ...point };
    return { ...smoothedPalm };
  }

  const alpha = CONFIG.smoothing;

  smoothedPalm.x +=
    (point.x - smoothedPalm.x) * alpha;

  smoothedPalm.y +=
    (point.y - smoothedPalm.y) * alpha;

  return { ...smoothedPalm };
}

// ==========================================
// RESET TRACKING
// ==========================================

function resetTracking() {
  smoothedPalm = null;
  gestureHistory = [];

  gestureArmed = true;
  gestureOrigin = null;
  neutralStart = null;

  missingFrames = 0;
}

// ==========================================
// GESTURE RECOGNITION
// ==========================================

function recognizeGesture(point, handSize, now) {
  gestureHistory.push({
    x: point.x,
    y: point.y,
    time: now
  });

  gestureHistory = gestureHistory.filter(
    p => now - p.time <= CONFIG.gestureWindow
  );

  if (gestureHistory.length < 2) return;

  // --------------------------------------
  // REARM AFTER A PREVIOUS GESTURE
  // --------------------------------------

  if (!gestureArmed) {
    if (!gestureOrigin) {
      gestureOrigin = { ...point };
    }

    const distanceFromOrigin = Math.hypot(
      point.x - gestureOrigin.x,
      point.y - gestureOrigin.y
    );

    const resetDistance =
      handSize * CONFIG.rearmDistance;

    // Allow a new swipe after returning toward
    // the position where the previous swipe began.
    if (distanceFromOrigin >= resetDistance) {
      gestureArmed = true;
      gestureHistory = [{
        x: point.x,
        y: point.y,
        time: now
      }];

      gestureOrigin = null;
      neutralStart = null;
      return;
    }

    // Also allow another gesture after the hand
    // remains relatively still for a short time.
    const recent = gestureHistory[0];

    const movement = Math.hypot(
      point.x - recent.x,
      point.y - recent.y
    );

    if (movement < handSize * 0.12) {
      if (neutralStart === null) {
        neutralStart = now;
      }

      if (now - neutralStart > 180) {
        gestureArmed = true;
        gestureOrigin = null;
        neutralStart = null;

        gestureHistory = [{
          x: point.x,
          y: point.y,
          time: now
        }];
      }
    } else {
      neutralStart = null;
    }

    return;
  }

  if (now - lastGestureTime < CONFIG.cooldown) {
    return;
  }

  // --------------------------------------
  // CALCULATE MOVEMENT
  // --------------------------------------

  const start = gestureHistory[0];

  const dx = point.x - start.x;
  const dy = point.y - start.y;

  const duration = now - start.time;

  if (duration < CONFIG.minGestureTime) {
    return;
  }

  // Normalize movement by apparent hand size.
  // This helps when the player is closer to
  // or farther from the webcam.

  const normalizedX = dx / handSize;
  const normalizedY = dy / handSize;

  const absX = Math.abs(normalizedX);
  const absY = Math.abs(normalizedY);

  let gesture = null;

  // --------------------------------------
  // JUMP - SWIPE UP
  // --------------------------------------

  if (
    normalizedY < -CONFIG.verticalThreshold &&
    absY > absX * CONFIG.directionRatio
  ) {
    gesture = 'JUMP';
  }

  // --------------------------------------
  // LEFT / RIGHT
  // --------------------------------------

  else if (
    absX > CONFIG.horizontalThreshold &&
    absX > absY * CONFIG.directionRatio
  ) {
    gesture = normalizedX < 0
      ? 'LEFT'
      : 'RIGHT';
  }

  // --------------------------------------
  // EMIT ACCEPTED GESTURE
  // --------------------------------------

  if (gesture) {
    emitGesture(gesture);

    gestureArmed = false;

    // Store the starting position for rearming.
    gestureOrigin = {
      x: start.x,
      y: start.y
    };

    neutralStart = null;

    gestureHistory = [{
      x: point.x,
      y: point.y,
      time: now
    }];
  }
}

// ==========================================
// DRAW HAND LANDMARKS
// ==========================================

function drawHand(landmarks, palm) {
  drawingUtils.drawConnectors(
    landmarks,
    HandLandmarker.HAND_CONNECTIONS,
    {
      color: '#00ff88',
      lineWidth: 3
    }
  );

  drawingUtils.drawLandmarks(
    landmarks,
    {
      color: '#ffcc00',
      radius: 3
    }
  );

  // Show the tracked palm center.
  // Convert mirrored coordinates back into
  // the canvas's unmirrored coordinate system.

  ctx.beginPath();

  ctx.arc(
    (1 - palm.x) * canvas.width,
    palm.y * canvas.height,
    9,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = '#00ffff';
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ==========================================
// CAMERA PROCESSING LOOP
// ==========================================

function processFrame(now) {
  if (!active) return;

  requestAnimationFrame(processFrame);

  const frameInterval =
    1000 / CONFIG.targetFPS;

  if (now - lastProcessTime < frameInterval) {
    return;
  }

  if (
    video.readyState < 2 ||
    video.currentTime === lastVideoTime
  ) {
    return;
  }

  lastProcessTime = now;
  lastVideoTime = video.currentTime;

  try {
    const results = landmarker.detectForVideo(
      video,
      now
    );

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (!results.landmarks.length) {
      missingFrames++;

      if (missingFrames >= 5) {
        resetTracking();
        status.textContent = 'Show your hand';
      }

      return;
    }

    missingFrames = 0;

    const landmarks = results.landmarks[0];

    const rawPalm = getPalmCenter(landmarks);

    const palm = smoothPosition(rawPalm);

    const measuredSize = getHandSize(landmarks);

    currentHandSize =
      currentHandSize * 0.7 +
      measuredSize * 0.3;

    drawHand(landmarks, palm);

    recognizeGesture(
      palm,
      currentHandSize,
      now
    );

  } catch (error) {
    console.error(
      'MediaPipe tracking error:',
      error
    );

    status.textContent =
      `Tracking error: ${error.message}`;

    active = false;
    button.disabled = false;
    button.textContent = 'Retry camera';

    if (video.srcObject) {
      video.srcObject.getTracks().forEach(
        track => track.stop()
      );
      video.srcObject = null;
    }
  }
}

// ==========================================
// INITIALIZE MEDIAPIPE
// ==========================================

async function initializeMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
  );

  const options = {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

      delegate: 'GPU'
    },

    runningMode: 'VIDEO',
    numHands: 1,

    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6
  };

  try {
    return await HandLandmarker.createFromOptions(
      vision,
      options
    );
  } catch (error) {
    console.warn(
      'GPU unavailable, switching to CPU',
      error
    );

    options.baseOptions.delegate = 'CPU';

    return await HandLandmarker.createFromOptions(
      vision,
      options
    );
  }
}

// ==========================================
// START CAMERA
// ==========================================

button.addEventListener('click', async () => {
  if (active) return;

  button.disabled = true;

  status.textContent =
    'Initializing improved hand tracking...';

  try {
    if (!landmarker) {
      landmarker = await initializeMediaPipe();

      drawingUtils = new DrawingUtils(ctx);
    }

    if (!video.srcObject) {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: CONFIG.cameraWidth
            },
            height: {
              ideal: CONFIG.cameraHeight
            },
            facingMode: 'user',
            frameRate: {
              ideal: 30
            }
          },
          audio: false
        });

      video.srcObject = stream;
    }

    await video.play();

    resetTracking();

    lastVideoTime = -1;
    lastProcessTime = 0;

    active = true;

    button.textContent = 'Camera active';

    status.textContent =
      'Ready! Swipe left, right, or up';

    requestAnimationFrame(processFrame);

  } catch (error) {
    console.error(
      'Camera initialization failed:',
      error
    );

    status.textContent =
      `Camera error: ${error.message}`;

    button.disabled = false;
    button.textContent = 'Retry camera';
  }
});
