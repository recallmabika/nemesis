// Requires: <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
(() => {
    const canvas = document.getElementById('hero3d');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Soft depth fade so the orb reads as an ambient accent, not a flat black blob
    const isDark = document.documentElement.classList.contains('dark');
    scene.fog = new THREE.Fog(isDark ? 0x14161a : 0xf5f4f1, 8, 15);

    // Molecule cluster: central sphere + orbiting spheres (mirrors your logo mark)
    // Kept subtly transparent + lower metalness so it never renders as a pure black disc
    // when there's no environment map to reflect (metal PBR materials read as black
    // without one, which is what caused the heavy dark blobs).
    const group = new THREE.Group();
    group.scale.setScalar(0.72);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xC9A84C, metalness: 0.55, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({
        color: 0x3a3f47,
        metalness: 0.35,
        roughness: 0.5,
        transparent: true,
        opacity: 0.55
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), goldMat);
    group.add(core);

    const petalCount = 6;
    const petals = [];
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 32), darkMat);
        petal.position.set(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0);
        petal.userData.angle = angle;
        group.add(petal);
        petals.push(petal);
    }
    scene.add(group);

    // Bright, multi-directional lighting so metal surfaces never fall to pure black
    scene.add(new THREE.HemisphereLight(0xffffff, 0x30261a, 1.1));
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.PointLight(0xffffff, 2.4, 24);
    key.position.set(4, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xC9A84C, 1.8, 24);
    rim.position.set(-5, -2, 4);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 1.1, 24);
    fill.position.set(0, -4, 5);
    scene.add(fill);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        group.rotation.y += 0.0025;
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, mouseY * 0.3, 0.04);
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -mouseX * 0.15, 0.04);

        petals.forEach((p, i) => {
            const wobble = Math.sin(t * 0.8 + i) * 0.15;
            p.position.z = wobble;
            p.scale.setScalar(1 + Math.sin(t * 1.2 + i) * 0.04);
        });

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX * 0.6, 0.03);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouseY * 0.6, 0.03);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!canvas.clientWidth) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        group.rotation.y = 0.3;
        renderer.render(scene, camera);
    }
})();