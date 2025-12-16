import * as THREE from './libs/three.module.js';

let targets = [];
let movingTargets = [];

// Checkerboard shader for moving targets
const shaderLoader = new THREE.FileLoader();
let checkerVS = '';
let checkerFS = '';
shaderLoader.load('./assets/shaders/checker.vs', data => checkerVS = data);
shaderLoader.load('./assets/shaders/checker.fs', data => checkerFS = data);

function createCheckerMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: { checkerScale: { value: 8.0 } },
        vertexShader: checkerVS,
        fragmentShader: checkerFS
    });
}

// Spawn all stationary and moving targets
function spawnTargets(scene, useTextures = false) {
    const roomWidth = 10;
    const roomHeight = 8;
    const roomDepth = 20;
    const targetSize = 1;
    const clusterZ = roomDepth / 2 - 6; // Cluster targets near each other, off the back wall
    const movingZ = clusterZ + 4; // Cluster moving targets behind them

    // Red stationary
    for (let i = 0; i < 12; i++) {
        const geometry = new THREE.SphereGeometry(targetSize / 2, 32, 32);
        const material = useTextures
            ? new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('./assets/textures/target.JPG'), transparent: true })
            : new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const target = new THREE.Mesh(geometry, material);
        target.position.set(
            (Math.random() - 0.5) * 8,
            -roomHeight / 2 + 1 + Math.random() * (roomHeight - 2),
            clusterZ + (Math.random() - 0.5) * 5
        );
        target.rotation.y = Math.PI / 2;
        target.castShadow = true;
        scene.add(target);
        targets.push(target);
    }

    // Blue moving
    for (let i = 0; i < 3; i++) {
        const geometry = new THREE.SphereGeometry(targetSize / 2, 32, 32);
        const material = useTextures ? createCheckerMaterial() : new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const target = new THREE.Mesh(geometry, material);
        target.position.set(
            (Math.random() - 0.5) * (roomWidth - targetSize),
            -roomHeight / 2 + 1 + Math.random() * (roomHeight - 2),
            movingZ
        );
        target.userData = {
            speed: 0.01 + Math.random() * 0.01, // Random speed to make targets harder to track
            direction: Math.random() < 0.5 ? 1 : -1,
            rotationSpeed: (Math.random() - 0.5) * 0.05 // Random rotation speed cw or ccw
        };
        target.castShadow = true;
        scene.add(target);
        targets.push(target);
        movingTargets.push(target);
    }
}

// Shooting logic for targets
function handleClick(camera, scene, gameState) {
    if (!gameState.running) return;
    // use raycaster to determine if the user clicked on a target
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(targets);
    if (intersects.length === 0) return;

    const hit = intersects[0];
    const target = hit.object;

    // remove target if hit
    scene.remove(target);
    targets = targets.filter(t => t !== target);
    movingTargets = movingTargets.filter(t => t !== target);

    if (gameState.incrementScore) gameState.incrementScore();
    if (targets.length === 0) gameState.finishGame(); // finishGame only needs to be checked when a target is hit
}

// clear all targets from scene
function clearTargets(scene) {
    targets.forEach(t => scene.remove(t));
    movingTargets.forEach(t => scene.remove(t));
    targets = [];
    movingTargets = [];
}

export { spawnTargets, handleClick, clearTargets, movingTargets };