/**
 * NEMESIS — 3D Algorithmic Rubik's Cube Stage
 * Built with Three.js (local build in static/js/three.min.js)
 * Implements full 3x3x3 kinematic slice rotation, drag physics & cursor tracking.
 */
(() => {
  const canvas = document.getElementById('heroCubeCanvas');
  const stage = document.getElementById('heroCubeStage');
  if (!canvas || !stage || typeof THREE === 'undefined') return;

  // Ensure the stage has rendered dimensions before init
  const W = stage.clientWidth || 380;
  const H = stage.clientHeight || 350;

  // 1. Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.set(0, 0, 7.8);

  // false = don't override canvas CSS width/height with inline style
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);

  // 2. Lighting (Rich multi-directional studio lighting with gold rim)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const goldRimLight = new THREE.PointLight(0xC9A84C, 2.8, 16);
  goldRimLight.position.set(-6, -4, 4);
  scene.add(goldRimLight);

  const fillLight = new THREE.DirectionalLight(0x708090, 0.9);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  // 3. Materials — Precision Swiss Ledger Palette
  const bodyDark = new THREE.MeshStandardMaterial({
    color: 0x111316,
    roughness: 0.65,
    metalness: 0.35
  });

  const faceMaterials = {
    top: new THREE.MeshStandardMaterial({ color: 0xC9A84C, roughness: 0.28, metalness: 0.6 }),      // Signature Gold
    bottom: new THREE.MeshStandardMaterial({ color: 0xA67C1E, roughness: 0.35, metalness: 0.55 }),  // Deep Amber
    right: new THREE.MeshStandardMaterial({ color: 0xF8F8FA, roughness: 0.2, metalness: 0.15 }),    // Pure White
    left: new THREE.MeshStandardMaterial({ color: 0x8A929B, roughness: 0.3, metalness: 0.4 }),      // Titanium Gray
    front: new THREE.MeshStandardMaterial({ color: 0x1A1C20, roughness: 0.25, metalness: 0.5 }),    // Obsidian Black
    back: new THREE.MeshStandardMaterial({ color: 0x364352, roughness: 0.35, metalness: 0.35 })     // Slate Blue
  };

  // 4. Cubelets Construction (3x3x3 = 27 pieces)
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  const cubelets = [];
  const spacing = 1.02;
  const size = 0.92;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Materials order in Three.js BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z]
        const mats = [
          x === 1 ? faceMaterials.right : bodyDark,
          x === -1 ? faceMaterials.left : bodyDark,
          y === 1 ? faceMaterials.top : bodyDark,
          y === -1 ? faceMaterials.bottom : bodyDark,
          z === 1 ? faceMaterials.front : bodyDark,
          z === -1 ? faceMaterials.back : bodyDark
        ];

        const geom = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geom, mats);
        mesh.position.set(x * spacing, y * spacing, z * spacing);
        mainGroup.add(mesh);
        cubelets.push(mesh);
      }
    }
  }

  // Initial angled perspective
  mainGroup.rotation.x = 0.48;
  mainGroup.rotation.y = -0.62;

  // 5. Slice Rotation Engine (Kinematic Rubik's Mechanism)
  let isRotatingSlice = false;
  const pivotGroup = new THREE.Group();
  scene.add(pivotGroup);

  function rotateSlice(axis, layer, angle, duration = 650) {
    if (isRotatingSlice) return;
    isRotatingSlice = true;

    // Reset pivot
    pivotGroup.rotation.set(0, 0, 0);
    pivotGroup.position.set(0, 0, 0);
    mainGroup.add(pivotGroup);

    // Identify cubelets in the target layer (tolerance ±0.2)
    const activePieces = [];
    cubelets.forEach((c) => {
      const pos = new THREE.Vector3();
      c.getWorldPosition(pos);
      mainGroup.worldToLocal(pos);

      let val = pos[axis];
      if (Math.abs(val - layer * spacing) < 0.3) {
        activePieces.push(c);
      }
    });

    // Attach matching pieces to pivot
    activePieces.forEach((c) => {
      pivotGroup.attach(c);
    });

    const startTime = performance.now();
    const startAngle = 0;

    function animateSlice(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth cubic easeInOut
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      pivotGroup.rotation[axis] = startAngle + angle * ease;

      if (progress < 1) {
        requestAnimationFrame(animateSlice);
      } else {
        pivotGroup.rotation[axis] = startAngle + angle;
        pivotGroup.updateMatrixWorld(true);

        // Re-parent back to mainGroup and snap coords to exact integer grid
        activePieces.forEach((c) => {
          mainGroup.attach(c);
          c.position.x = Math.round(c.position.x / spacing) * spacing;
          c.position.y = Math.round(c.position.y / spacing) * spacing;
          c.position.z = Math.round(c.position.z / spacing) * spacing;
        });

        mainGroup.remove(pivotGroup);
        isRotatingSlice = false;
      }
    }

    requestAnimationFrame(animateSlice);
  }

  // 6. Algorithmic Automatic Moves (Sequence of clean solves)
  const axes = ['x', 'y', 'z'];
  const layers = [-1, 1];
  const angles = [Math.PI / 2, -Math.PI / 2];

  let lastMoveTime = 0;
  const moveInterval = 2400; // rotate every 2.4s

  function triggerRandomMove() {
    if (isDragging || isRotatingSlice) return;
    const axis = axes[Math.floor(Math.random() * axes.length)];
    const layer = layers[Math.floor(Math.random() * layers.length)];
    const angle = angles[Math.floor(Math.random() * angles.length)];
    rotateSlice(axis, layer, angle, 680);
  }

  // 7. Interactive Drag & Cursor Parallax
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let velX = 0;
  let velY = 0;
  let mouseX = 0;
  let mouseY = 0;

  stage.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    velX = 0;
    velY = 0;
    stage.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    const rect = stage.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    if (!isDragging) return;
    const deltaX = e.clientX - prevPointerX;
    const deltaY = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;

    velX = deltaX * 0.008;
    velY = deltaY * 0.008;

    mainGroup.rotation.y += velX;
    mainGroup.rotation.x += velY;
  });

  window.addEventListener('pointerup', (e) => {
    if (isDragging) {
      isDragging = false;
      try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  });

  // 8. Main Render & Physics Loop
  const clock = new THREE.Clock();

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    const now = performance.now();

    // Trigger algorithmic solve slices periodically
    if (now - lastMoveTime > moveInterval) {
      lastMoveTime = now;
      triggerRandomMove();
    }

    // Apply inertia damping after dragging
    if (!isDragging) {
      velX *= 0.94;
      velY *= 0.94;
      mainGroup.rotation.y += velX;
      mainGroup.rotation.x += velY;

      // Subtle ambient orbital drift
      mainGroup.rotation.y += 0.0018;

      // Parallax mouse spring
      const targetTiltX = 0.48 + mouseY * 0.15;
      const targetTiltZ = -mouseX * 0.12;
      mainGroup.rotation.x += (targetTiltX - mainGroup.rotation.x) * 0.03;
      mainGroup.rotation.z += (targetTiltZ - mainGroup.rotation.z) * 0.03;
    }

    renderer.render(scene, camera);
  }

  // 9. Resize & Theme adaptation
  function onResize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  // Reduced motion support
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderer.render(scene, camera);
  } else {
    renderLoop();
  }
})();
