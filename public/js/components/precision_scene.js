const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

export async function initPrecisionScene() {
    const canvas = document.getElementById('precision-scene');
    if (!canvas) return;

    try {
        const THREE = await import(THREE_MODULE_URL);
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-7, 7, 3.5, -3.5, 0.1, 40);
        camera.position.set(0, 0, 18);
        scene.add(new THREE.HemisphereLight(0xd8e9db, 0x17201b, 2.2));

        const keyLight = new THREE.DirectionalLight(0xd1e4d4, 3.2);
        keyLight.position.set(-3, 5, 8);
        scene.add(keyLight);

        const edgeLight = new THREE.PointLight(0x83b793, 17, 12, 2);
        edgeLight.position.set(4, 1.5, 4);
        scene.add(edgeLight);

        const documentGroup = new THREE.Group();
        scene.add(documentGroup);

        const shellMaterial = new THREE.MeshStandardMaterial({
            color: 0x304037,
            metalness: 0.42,
            roughness: 0.38
        });
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a241e,
            metalness: 0.22,
            roughness: 0.56
        });
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0x96b79d,
            metalness: 0.18,
            roughness: 0.42
        });
        const quietLineMaterial = new THREE.MeshStandardMaterial({
            color: 0x687c6d,
            metalness: 0.1,
            roughness: 0.6
        });

        const documentShape = makeRoundedShape(THREE, 4.15, 2.72, 0.16);
        const documentGeometry = new THREE.ExtrudeGeometry(documentShape, {
            depth: 0.13,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.035,
            bevelThickness: 0.035,
            curveSegments: 8
        });
        documentGeometry.computeVertexNormals();
        const documentShell = new THREE.Mesh(documentGeometry, shellMaterial);
        documentShell.position.z = -0.07;
        documentGroup.add(documentShell);

        const documentFace = new THREE.Mesh(
            new THREE.ShapeGeometry(makeRoundedShape(THREE, 4.0, 2.57, 0.11)),
            faceMaterial
        );
        documentFace.position.z = 0.075;
        documentGroup.add(documentFace);

        const portraitFrame = new THREE.Mesh(
            new THREE.ShapeGeometry(makeRoundedShape(THREE, 1.04, 1.57, 0.07)),
            new THREE.MeshStandardMaterial({ color: 0x2b3b31, roughness: 0.7 })
        );
        portraitFrame.position.set(-1.29, 0.05, 0.09);
        documentGroup.add(portraitFrame);

        const fingerprintMaterial = new THREE.LineBasicMaterial({
            color: 0xa8c5ac,
            transparent: true,
            opacity: 0.48
        });
        for (let ring = 0; ring < 6; ring += 1) {
            const points = [];
            const radiusX = 0.08 + ring * 0.072;
            const radiusY = 0.12 + ring * 0.11;
            for (let step = 0; step <= 48; step += 1) {
                const angle = 0.2 + (step / 48) * Math.PI * 1.72;
                points.push(new THREE.Vector3(
                    -1.29 + Math.cos(angle) * radiusX,
                    0.05 + Math.sin(angle) * radiusY,
                    0.105
                ));
            }
            documentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), fingerprintMaterial));
        }

        addBar(THREE, documentGroup, -0.45, 0.76, 1.25, 0.035, lineMaterial);
        addBar(THREE, documentGroup, -0.45, 0.52, 1.55, 0.024, quietLineMaterial);
        addBar(THREE, documentGroup, -0.45, 0.13, 1.24, 0.025, quietLineMaterial);
        addBar(THREE, documentGroup, -0.45, -0.08, 1.5, 0.025, quietLineMaterial);
        addBar(THREE, documentGroup, -0.45, -0.29, 1.03, 0.025, quietLineMaterial);
        addBar(THREE, documentGroup, -0.45, -0.73, 2.75, 0.018, quietLineMaterial);

        const chip = new THREE.Mesh(
            new THREE.ShapeGeometry(makeRoundedShape(THREE, 0.48, 0.34, 0.045)),
            new THREE.MeshStandardMaterial({ color: 0x718875, metalness: 0.72, roughness: 0.32 })
        );
        chip.position.set(-1.32, -0.89, 0.1);
        documentGroup.add(chip);
        addBar(THREE, documentGroup, -1.32, -0.89, 0.29, 0.012, faceMaterial, 0.115);

        const seal = new THREE.Mesh(
            new THREE.TorusGeometry(0.25, 0.012, 5, 64),
            new THREE.MeshStandardMaterial({ color: 0x9db8a1, metalness: 0.65, roughness: 0.3 })
        );
        seal.position.set(1.38, 0.46, 0.12);
        documentGroup.add(seal);
        const sealCore = new THREE.Mesh(
            new THREE.CircleGeometry(0.11, 32),
            new THREE.MeshStandardMaterial({ color: 0x506c57, metalness: 0.25, roughness: 0.4 })
        );
        sealCore.position.set(1.38, 0.46, 0.12);
        documentGroup.add(sealCore);

        const scanMaterial = new THREE.MeshBasicMaterial({
            color: 0xafd7b4,
            transparent: true,
            opacity: 0.38,
            depthWrite: false
        });
        const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(3.82, 0.018), scanMaterial);
        scanLine.position.set(0, 0, 0.16);
        documentGroup.add(scanLine);

        let viewWidth = 12;
        let targetRotationY = 0.17;
        let targetRotationX = -0.1;
        let animationFrame = 0;
        let lastFrameTime = 0;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        function resizeScene() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (!width || !height) return;

            const unitsPerPixel = 1 / Math.min(92, Math.max(62, width / 15.6));
            const viewHeight = height * unitsPerPixel;
            viewWidth = width * unitsPerPixel;
            camera.left = -viewWidth / 2;
            camera.right = viewWidth / 2;
            camera.top = viewHeight / 2;
            camera.bottom = -viewHeight / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);

            const compact = width < 850;
            documentGroup.scale.setScalar(compact ? 0.78 : 1);
            documentGroup.position.set(compact ? viewWidth * 0.12 : viewWidth * 0.25, compact ? -0.6 : 0.02, 0);
            renderer.render(scene, camera);
        }

        function renderFrame(timestamp) {
            animationFrame = window.requestAnimationFrame(renderFrame);
            if (timestamp - lastFrameTime < 32) return;
            lastFrameTime = timestamp;

            const time = timestamp * 0.001;
            documentGroup.rotation.y += (targetRotationY + Math.sin(time * 0.38) * 0.065 - documentGroup.rotation.y) * 0.04;
            documentGroup.rotation.x += (targetRotationX + Math.cos(time * 0.32) * 0.04 - documentGroup.rotation.x) * 0.04;
            documentGroup.position.y += ((window.innerWidth < 850 ? -0.6 : 0.02) + Math.sin(time * 0.55) * 0.12 - documentGroup.position.y) * 0.04;
            scanLine.position.y = Math.sin(time * 0.58) * 0.83;
            renderer.render(scene, camera);
        }

        function setMotionPreference() {
            window.cancelAnimationFrame(animationFrame);
            if (reducedMotion.matches) {
                documentGroup.rotation.set(-0.1, 0.17, 0);
                scanLine.position.y = 0;
                renderer.render(scene, camera);
                return;
            }
            animationFrame = window.requestAnimationFrame(renderFrame);
        }

        const hero = canvas.closest('.dashboard-shell');
        hero?.addEventListener('pointermove', event => {
            if (event.pointerType === 'touch' || reducedMotion.matches) return;
            const bounds = hero.getBoundingClientRect();
            const horizontalPosition = (event.clientX - bounds.left) / bounds.width;
            const verticalPosition = (event.clientY - bounds.top) / bounds.height;
            targetRotationY = 0.12 + (horizontalPosition - 0.5) * 0.16;
            targetRotationX = -0.1 + (verticalPosition - 0.5) * 0.08;
        });
        hero?.addEventListener('pointerleave', () => {
            targetRotationY = 0.17;
            targetRotationX = -0.1;
        });

        window.addEventListener('resize', resizeScene, { passive: true });
        reducedMotion.addEventListener?.('change', setMotionPreference);
        resizeScene();
        setMotionPreference();
    } catch (error) {
        console.warn('[Verigate AI] The 3D landing scene is unavailable.', error);
    }
}

function makeRoundedShape(THREE, width, height, radius) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth + radius, -halfHeight);
    shape.lineTo(halfWidth - radius, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
    shape.lineTo(halfWidth, halfHeight - radius);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
    shape.lineTo(-halfWidth + radius, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
    shape.lineTo(-halfWidth, -halfHeight + radius);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
    return shape;
}

function addBar(THREE, parent, x, y, width, height, material, z = 0.11) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.012), material);
    bar.position.set(x + width / 2, y, z);
    parent.add(bar);
}

