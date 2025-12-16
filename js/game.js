import * as THREE from '../libs/three.module.js';
import { spawnTargets, handleClick, clearTargets, movingTargets } from './targets.js';
import { initControls, getYawObject, updateSensitivity } from './controls.js';

// Globals
let scene, camera, renderer;
let gameRunning = false;
let gameStarted = false;
let score = 0;
let timer = 0;
let timerInterval = null;
let sensitivity = 0.0005;
let room = null;

// Wall texture
const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('assets/textures/wall.jpg');
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(2, 2);

// HTML names
const mainMenu = document.getElementById('mainMenu');
const startBtn = document.getElementById('startBtn');
const clickToBegin = document.getElementById('clickToBegin');
const hud = document.getElementById('hud');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const finished = document.getElementById('finished');
const finalScore = document.getElementById('finalScore');
const backToMenu = document.getElementById('backToMenu');
const textureToggle = document.getElementById('textureToggle');
const sensitivitySlider = document.getElementById('sensitivitySlider');

// Game State
const gameState = {
  running: gameRunning,
  score: score,
  finishGame: finishGame
};

// Room size
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 8;
const ROOM_DEPTH = 20;

// Initialize the scene
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Ambient light
  const ambient = new THREE.AmbientLight(0x44aaff, 0.2);
  scene.add(ambient);

  // Directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
  directionalLight.position.set(0, 5, -10);
  directionalLight.target.position.set(0, 1, ROOM_DEPTH / 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -ROOM_WIDTH;
  directionalLight.shadow.camera.right = ROOM_WIDTH;
  directionalLight.shadow.camera.top = ROOM_HEIGHT;
  directionalLight.shadow.camera.bottom = -ROOM_HEIGHT;
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  createRoom();

  // Initialize controls, set sensitivity
  initControls(camera, scene, ROOM_HEIGHT, ROOM_DEPTH, () => gameRunning, sensitivity);

  window.addEventListener('resize', onResize);
}

// Creates the room containing the test
function createRoom() {
  const wallMat = textureToggle.checked
    ? new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide })
    : new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide });

  const materials = [
    wallMat,  // right
    wallMat,  // left
    new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide }), // top
    new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide }), // bottom
    new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.BackSide }), // front
    wallMat   // back
  ];

  if (room) {
    room.material = materials;
    room.material.needsUpdate = true;
  } else {
    const roomGeometry = new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
    room = new THREE.Mesh(roomGeometry, materials);
    scene.add(room);
  }
}

// Window resize handler
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Runs the game
function beginGame() {
  if (gameStarted) return;
  gameStarted = true;

  clickToBegin.classList.add('hidden');
  hud.classList.remove('hidden');
  document.body.classList.add('playing');

  // Pointer lock (hide cursor so crosshair represents clicks)
  if (renderer.domElement.requestPointerLock) {
    renderer.domElement.requestPointerLock();
  }

  // Timer reset and incrementer
  timer = 0;
  timerDisplay.innerText = timer.toString().padStart(4, '0');
  timerInterval = setInterval(() => {
    if (timer < 9999) timer++;
    timerDisplay.innerText = timer.toString().padStart(4, '0');
  }, 50);

  // Reset score display
  score = 0;
  gameState.score = 0;
  scoreDisplay.innerText = `Score: ${score}`;

  gameRunning = true;
  gameState.running = true;

  animate();
}

// Finish game (called after all targets are hit)
function finishGame() {
  gameRunning = false;
  gameStarted = false;
  gameState.running = false;

  document.exitPointerLock?.();
  hud.classList.add('hidden');
  finished.classList.remove('hidden');
  document.body.classList.remove('playing');

  const final = Math.max(0, score - timer);
  finalScore.innerText = `Score: ${final}`;

  clearInterval(timerInterval);
  timerInterval = null;
}

// Animation loop
function animate() {
  if (!gameRunning) return;
  // move, rotate the moving targets
  movingTargets.forEach(target => {
    target.position.x += target.userData.speed * target.userData.direction;

    const halfWidth = ROOM_WIDTH / 2 - 0.5;
    if (target.position.x > halfWidth || target.position.x < -halfWidth) {
      target.userData.direction *= -1;
    }
    target.rotation.y += target.userData.rotationSpeed;
  });

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Input handlers

// Update sensitivity on slider change
sensitivitySlider.addEventListener('input', () => {
  sensitivity = parseFloat(sensitivitySlider.value);
  updateSensitivity(sensitivity);
});

// Begin game with start button
startBtn.addEventListener('click', () => {
  mainMenu.classList.add('hidden');
  clickToBegin.classList.remove('hidden');

  createRoom(); // apply wall textures

  clearTargets(scene);
  const useTextures = textureToggle.checked;
  spawnTargets(scene, useTextures);

  initControls(camera, scene, ROOM_HEIGHT, ROOM_DEPTH, () => gameRunning, sensitivity);

  const yawObject = getYawObject();
  if (yawObject) {
    yawObject.position.set(0, 0, -ROOM_DEPTH / 2 + 1);
    yawObject.rotation.y = Math.PI; // face towards targets
    yawObject.children[0].rotation.x = 0;
  }
});

clickToBegin.addEventListener('click', (e) => {
  e.stopPropagation(); // don't double click
  beginGame();
});

// Play again button
backToMenu.addEventListener('click', () => {
  finished.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  clearTargets(scene);
  gameRunning = false;
  gameStarted = false;
});

// Shooting in game
document.addEventListener('click', (e) => {
  if (
    !gameRunning ||
    e.target.closest('.menu') ||
    e.target.closest('.overlay') ||
    e.target.closest('#sensitivitySlider') ||
    e.target.closest('#textureToggle')
  ) return;

  const initialScore = score; // remember current score

  handleClick(camera, scene, {
    running: gameRunning,
    score,
    finishGame,
    incrementScore: () => {
      score += 100;
      gameState.score = score;
      scoreDisplay.innerText = `Score: ${score}`;
      flashScore('#FFD700'); // gold flash
    }
  });

  // If score didn't change, it was a miss
  if (score === initialScore) {
    score -= 50; // deduct points for miss
    if (score < 0) score = 0; // prevent negative score
    gameState.score = score;
    scoreDisplay.innerText = `Score: ${score}`;
    flashScore('#FF0000'); // red flash for miss
  }
});

// Flash score effect
function flashScore(color = '#FFD700') {
  scoreDisplay.style.color = color;
  setTimeout(() => {
    scoreDisplay.style.color = 'white';
  }, 200);
}


initScene();
