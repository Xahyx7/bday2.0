import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/index.js';

let scene, camera, renderer;
let cake, candles = [];
let candleLights = [];
let isCandlesLit = true;
let confettiParticles = [];
let confettiGeometry, confettiMaterial;
const clock = new THREE.Clock();

const birthdayMessage = document.getElementById('birthdayMessage');
const partyMusic = document.getElementById('partyMusic');
const toggleMusicBtn = document.getElementById('toggleMusic');

init();
setupTimeline();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff4e2);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 2.5, 5);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Ambient and spotlight for warmth and shadows
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const spot = new THREE.SpotLight(0xffd27f, 1.2);
  spot.position.set(5, 7, 5);
  spot.castShadow = true;
  spot.angle = Math.PI / 6;
  spot.penumbra = 0.3;
  scene.add(spot);

  // Floor for shadows
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.15 })
  );
  floor.rotation.x = - Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  loadCake();
  addBalloons();
  setupConfetti();

  toggleMusicBtn.onclick = () => {
    if (partyMusic.paused) partyMusic.play();
    else partyMusic.pause();
  };

  window.addEventListener('resize', onResize);
}

function loadCake() {
  const loader = new GLTFLoader();
  // Placeholder birthday cake model — replace URL with your own model URL/path if available
  loader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
    gltf => {
      cake = gltf.scene;
      cake.scale.set(1.5, 1.5, 1.5);
      cake.position.set(0, 0, 0);
      cake.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if (child.name.toLowerCase().includes('candle')) {
          candles.push(child);
          const light = new THREE.PointLight(0xffeeaa, 1.2, 3);
          light.position.copy(child.position);
          scene.add(light);
          candleLights.push(light);
        }
      });
      scene.add(cake);

      startAnimationLoop();
    },
    undefined,
    err => {
      console.error('Error loading cake model:', err);
    }
   );
}

function addBalloons() {
  const balloonGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const colors = [0xff416c, 0xff4b2b, 0xffff6e, 0x42f5b3, 0x6e5fff];
  colors.forEach((color, i) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
    const balloon = new THREE.Mesh(balloonGeometry, material);
    balloon.position.set(
      Math.sin(i * 1.5) * 2 + (Math.random() - 0.5) * 0.3,
      1.5 + Math.random() * 0.8,
      Math.cos(i * 1.5) * 2 + (Math.random() - 0.5) * 0.3
    );
    balloon.castShadow = true;
    scene.add(balloon);
    gsap.to(balloon.position, {
      y: balloon.position.y + 0.5,
      duration: 3 + Math.random() * 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: Math.random() * 2
    });
  });
}

function setupConfetti() {
  confettiGeometry = new THREE.BufferGeometry();
  const confettiCount = 200;
  const positions = new Float32Array(confettiCount * 3);
  const colors = new Float32Array(confettiCount * 3);
  const colorPalette = [
    new THREE.Color(0xff4b5c),
    new THREE.Color(0xffd700),
    new THREE.Color(0x25ccf7),
    new THREE.Color(0x9b59b6),
    new THREE.Color(0x2ecc71),
  ];

  for (let i = 0; i < confettiCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 5 + 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  confettiGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  confettiGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  confettiMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const confettiPoints = new THREE.Points(confettiGeometry, confettiMaterial);
  confettiPoints.name = 'confetti';
  scene.add(confettiPoints);
  confettiParticles.push(confettiPoints);
}

function showConfetti() {
  confettiParticles.forEach(confetti => {
    gsap.to(confettiMaterial, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.in"
    });
    const positions = confettiGeometry.attributes.position.array;
    const originalY = [];
    for (let i = 0; i < positions.length / 3; i++) {
      originalY[i] = positions[i * 3 + 1];
    }
    gsap.to(positions, {
      duration: 3,
      y: '-=3',
      ease: 'power3.out',
      onUpdate: () => {
        confettiGeometry.attributes.position.needsUpdate = true;
      },
      onComplete: () => {
        gsap.to(confettiMaterial, { opacity: 0, duration: 1 });
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] = originalY[i];
        }
        confettiGeometry.attributes.position.needsUpdate = true;
      }
    });
  });
}

function startAnimationLoop() {
  gsap.ticker.add(render);
  partyMusic.volume = 0.5;
  partyMusic.play();
}

function render() {
  animateCandles();
  renderer.render(scene, camera);
}

function animateCandles() {
  if (!isCandlesLit) return;
  candleLights.forEach(light => {
    light.intensity = 1 + Math.sin(Date.now() * 0.01 + Math.random()) * 0.3;
  });
}

function blowCandles() {
  if (!isCandlesLit) return;
  isCandlesLit = false;
  candleLights.forEach(light => gsap.to(light, { intensity: 0, duration: 2 }));

  playSound('assets/audio/candle_blow.mp3');
  setTimeout(showConfetti, 2500);
}

function cutCake() {
  if (!cake) return;
  gsap.to(cake.scale, { y: 0.7, duration: 0.6, yoyo: true, repeat: 1, ease: "power1.inOut" });
  playSound('assets/audio/cake_cut.mp3');
}

function playSound(src) {
  const audio = new Audio(src);
  audio.play();
}

function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupTimeline() {
  const timeline = gsap.timeline();

  timeline.to(camera.position, { z: 3, duration: 2 });
  timeline.to({}, { duration: 1 }); 

  timeline.to({}, {
    onStart: () => { isCandlesLit = true; },
    duration: 2
  });

  timeline.to({}, {
    onStart: blowCandles,
    duration: 3
  });

  timeline.to({}, {
    onStart: cutCake,
    duration: 3
  });

  timeline.to(camera.position, { x: 2, y: 3, z: 5, duration: 5 });
  timeline.to(camera.position, { x: -2, y: 3, z: 6, duration: 5 });

  timeline.to({}, {
    onStart: () => {
      birthdayMessage.hidden = false;
      birthdayMessage.classList.add('visible');
    },
    duration: 6
  });

  timeline.to(partyMusic, { volume: 0, duration: 4 });
}
