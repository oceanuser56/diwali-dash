import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090e2b);
scene.fog = new THREE.Fog(0x090e2b, 35, 115);
const camera = new THREE.PerspectiveCamera(65, 1280 / 720, 0.1, 250);
camera.position.set(0, 5.4, 13);
camera.lookAt(0, 1.1, -16);

/* ============================================
   DIWALI DASH - CINEMATIC DRONE INTRO
   ============================================ */

const INTRO_DURATION = 7.5;

let introActive = false;
let introElapsed = 0;

// Normal gameplay camera
const normalCameraPosition =
  new THREE.Vector3(0, 5.4, 13);

const normalCameraTarget =
  new THREE.Vector3(0, 1.1, -16);

// Drone starts high above the festive city
const droneStartPosition =
  new THREE.Vector3(-22, 43, -62);

const droneStartTarget =
  new THREE.Vector3(0, 0, -85);

// Intermediate flying position
const droneMiddlePosition =
  new THREE.Vector3(13, 22, -30);

const droneMiddleTarget =
  new THREE.Vector3(0, 0, -48);

// Reusable camera target
const introLookTarget = new THREE.Vector3();

// Smooth cinematic interpolation
function cinematicEase(t) {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Start the drone shot
function startCinematicIntro() {
  introActive = true;
  introElapsed = 0;

  camera.position.copy(droneStartPosition);
  camera.lookAt(droneStartTarget);
}

// Animate the camera each frame
function updateCinematicIntro(dt) {
  if (!introActive) return;

  introElapsed += dt;

  const progress = Math.min(
    introElapsed / INTRO_DURATION,
    1
  );

  if (progress < 0.48) {
    // First half: fly across the city
    const t = cinematicEase(progress / 0.48);

    camera.position.lerpVectors(
      droneStartPosition,
      droneMiddlePosition,
      t
    );

    introLookTarget.lerpVectors(
      droneStartTarget,
      droneMiddleTarget,
      t
    );

  } else {
    // Second half: descend behind the runner
    const t = cinematicEase(
      (progress - 0.48) / 0.52
    );

    camera.position.lerpVectors(
      droneMiddlePosition,
      normalCameraPosition,
      t
    );

    introLookTarget.lerpVectors(
      droneMiddleTarget,
      normalCameraTarget,
      t
    );
  }

  camera.lookAt(introLookTarget);

  // Cinematic intro finished
  if (progress >= 1) {
    introActive = false;

    camera.position.copy(normalCameraPosition);
    camera.lookAt(normalCameraTarget);

    // Start the actual game after the intro
    playing = true;

    window.DiwaliMusic?.start();
  }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('game-canvas').appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0x9baaff, 1.45));
const moonlight = new THREE.DirectionalLight(0xffe1b0, 2.1);
moonlight.position.set(-8, 20, 5);
scene.add(moonlight);

const mat = (color, lit = true) => lit
  ? new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  : new THREE.MeshBasicMaterial({ color });
const materials = new Map();
function material(color, lit = true) {
  const key = `${color}-${lit}`;
  if (!materials.has(key)) materials.set(key, mat(color, lit));
  return materials.get(key);
}
function cube(parent, w, h, d, color, x, y, z, lit = true) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, lit));
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}
function ball(parent, r, color, x, y, z, lit = true) {
  const obj = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), material(color, lit));
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}
function disc(parent, radius, color, x, y, z) {
  const obj = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  obj.rotation.x = -Math.PI / 2;
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

// Continuous street and pavements; decorative segments move above them.
cube(scene, 14, 0.15, 240, 0x78616c, 0, -0.13, -90);
cube(scene, 5, 0.28, 240, 0x9f8578, -9.5, -0.05, -90);
cube(scene, 5, 0.28, 240, 0x9f8578, 9.5, -0.05, -90);
const LANES = [-4.5, -1.5, 1.5, 4.5];
const SEGMENT_LENGTH = 24;
const SEGMENT_COUNT = 8;
const houseColors = [0xe4a16d, 0x8eb7c9, 0xf3be78, 0xb98db6, 0xa0bd91, 0xd98c79];
const lightColors = [0xffc000, 0xff4477, 0x4cf9dd, 0xffec66, 0x73aaff];
const segments = [];

function house(parent, side, z, seed) {
  const g = new THREE.Group();
  const h = 6 + (seed % 3) * 1.4;
  const front = side === -1 ? 3.08 : -3.08;
  cube(g, 6, h, 6, houseColors[seed % houseColors.length], 0, h / 2, 0);
  cube(g, 6.6, 0.32, 6.6, 0x663c52, 0, h + 0.12, 0);
  cube(g, 6.5, 0.55, 0.25, 0xf5d3a7, 0, h + 0.45, front);
  cube(g, 1.3, 2.35, 0.14, 0x613a30, 0, 1.17, front);
  for (let level = 0; level < 2; level++) {
    const y = 2.65 + level * 2.35;
    if (y + 0.7 >= h) continue;
    for (const x of [-1.8, 1.8]) {
      cube(g, 1.1, 1.2, 0.16, 0xffcf7b, x, y, front, false);
      cube(g, 0.1, 1.2, 0.19, 0x583a43, x, y, front);
    }
  }
  cube(g, 3.7, 0.2, 1, 0xe7c7a6, 0, 3.75, front + (side === -1 ? 0.5 : -0.5));
  cube(g, 3.7, 0.6, 0.1, 0x633d51, 0, 4.12, front + (side === -1 ? 0.96 : -0.96));
  for (let i = 0; i < 12; i++) {
    ball(g, 0.12, lightColors[(i + seed) % lightColors.length], -2.8 + i * 0.5, h + 0.15, front, false);
  }
  for (let i = 0; i < 9; i++) {
    ball(g, 0.10, i % 2 ? 0xffb600 : 0xff6600, -0.8 + i * 0.2,
      2.65 - 0.28 * Math.sin(i / 8 * Math.PI), front, false);
  }
  g.position.set(side * 11.5, 0, z);
  parent.add(g);
}
function diya(parent, x, z) {
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.11, 10), material(0xb2522a));
  bowl.position.set(x, 0.12, z);
  parent.add(bowl);
  const flame = ball(parent, 0.12, 0xffc447, x, 0.33, z, false);
  flame.scale.set(0.65, 1.5, 0.65);
}
function rangoli(parent, x, z) {
  const colors = [0xff3399, 0xffcc00, 0x00ddee, 0x70df65];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    disc(parent, 0.43, colors[i % 4], x + Math.cos(a) * 0.48, 0.03, z + Math.sin(a) * 0.48);
  }
  disc(parent, 0.25, 0xfff7a1, x, 0.035, z);
}
function stringLights(parent, z) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    pts.push(new THREE.Vector3(-7 + i * 0.7, 7 - 1.3 * Math.sin(i / 20 * Math.PI), z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.025, 4, false), material(0x302938, false));
  parent.add(wire);
  pts.forEach((p, i) => ball(parent, 0.13, lightColors[i % lightColors.length], p.x, p.y - 0.15, p.z, false));
}
// Roadside festival stalls are part of each recycled street segment.
function shopStall(parent, side, z, seed) {
  const stall = new THREE.Group();
  const palette = [0xf6b32e, 0xf04e7b, 0x42c6b5, 0x8b62ce];
  const c = palette[seed % palette.length];
  cube(stall, 3.4, 0.22, 2.1, 0x854a31, 0, 1.05, 0);
  for (const x of [-1.5, 1.5]) cube(stall, 0.12, 2.7, 0.12, 0x6e3442, x, 1.5, 0);
  cube(stall, 3.8, 0.25, 2.5, c, 0, 2.9, 0);
  for (let k = 0; k < 7; k++) {
    const x = -1.55 + k * 0.51;
    cube(stall, 0.46, 0.25, 0.2, k % 2 ? 0xffe179 : 0xffffff, x, 2.7, 1.18, false);
  }
  // Vendor stays behind the counter, outside playable lanes.
  const vendor = character(seed % 2 ? 0x43a3bb : 0x9c4ba7, 0xf4ddc2, 0xb9794a, 0.62);
  vendor.position.set(0, 0.2, -0.35);
  stall.add(vendor);
  // Goods: diya pots, fireworks boxes, sweets and lanterns.
  for (let k = 0; k < 5; k++) {
    const x = -1.25 + k * 0.62;
    if (seed % 3 === 0) diya(stall, x, 0.65);
    else if (seed % 3 === 1) {
      cube(stall, 0.4, 0.34, 0.4, [0xff425c, 0xf9c634, 0x49cbd7][k % 3], x, 1.34, 0.5);
      ball(stall, 0.08, 0xffe98c, x, 1.58, 0.5, false);
    } else ball(stall, 0.22, k % 2 ? 0xffb733 : 0x9e4d2a, x, 1.32, 0.55);
  }
  const lantern = ball(stall, 0.34, 0xffd04b, 0, 3.45, 0, false);
  lantern.scale.set(0.85, 1.35, 0.85);
  stall.position.set(side * 9.2, 0, z);
  stall.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
  parent.add(stall);
}

/* ==========================================
   DIWALI DASH - NEPALI STREET DECORATIONS
   Temples, street dogs, and Sel Roti stalls
   ========================================== */

// Beautiful pagoda-style Nepali temple
function createTemple(parent, side, z) {
  const temple = new THREE.Group();

  const wood = 0x69351f;
  const darkWood = 0x3c1b16;
  const gold = 0xffc83d;
  const roofRed = 0x923b38;

  // Stone platform and entrance steps
  cube(temple, 8, 0.65, 7, 0xaca19a, 0, 0.32, 0);
  cube(temple, 4, 0.22, 1.4, 0xd2c2a6, 0, 0.12, 4.1);
  cube(temple, 3.2, 0.16, 1, 0xe5d1ac, 0, 0.08, 4.9);

  // Main temple structure
  cube(temple, 5.4, 4.1, 4.8, 0xd6a16b, 0, 2.7, 0);

  // Wooden pillars
  for (const x of [-2.3, 2.3]) {
    for (const zz of [-2, 2]) {
      cube(temple, 0.35, 4.2, 0.35,
        wood, x, 2.8, zz);
      ball(temple, 0.24, gold, x, 4.9, zz, false);
    }
  }

  // Main door
  cube(temple, 1.8, 2.9, 0.12,
    darkWood, 0, 2.05, 2.47);

  cube(temple, 2.3, 0.25, 0.2,
    gold, 0, 3.65, 2.5);

  // Three pagoda roof levels
  const levels = [
    { y: 5.1, width: 8.2, depth: 7.5 },
    { y: 7.2, width: 6.3, depth: 5.9 },
    { y: 9.1, width: 4.4, depth: 4.1 }
  ];

  levels.forEach((level, index) => {
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(
        level.width * 0.71,
        1.9,
        4
      ),
      material(roofRed)
    );

    roof.rotation.y = Math.PI / 4;
    roof.scale.z = level.depth / level.width;
    roof.position.y = level.y + 0.7;
    temple.add(roof);

    // Golden trim around each tier
    cube(temple,
      level.width, 0.16, level.depth,
      gold, 0, level.y, 0);

    // Upper tier walls
    if (index < 2) {
      cube(temple,
        level.width * 0.53, 1.1,
        level.depth * 0.53,
        wood, 0, level.y + 1.25, 0);
    }
  });

  // Golden pinnacle
  const pinnacle = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.6, 8),
    material(gold, false)
  );
  pinnacle.position.y = 11.4;
  temple.add(pinnacle);

  // Golden bells
  for (const x of [-2.8, -1.4, 1.4, 2.8]) {
    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.4, 8),
      material(gold)
    );
    bell.position.set(x, 4.85, 3.1);
    temple.add(bell);
  }

  // Diyas at the temple entrance
  for (const x of [-3.2, -2.4, 2.4, 3.2]) {
    diya(temple, x, 3.7);
  }

  // Rangoli in front
  rangoli(temple, 0, 5.9);

  // Place safely outside the road
  temple.position.set(side * 17, 0, z);

  // Face the temple entrance toward the road
  temple.rotation.y = side === 1
    ? -Math.PI / 2
    : Math.PI / 2;

  parent.add(temple);
}


// ==========================================
// CUTE NEPALI STREET DOG
// ==========================================

function createStreetDog(parent, side, z, seed = 0) {
  const dog = new THREE.Group();

  const furColors = [
    0xb97739,
    0xe0b779,
    0x79503a,
    0xd4c8a6
  ];

  const fur = furColors[seed % furColors.length];
  const dark = 0x38251e;

  // Body
  const body = ball(dog, 0.48, fur, 0, 0.65, 0);
  body.scale.set(1.4, 0.85, 0.8);

  // Head
  ball(dog, 0.34, fur, 0, 0.94, 0.52);

  // Snout
  const snout = ball(dog, 0.2, 0xf0d5a5,
    0, 0.83, 0.82);
  snout.scale.set(0.8, 0.7, 1.1);

  // Nose
  ball(dog, 0.075, dark, 0, 0.89, 1.02);

  // Eyes
  for (const x of [-0.15, 0.15]) {
    ball(dog, 0.055, dark, x, 1.02, 0.79);
    ball(dog, 0.018, 0xffffff,
      x - 0.012, 1.04, 0.832);
  }

  // Pointed ears
  for (const x of [-0.23, 0.23]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.4, 4),
      material(fur)
    );
    ear.position.set(x, 1.32, 0.47);
    ear.rotation.z = x < 0 ? 0.2 : -0.2;
    dog.add(ear);
  }

  // Four legs
  for (const x of [-0.34, 0.34]) {
    for (const zz of [-0.34, 0.35]) {
      cube(dog, 0.18, 0.5, 0.2,
        fur, x, 0.26, zz);
    }
  }

  // Curved tail
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.28, 0.09, 6, 12, Math.PI * 1.35
    ),
    material(fur)
  );

  tail.position.set(0, 0.9, -0.65);
  tail.rotation.y = Math.PI / 2;
  dog.add(tail);

  // Decorative red collar
  cube(dog, 0.6, 0.1, 0.12,
    0xe84646, 0, 0.76, 0.53);

  // Keep dogs on the sidewalk
  dog.position.set(side * 8.1, 0.1, z);
  dog.rotation.y = side === 1
    ? -Math.PI / 2
    : Math.PI / 2;

  parent.add(dog);
}


// ==========================================
// TRADITIONAL NEPALI SEL ROTI STALL
// ==========================================

function createSelRotiStall(parent, side, z) {
  const stall = new THREE.Group();

  // Wooden counter
  cube(stall, 3.6, 0.2, 2,
    0x89512c, 0, 1.05, 0);

  // Supports
  for (const x of [-1.5, 1.5]) {
    cube(stall, 0.15, 2.8, 0.15,
      0x65351f, x, 1.5, 0);
  }

  // Colorful canopy
  cube(stall, 4.2, 0.25, 2.7,
    0xf5a623, 0, 3.0, 0);

  for (let i = 0; i < 8; i++) {
    cube(stall, 0.46, 0.28, 0.12,
      i % 2 ? 0xe94857 : 0xffe276,
      -1.75 + i * 0.5,
      2.78, 1.35, false);
  }

  // Tray of Sel Roti
  cube(stall, 2.6, 0.1, 1.2,
    0xd6d6d6, 0, 1.25, 0.3);

  // Sel Roti are golden ring-shaped sweets
  for (let i = 0; i < 7; i++) {
    const x = -1.0 + (i % 4) * 0.65;
    const zz = i < 4 ? 0 : 0.55;

    const selRoti = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.24, 0.095, 8, 16
      ),
      material(0xd98b22)
    );

    selRoti.rotation.x = -Math.PI / 2;
    selRoti.position.set(
      x, 1.38, zz
    );

    stall.add(selRoti);
  }

  // Extra golden sweets in bowls
  for (const x of [-1.35, 1.35]) {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.35, 0.28, 0.16, 12
      ),
      material(0xbababa)
    );

    bowl.position.set(x, 1.3, -0.55);
    stall.add(bowl);

    for (let i = 0; i < 3; i++) {
      ball(stall, 0.13, 0xffa52e,
        x + (i - 1) * 0.15,
        1.48, -0.55);
    }
  }

  // Warm lantern above the counter
  const lantern = ball(
    stall, 0.3, 0xffd052,
    0, 3.5, 0, false
  );
  lantern.scale.y = 1.3;

  // Position outside the running lanes
  stall.position.set(side * 9.3, 0, z);
  stall.rotation.y = side === 1
    ? -Math.PI / 2
    : Math.PI / 2;

  parent.add(stall);
}

for (let i = 0; i < SEGMENT_COUNT; i++) {
  const g = new THREE.Group();
  house(g, -1, -5, i * 2);
  house(g, 1, -13, i * 2 + 3);
  for (let z = -1; z > -SEGMENT_LENGTH; z -= 1.5) {
    diya(g, -7.0, z);
    diya(g, 7.0, z);
  }
  rangoli(g, -8.5, -13);
  rangoli(g, 8.5, -18);
  // Ground decorations are visual only: they never cause a collision.
  for (let z = -4; z > -SEGMENT_LENGTH; z -= 7) {
    rangoli(g, LANES[(i + Math.abs(z)) % LANES.length | 0], z);
    for (const side of [-1, 1]) {
      const cracker = new THREE.Group();
      cube(cracker, 0.15, 0.12, 0.7, 0xff425c, 0, 0.10, 0);
      ball(cracker, 0.09, 0xffeb75, 0, 0.28, 0, false);
      cracker.position.set(side * 7.6, 0, z - 1.2);
      g.add(cracker);
    }
  }
  shopStall(g, -1, -7, i * 2);
  shopStall(g, 1, -19, i * 2 + 1);
  
  // ======================================
  // NEW DIWALI DASH STREET DECORATIONS
  // ======================================

  // Temples appear periodically,
  // alternating between the two sides.
  if (i % 3 === 0) {
    createTemple(g, -1, -12);
  }

  if (i % 4 === 2) {
    createTemple(g, 1, -12);
  }

  // Cute street dogs resting near the gullies
  if (i % 2 === 0) {
    createStreetDog(g, -1, -4, i);
  } else {
    createStreetDog(g, 1, -17, i);
  }

  // Traditional Nepali Sel Roti stalls
  if (i % 3 === 1) {
    createSelRotiStall(g, -1, -13);
  }

  if (i % 3 === 2) {
    createSelRotiStall(g, 1, -6);
  }

  stringLights(g, -12);
  for (let z = -2; z > -SEGMENT_LENGTH; z -= 5) {
    cube(g, 14, 0.012, 0.035, 0xa88c89, 0, 0.005, z);
  }
  g.position.z = -i * SEGMENT_LENGTH;
  scene.add(g);
  segments.push(g);
}


/* ============================================
   FESTIVAL CITY SKYLINE
   Decorative distant illuminated buildings
   ============================================ */

function createFestivalSkyline() {
  const skyline = new THREE.Group();

  const colors = [
    0xe9a46d,
    0xd48b98,
    0x8da9d4,
    0xc3a2d1,
    0xe5bf78
  ];

  for (let i = 0; i < 75; i++) {
    const side = i % 2 === 0 ? -1 : 1;

    const x = side * (
      22 + Math.random() * 65
    );

    const z = -15 - Math.random() * 170;

    const width = 5 + Math.random() * 7;
    const height = 5 + Math.random() * 15;
    const depth = 5 + Math.random() * 8;

    const building = new THREE.Group();

    cube(
      building,
      width,
      height,
      depth,
      colors[i % colors.length],
      0,
      height / 2,
      0
    );

    // Roof
    cube(
      building,
      width + 0.5,
      0.3,
      depth + 0.5,
      0x754052,
      0,
      height + 0.15,
      0
    );

    // Glowing windows
    for (let floor = 2; floor < height - 1; floor += 2.4) {
      for (
        let wx = -width / 2 + 1;
        wx < width / 2;
        wx += 1.8
      ) {
        cube(
          building,
          0.8,
          1,
          0.08,
          0xffd36a,
          wx,
          floor,
          depth / 2 + 0.05,
          false
        );
      }
    }

    // Decorative festival lights
    for (let j = 0; j < 7; j++) {
      ball(
        building,
        0.15,
        j % 2 ? 0xffc400 : 0xff5488,
        -width / 2 + j * width / 6,
        height + 0.3,
        depth / 2,
        false
      );
    }

    building.position.set(x, 0, z);
    skyline.add(building);
  }

  scene.add(skyline);
}

createFestivalSkyline();

// Stars and moon remain stationary.
ball(scene, 2.3, 0xfff3c4, -18, 28, -78, false);
for (let i = 0; i < 120; i++) {
  ball(scene, 0.055, 0xffffff, (Math.random() - 0.5) * 170,
    17 + Math.random() * 50, -30 - Math.random() * 130, false);
}

// Character builder used for both the player and relatives.
function character(kurtaColor, pantsColor, skinColor, size = 1) {
  const group = new THREE.Group();
  cube(group, 0.66, 1.05, 0.42, kurtaColor, 0, 1.24, 0);
  ball(group, 0.28, skinColor, 0, 2.04, 0);
  const hair = ball(group, 0.29, 0x211710, 0, 2.27, 0);
  hair.scale.y = 0.45;
  const limbs = {};
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 0.75, 0);
    cube(leg, 0.22, 0.75, 0.25, pantsColor, 0, -0.38, 0);
    group.add(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.44, 1.65, 0);
    cube(arm, 0.21, 0.76, 0.25, kurtaColor, 0, -0.35, 0);
    group.add(arm);
    if (side === -1) { limbs.leftLeg = leg; limbs.leftArm = arm; }
    else { limbs.rightLeg = leg; limbs.rightArm = arm; }
  }
  group.scale.setScalar(size);
  group.userData.limbs = limbs;
  return group;
}
const player = character(0xff8800, 0xf5f0e6, 0xc68642, 0.68);
// Laxmi has her own silhouette: long hair, a pink dress and a flowing skirt.
const girlDetails = new THREE.Group();
const longHair = ball(girlDetails, 0.36, 0x211710, 0, 1.92, -0.16);
longHair.scale.set(1.12, 1.7, 0.72);
const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.66, 0.86, 12), material(0xd63384));
skirt.position.set(0, 0.91, 0);
girlDetails.add(skirt);
const braid = new THREE.Group();
for (let i = 0; i < 5; i++) ball(braid, 0.12 - i * 0.01, 0x211710, 0.28, 1.9 - i * 0.19, -0.17);
girlDetails.add(braid);
girlDetails.visible = false;
player.add(girlDetails);
// Give the player independent outfit materials so relatives keep their own colors.
const outfitMeshes = [];
player.traverse(obj => {
  if (obj.isMesh && obj.geometry?.type === 'BoxGeometry' && obj.material?.color?.getHex() === 0xff8800) {
    obj.material = obj.material.clone();
    outfitMeshes.push(obj);
  }
});
const PLAYER_Z = 4;
let currentLane = 1;
player.position.set(LANES[currentLane], 0.1, PLAYER_Z);
scene.add(player);

// Lane hazards: relatives and ground fireworks share collision handling.
const obstacles = [];
const obstacleColors = [0xe34f88, 0x3ba5b7, 0xa659ce, 0x66aa68, 0xe6a032];
const hazardColors = [0xffd64a, 0xff593e, 0x59e6ff, 0xf065ff];
const SPAWN_Z = -100;
const BAIT_LINES = [
  'Come here! I have gulab jamun!',
  'I have fresh laddoos!',
  'Come, have some sweets!',
  'Chocolate! Your favorite!',
  'I saved you some barfi!',
  'Come here, I have jalebi!',
  'Take some kaju katli!',
  'Wait! I made rasgulla!'
];
const dialogueEl = document.getElementById('family-dialogue');
let dialogueTimeout = 0;
function showRelativeDialogue(line) {
  dialogueEl.textContent = line;
  dialogueEl.classList.remove('dialogue-pop');
  void dialogueEl.offsetWidth;
  dialogueEl.classList.add('dialogue-pop');
}

let lastSpawnLane = -1;

function chooseLane() {
  // Avoid stacking consecutive hazards in the same lane.
  const choices = LANES.map((_, i) => i).filter(i => i !== lastSpawnLane);
  const lane = choices[Math.floor(Math.random() * choices.length)];
  lastSpawnLane = lane;
  return lane;
}
function spawnRelative(lane = chooseLane(), z = SPAWN_Z) {
  const relative = character(
    obstacleColors[Math.floor(Math.random() * obstacleColors.length)],
    0xf5e8d3, 0xb9794a, 0.83
  );
  relative.position.set(LANES[lane], 0.12, z);
  relative.rotation.y = Math.PI;
  scene.add(relative);
  obstacles.push({ mesh: relative, lane, type: 'relative', bait: BAIT_LINES[Math.floor(Math.random() * BAIT_LINES.length)], spoken: false });
}

// Multi-relative waves block at most three of four lanes, always leaving a route.
function spawnFamilyWave() {
  const freeLane = Math.floor(Math.random() * LANES.length);
  const count = score > 900 ? 3 : 2;
  const blocked = LANES.map((_, i) => i).filter(i => i !== freeLane);
  blocked.sort(() => Math.random() - 0.5);
  for (const lane of blocked.slice(0, count)) spawnRelative(lane);
}

// Ground-level fireworks are obstacles; the sky fireworks below remain decorative.
function spawnFireworkObstacle() {
  const lane = chooseLane();
  const group = new THREE.Group();
  const color = hazardColors[Math.floor(Math.random() * hazardColors.length)];
  // A visible cone, glowing core, and sparks distinguish these from relatives.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.65, 0.3, 10), material(0x6a314b)
  );
  base.position.y = 0.18;
  group.add(base);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.1, 10), material(color, false)
  );
  cone.position.y = 0.85;
  group.add(cone);
  ball(group, 0.22, 0xffffff, 0, 1.48, 0, false);
  const sparks = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI * 2 / 10;
    const spark = ball(sparks, 0.11, i % 2 ? color : 0xffef8b,
      Math.cos(angle) * 0.6, 1.5 + Math.sin(angle * 2) * 0.32, Math.sin(angle) * 0.6, false);
    spark.userData.baseY = spark.position.y;
  }
  group.add(sparks);
  group.userData.sparks = sparks;
  group.position.set(LANES[lane], 0, SPAWN_Z);
  scene.add(group);
  obstacles.push({ mesh: group, lane, type: 'firework', phase: Math.random() * Math.PI * 2 });
}

// Simple stylized fireworks (no audio).
const fireworks = [];
function spawnFirework() {
  const group = new THREE.Group();
  const color = lightColors[Math.floor(Math.random() * lightColors.length)];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dot = ball(group, 0.13, color, Math.cos(a), Math.sin(a), 0, false);
    dot.userData.direction = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  }
  group.position.set((Math.random() - 0.5) * 38, 14 + Math.random() * 15, -55);
  scene.add(group);
  fireworks.push({ group, age: 0 });
}

// HUD
let score = 0;
let speed = 12;
let spawnTimer = 1.2;
let fireworkTimer = 1.0;
let jumpY = 0;
let jumpVelocity = 0;
let slideTimer = 0;
let gameOver = true;
let playing = false;
let time = 0;
const clock = new THREE.Clock();

function resetGame() {
  for (const obstacle of obstacles) scene.remove(obstacle.mesh);
  obstacles.length = 0;
  for (const fw of fireworks) scene.remove(fw.group);
  fireworks.length = 0;
  segments.forEach((segment, i) => { segment.position.z = -i * SEGMENT_LENGTH; });
  currentLane = 1;
  player.position.set(LANES[currentLane], 0.1, PLAYER_Z);
  player.scale.set(0.68, 0.68, 0.68);
  score = 0;
  speed = 12;
  spawnTimer = 1.0;
  fireworkTimer = 1;
  lastSpawnLane = -1;
  jumpY = 0;
  jumpVelocity = 0;
  slideTimer = 0;
  time = 0;
  dialogueTimeout = 0;
  gameOver = false;

}
function lose() {
  gameOver = true;
  playing = false;
  window.DiwaliMusic?.effect('caught');
  window.DiwaliMusic?.stop();
  window.DiwaliDash.gameOver(Math.floor(score));
}
// MediaPipe gesture integration. Each swipe moves exactly one lane.
window.addEventListener('diwaliGesture', (event) => {
  if (gameOver || !playing) return;
  const gesture = event.detail?.gesture;
  if (gesture === 'LEFT') { currentLane = Math.max(0, currentLane - 1); window.DiwaliMusic?.effect('move'); }
  else if (gesture === 'RIGHT') { currentLane = Math.min(LANES.length - 1, currentLane + 1); window.DiwaliMusic?.effect('move'); }
  else if (gesture === 'JUMP' && jumpY === 0 && slideTimer <= 0) { jumpVelocity = 8.5; window.DiwaliMusic?.effect('jump'); }
});

document.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === 'KeyR' && playing) { resetGame(); window.DiwaliMusic?.start(); return; }
  if (gameOver || !playing || event.repeat) return;
  if (event.code === 'ArrowLeft') { currentLane = Math.max(0, currentLane - 1); window.DiwaliMusic?.effect('move'); }
  if (event.code === 'ArrowRight') { currentLane = Math.min(3, currentLane + 1); window.DiwaliMusic?.effect('move'); }
  if ((event.code === 'Space' || event.code === 'ArrowUp') && jumpY === 0 && slideTimer <= 0) {
    jumpVelocity = 8.5;
    window.DiwaliMusic?.effect('jump');
  }
  if (event.code === 'ArrowDown' && jumpY === 0) slideTimer = 0.75;
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
    // Play the cinematic camera sequence
  // before normal gameplay begins.
  if (introActive) {
    updateCinematicIntro(dt);
  }
  if (!gameOver && playing) {
    time += dt;
    score += dt * speed;
    const targetSpeed = Math.min(27, 11.5 + score / 210) * (window.DiwaliMusic?.getMultiplier() ?? 1);
    speed = THREE.MathUtils.lerp(speed, targetSpeed, Math.min(1, dt * 3));
    dialogueTimeout = Math.max(0, dialogueTimeout - dt);
    window.DiwaliDash.updateScore(Math.floor(score));

    for (const segment of segments) {
      segment.position.z += speed * dt;
      if (segment.position.z > SEGMENT_LENGTH + 12) {
        segment.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT;
      }
    }

    player.position.x = THREE.MathUtils.lerp(
      player.position.x, LANES[currentLane], Math.min(1, dt * 13)
    );
    if (jumpVelocity !== 0 || jumpY > 0) {
      jumpY += jumpVelocity * dt;
      jumpVelocity -= 20 * dt;
      if (jumpY <= 0) { jumpY = 0; jumpVelocity = 0; }
    }
    slideTimer = Math.max(0, slideTimer - dt);
    // A slide visibly crouches; relatives can be avoided by lane switching or jumping.
    const slideScale = slideTimer > 0 ? 0.44 : 0.68;
    player.scale.y = THREE.MathUtils.lerp(player.scale.y, slideScale, Math.min(1, dt * 16));
    player.position.y = 0.1 + jumpY + (jumpY === 0 ? Math.abs(Math.sin(time * 12)) * 0.03 : 0);
    const swing = Math.sin(time * 12) * 0.5;
    const limbs = player.userData.limbs;
    limbs.leftLeg.rotation.x = swing;
    limbs.rightLeg.rotation.x = -swing;
    limbs.leftArm.rotation.x = -swing;
    limbs.rightArm.rotation.x = swing;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      // More relatives, including paired/triple family waves later in the run.
      const roll = Math.random();
      if (score > 250 && roll < 0.38) spawnFamilyWave();
      else if (roll < 0.82) spawnRelative();
      else spawnFireworkObstacle();
      // Avoid impossible clusters: spacing is based on actual forward speed.
      const minimumGap = score > 500 ? 14 : 17;
      spawnTimer = minimumGap / Math.max(12, speed) + Math.random() * 0.18;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.mesh.position.z += speed * dt;
      if (obstacle.type === 'firework') {
        obstacle.phase += dt * 11;
        const sparks = obstacle.mesh.userData.sparks;
        sparks.rotation.y += dt * 4;
        for (const spark of sparks.children) {
          spark.position.y = spark.userData.baseY + Math.sin(obstacle.phase + spark.position.x * 4) * 0.15;
        }
      }
      if (obstacle.type === 'relative' && !obstacle.spoken &&
          obstacle.mesh.position.z > -34 && dialogueTimeout <= 0) {
        obstacle.spoken = true;
        dialogueTimeout = 1.8;
        showRelativeDialogue(obstacle.bait);
        window.DiwaliMusic?.effect('relative');
      }
      const zDist = Math.abs(obstacle.mesh.position.z - PLAYER_Z);
      const xDist = Math.abs(obstacle.mesh.position.x - player.position.x);
      const safeJumpHeight = obstacle.type === 'firework' ? 1.0 : 1.25;
      if (zDist < 0.85 && xDist < 0.75 && jumpY < safeJumpHeight) {
        lose();
      }
      if (obstacle.mesh.position.z > 18) {
        scene.remove(obstacle.mesh);
        obstacles.splice(i, 1);
      }
    }

    fireworkTimer -= dt;
    if (fireworkTimer <= 0) {
      spawnFirework();
      window.DiwaliMusic?.effect('firework');
      fireworkTimer = 1.8 + Math.random() * 2.5;
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      fw.age += dt;
      fw.group.children.forEach(dot => {
        const direction = dot.userData.direction;
        dot.position.x += direction.x * dt * 2.5;
        dot.position.y += direction.y * dt * 2.5;
        dot.scale.setScalar(Math.max(0.01, 1 - fw.age / 1.6));
      });
      if (fw.age > 1.6) {
        scene.remove(fw.group);
        fireworks.splice(i, 1);
      }
    }
  }
  renderer.render(scene, camera);
}
animate();
window.DiwaliRunner = { start(characterName) {
  resetGame();

// Prevent movement during the cinematic intro
playing = false;

// Show the 3D game screen
window.DiwaliDash.showScreen('screen-game');

// Start the cinematic drone camera
startCinematicIntro();
  document.getElementById('game-best').textContent = window.DiwaliDash.state.best;
  // Switch character model details as well as the outfit.
  const isLaxmi = characterName === 'laxmi';
  showRelativeDialogue(isLaxmi ? 'Beti, how much did you score on your exam?' : 'Beta, how much did you score on your exam?');
  girlDetails.visible = isLaxmi;
  outfitMeshes.forEach(obj => obj.material.color.setHex(isLaxmi ? 0xd63384 : 0xff8800));
}};
window.addEventListener('resize', () => {
  camera.aspect = 1280 / 720;
  camera.updateProjectionMatrix();
  renderer.setSize(1280, 720);
});
