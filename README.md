# Diwali Dash — Hackathon Final Edition

## Start

From this directory run:

```bash
npm install
npm run dev
```

Open the Vite local URL (typically http://127.0.0.1:5173). Use Chrome/Edge on localhost, permit webcam access, select Ram or Laxmi, and press GO then START.

## Final features

- Existing MediaPipe hand-tracking module **unchanged** from the previously upgraded version. Swipe left/right to change lane, swipe up to jump. Arrow keys and Space are backups.
- Four-lane Three.js endless runner with animated relatives, firecracker obstacles, rangoli, diyas and festival street decorations.
- More family waves as the score rises; each wave keeps at least one lane open.
- Relatives lure the runner with rotating sweets dialogue: gulab jamun, laddoos, barfi, chocolate, jalebi and more.
- Roadside vendors with colorful stalls, lanterns, diyas, firecracker boxes and sweets.
- **Self-contained sound:** a procedural, original dhol-inspired beat and melody plus movement, jump, relative, firework and collision effects. No audio assets or commercial songs needed.
- Four tempos (82/108/138/166 BPM) correspond to 0.84×/1.00×/1.20×/1.40× running-speed multipliers. Music changes approximately every 7.5 seconds; the runner smoothly accelerates or decelerates to match. Mute affects sound only, not speed.
- Distinct Laxmi character silhouette and the original family exam-score lines.
- Local high score, restart, and on-screen music/tempo indicators.

## Testing checklist

1. Start the game and confirm the soundtrack is audible (browser audio begins after START).
2. Wait for a slow/fast song transition; observe corresponding speed changes in the music HUD and road.
3. Check a relative approaching triggers sweets dialogue.
4. Check stalls remain outside the playable lanes, and collision/score/game-over work.
5. Enable the camera and test left/right/up; keyboard backup works.

## Notes

The handTracking.js file has deliberately not been modified in this final pass. The original user-supplied WAV files were not available, so all music and effects are generated in-browser with Web Audio. First-time MediaPipe loading needs internet. Browser gameplay and camera quality should be smoke-tested on the presentation machine.
