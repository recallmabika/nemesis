/**
 * NEMESIS — 3D Interactive Photo Cube
 * Renders a CSS 3D cube displaying engineering project photos on each face.
 * Features: continuous smooth 3D rotation, touch/mouse drag physics with inertia, and mouse parallax.
 */
(() => {
  const scene = document.getElementById('heroCubeScene');
  const cube = document.getElementById('heroCube');
  if (!scene || !cube) return;

  // Rotation angles (in degrees)
  let rotX = -18;
  let rotY = 32;
  let rotZ = 0;

  // Drag physics state
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let velX = 0;
  let velY = 0;

  // Pointer position for parallax
  let mouseNormX = 0;
  let mouseNormY = 0;

  // Drag handlers
  scene.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    velX = 0;
    velY = 0;
    try {
      scene.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  window.addEventListener('pointermove', (e) => {
    const rect = scene.getBoundingClientRect();
    mouseNormX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseNormY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    if (!isDragging) return;

    const deltaX = e.clientX - prevX;
    const deltaY = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    // Convert pixels to rotation angles
    velX = deltaY * -0.45;
    velY = deltaX * 0.45;

    rotX += velX;
    rotY += velY;

    // Prevent extreme X flips
    rotX = Math.max(-85, Math.min(85, rotX));
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      scene.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Animation Loop
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!isDragging) {
      // Apply momentum damping
      velX *= 0.93;
      velY *= 0.93;
      rotX += velX;
      rotY += velY;

      // Ambient steady rotation
      rotY += 12 * dt; // ~12 degrees per second

      // Parallax wobble from cursor
      const targetParallaxX = mouseNormY * 6;
      const targetParallaxZ = -mouseNormX * 4;
      rotZ += (targetParallaxZ - rotZ) * 0.05;
      rotX += (targetParallaxX - (rotX - -18)) * 0.01;
    }

    // Apply transform
    cube.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
  }

  // Check reduced-motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(animate);
  } else {
    cube.style.transform = `rotateX(-15deg) rotateY(35deg)`;
  }
})();
