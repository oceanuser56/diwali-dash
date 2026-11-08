import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const video = document.getElementById('webcam');
const canvas = document.getElementById('hand-overlay');
const ctx = canvas.getContext('2d');
const button = document.getElementById('camera-button');
const status = document.getElementById('gesture-status');
let landmarker = null;
let active = false;
let lastVideoTime = -1;
let history = [];
let lastSwipe = -Infinity;
let gestureArmed = true;
let neutralFrames = 0;
let filtered = null;
let missingFrames = 0;
const WINDOW_MS = 280;
const HORIZONTAL_DISTANCE = 0.105;
const VERTICAL_DISTANCE = 0.095;
const COOLDOWN_MS = 300;
const REARM_DISTANCE = 0.022;

function emit(gesture) {
  status.textContent = `Gesture: ${gesture}`;
  window.dispatchEvent(new CustomEvent('diwaliGesture', { detail: { gesture } }));
}
function resetGesture() {
  history = [];
  gestureArmed = true;
  neutralFrames = 0;
  filtered = null;
}
function recognize(landmarks, now) {
  // Track the palm rather than one fingertip to reject finger-wiggling noise.
  const indices = [0, 5, 9, 13, 17];
  const palm = indices.reduce((a, i) => ({x:a.x + landmarks[i].x / indices.length,
    y:a.y + landmarks[i].y / indices.length}), {x:0,y:0});
  const point = {x:1-palm.x, y:palm.y}; // CSS webcam preview is mirrored.
  filtered = filtered ? {x:filtered.x * 0.35 + point.x * 0.65,
    y:filtered.y * 0.35 + point.y * 0.65} : point;
  const p = {...filtered, time:now};
  history.push(p);
  history = history.filter(item => now - item.time <= WINDOW_MS);
  if (history.length < 3) return;
  const first = history[0];
  const dx = p.x - first.x, dy = p.y - first.y;
  const recent = history[Math.max(0, history.length - 3)];
  const localMovement = Math.hypot(p.x - recent.x, p.y - recent.y);
  if (!gestureArmed) {
    if (localMovement < REARM_DISTANCE) neutralFrames++;
    else neutralFrames = 0;
    if (neutralFrames >= 3 && now - lastSwipe >= COOLDOWN_MS) {
      gestureArmed = true;
      history = [p];
      neutralFrames = 0;
      status.textContent = 'Ready — swipe to move';
    }
    return;
  }
  if (now - lastSwipe < COOLDOWN_MS) return;
  let gesture = null;
  if (dy < -VERTICAL_DISTANCE && Math.abs(dy) > Math.abs(dx) * 1.25) gesture = 'JUMP';
  else if (Math.abs(dx) > HORIZONTAL_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.25)
    gesture = dx < 0 ? 'LEFT' : 'RIGHT';
  if (gesture) {
    emit(gesture);
    lastSwipe = now;
    gestureArmed = false;
    neutralFrames = 0;
    history = [p];
  }
}

function frame() {
  if (!active) return;
  try {
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (result.landmarks.length) {
        const landmarks = result.landmarks[0];
        const drawing = new DrawingUtils(ctx);
        drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#00ff88', lineWidth: 3 });
        drawing.drawLandmarks(landmarks, { color: '#ff4444', radius: 3 });
        missingFrames = 0;
        recognize(landmarks, performance.now());
      } else {
        if (++missingFrames >= 3) resetGesture();
        status.textContent = 'Show your hand';
      }
    }
  } catch (error) {
    console.error('Hand tracking failed:', error);
    status.textContent = `Tracking error: ${error.message}`;
    active = false;
    button.disabled = false;
    button.textContent = 'Retry camera';
    return;
  }
  requestAnimationFrame(frame);
}

button.addEventListener('click', async () => {
  if (active) return;
  button.disabled = true;
  status.textContent = 'Loading hand tracking…';
  try {
    if (!landmarker) {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numHands: 1
      });
    }
    if (!video.srcObject) {
      video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
    }
    await video.play();
    resetGesture();
    lastVideoTime = -1;
    active = true;
    button.textContent = 'Camera active';
    status.textContent = 'Swipe left, right, or up';
    frame();
  } catch (error) {
    console.error('Camera initialization failed:', error);
    status.textContent = `Error: ${error.message}`;
    button.disabled = false;
    button.textContent = 'Retry camera';
  }
});
