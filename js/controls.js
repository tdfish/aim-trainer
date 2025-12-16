import * as THREE from 'libs/three.module.js';

let yawObject, pitchObject;
let currentSensitivity = 0.0005;

function initControls(camera, scene, roomHeight, roomDepth, isRunning, sensitivity) {
    currentSensitivity = sensitivity;
    // pitch and yaw objects to control camera rotation
    pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    yawObject = new THREE.Object3D();
    yawObject.position.set(0, -roomHeight / 2 + 1, -roomDepth / 2 + 5);
    yawObject.add(pitchObject);

    scene.add(yawObject);
    // Mouse movement controls camera movement
    document.addEventListener('mousemove', (event) => onMouseMove(event, isRunning), false);

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement) {
            console.log('Pointer locked');
        } else {
            console.log('Pointer unlocked');
        }
    });
}

function updateSensitivity(sensitivity) {
    currentSensitivity = sensitivity;
}

function onMouseMove(event, isRunning) {
  if (!isRunning()) return;

  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;
  // camera scaled by mouse sensitivity
  yawObject.rotation.y -= movementX * currentSensitivity; 
  pitchObject.rotation.x -= movementY * currentSensitivity;

  const maxPitch = Math.PI / 2 * 0.95; // limit the bounds of camera pitch to prevent motion sickness and flipping
  const minPitch = -Math.PI / 2 * 0.95;
  pitchObject.rotation.x = Math.max(minPitch, Math.min(maxPitch, pitchObject.rotation.x));
}

// allows game to directly rotate yawObject at beginning
function getYawObject() {
  return yawObject;
}

export { initControls, getYawObject, updateSensitivity };