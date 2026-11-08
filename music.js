// Diwali Dash: original, procedural festival soundtrack and game effects.
// No audio files required. Tempo controls running speed, even when muted.
const TRACKS = [
  { title: 'Evening Diyas', bpm: 82, multiplier: 0.84, notes: [261.63,329.63,392,329.63] },
  { title: 'Festival Lights', bpm: 108, multiplier: 1.00, notes: [293.66,369.99,440,369.99] },
  { title: 'Dhol Street', bpm: 138, multiplier: 1.20, notes: [329.63,392,493.88,392] },
  { title: 'Diwali Dance Rush', bpm: 166, multiplier: 1.40, notes: [392,493.88,587.33,493.88] }
];
const titleEl = document.getElementById('music-title');
const speedEl = document.getElementById('music-speed');
const toggle = document.getElementById('music-toggle');
let context = null, master = null, beatTimer = null, trackTimer = null;
let running = false, muted = false, current = TRACKS[1], step = 0, trackIndex = -1;
function setupAudio() {
  if (context) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  context = new AC();
  master = context.createGain();
  master.gain.value = muted ? 0 : 0.18;
  master.connect(context.destination);
}
function tone(frequency, duration = 0.12, type = 'sine', volume = 0.3, slideTo = null) {
  if (!context || !master || muted || context.state !== 'running') return;
  const at = context.currentTime;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(30, frequency), at);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), at + duration);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), at + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.015);
}
function beat() {
  if (!running) return;
  const beatLength = 60 / current.bpm;
  // Dhol-inspired bass and metallic accents, composed with oscillators.
  tone(step % 4 === 0 ? 125 : 165, 0.15, 'sine', 0.75, 55);
  if (step % 2 === 1) tone(420, 0.045, 'triangle', 0.17, 210);
  if (step % 2 === 0) tone(current.notes[(step / 2) % 4], 0.23, 'triangle', 0.22);
  step++;
  beatTimer = setTimeout(beat, beatLength * 1000 / 2);
}
function selectTrack() {
  if (!running) return;
  // Progress between slow, medium and fast songs; never repeat immediately.
  let next = Math.floor(Math.random() * TRACKS.length);
  if (next === trackIndex) next = (next + 1) % TRACKS.length;
  trackIndex = next;
  current = TRACKS[next];
  titleEl.textContent = `${current.title} · ${current.bpm} BPM`;
  speedEl.textContent = `${current.bpm < 100 ? 'SLOW' : current.bpm < 130 ? 'MEDIUM' : 'FAST'} · ${current.multiplier.toFixed(2)}× RUN SPEED`;
  clearTimeout(beatTimer);
  step = 0;
  beat();
  trackTimer = setTimeout(selectTrack, 7500);
}
async function start() {
  stop();
  running = true;
  try { setupAudio(); if (context) await context.resume(); }
  catch (error) { console.warn('Audio unavailable:', error); }
  if (running) selectTrack();
}
function stop() {
  running = false;
  clearTimeout(beatTimer);
  clearTimeout(trackTimer);
  beatTimer = trackTimer = null;
  current = TRACKS[1];
  titleEl.textContent = 'Soundtrack ready';
  speedEl.textContent = 'MEDIUM · 1.00×';
}
function effect(name) {
  if (!running) return;
  if (name === 'move') tone(540, 0.055, 'sine', 0.13, 690);
  else if (name === 'jump') tone(360, 0.2, 'triangle', 0.25, 850);
  else if (name === 'relative') { tone(700, 0.11, 'triangle', 0.22); tone(880, 0.14, 'sine', 0.13); }
  else if (name === 'firework') tone(180, 0.22, 'sawtooth', 0.13, 55);
  else if (name === 'caught') { tone(350, 0.35, 'sawtooth', 0.4, 95); }
}
toggle.addEventListener('click', async () => {
  muted = !muted;
  if (master && context) master.gain.setTargetAtTime(muted ? 0 : 0.18, context.currentTime, 0.025);
  if (!muted && context) await context.resume().catch(() => {});
  toggle.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
});
window.DiwaliMusic = { start, stop, effect, getMultiplier: () => current.multiplier };
