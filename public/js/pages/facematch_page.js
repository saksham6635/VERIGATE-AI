import { FaceMatchEngine } from '../modules/face_match.js';

export async function initFaceMatchPage() {
    // UI Elements
    const modelLoading = document.getElementById('model-loading');
    const biometricWorkspace = document.getElementById('biometric-workspace');
    const actionWorkspace = document.getElementById('action-workspace');
    
    const docUpload = document.getElementById('doc-image-upload');
    const docPreview = document.getElementById('doc-preview');
    const docUi = document.getElementById('doc-ui');
    
    const videoElement = document.getElementById('webcam-feed');
    const startCamBtn = document.getElementById('start-cam-btn');
    const camPing = document.getElementById('cam-ping');
    const camDot = document.getElementById('cam-dot');
    
    const verifyBtn = document.getElementById('verify-btn');
    const matchResults = document.getElementById('match-results');
    const scoreText = document.getElementById('score-text');
    const scoreBar = document.getElementById('score-bar');
    const matchVerdict = document.getElementById('match-verdict');

    // State
    let isVideoPlaying = false;
    let docLoaded = false;

    // 1. Initialize Neural Networks
    try {
        await FaceMatchEngine.initModels();
        modelLoading.classList.add('hidden');
        biometricWorkspace.classList.remove('hidden');
        actionWorkspace.classList.remove('hidden');
    } catch (error) {
        modelLoading.innerHTML = `<i data-lucide="x-circle" class="w-6 h-6 text-brand-danger"></i> <span class="text-brand-danger font-bold">${error.message}</span>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // 2. Handle Document Upload
    docUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            docPreview.src = event.target.result;
            docPreview.classList.remove('hidden', 'opacity-0');
            docUi.classList.add('hidden');
            docLoaded = true;
            checkReadyState();
        };
        reader.readAsDataURL(file);
    });

    // 3. Handle WebRTC Camera
    startCamBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            videoElement.srcObject = stream;
            videoElement.classList.remove('hidden');
            startCamBtn.classList.add('hidden');
            
            // Status Indicator UI
            camPing.classList.remove('hidden');
            camDot.classList.replace('bg-slate-600', 'bg-brand-danger');

            videoElement.onloadedmetadata = () => {
                isVideoPlaying = true;
                checkReadyState();
            };
        } catch (error) {
            alert('Camera access denied or unavailable. Check permissions.');
        }
    });

    // Toggle button state based on readiness
    function checkReadyState() {
        if (docLoaded && isVideoPlaying) {
            verifyBtn.disabled = false;
        } else {
            verifyBtn.disabled = true;
        }
    }

    // 4. Run Verification
    verifyBtn.addEventListener('click', async () => {
        // Reset UI
        verifyBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin inline mr-2"></i> PROCESSING BIOMETRICS...';
        verifyBtn.disabled = true;
        matchResults.classList.add('hidden');
        
        try {
            // Extract Descriptors
            const docDescriptor = await FaceMatchEngine.getFaceDescriptor(docPreview);
            const liveDescriptor = await FaceMatchEngine.getFaceDescriptor(videoElement);

            // Compare
            const result = FaceMatchEngine.compareFaces(docDescriptor, liveDescriptor);
            renderResults(result);

        } catch (error) {
            alert(error.message);
        } finally {
            verifyBtn.innerHTML = 'RUN BIOMETRIC VERIFICATION';
            verifyBtn.disabled = false;
        }
    });

    function renderResults(result) {
        matchResults.classList.remove('hidden');
        
        const distanceVal = result.distance.toFixed(3);
        scoreText.innerText = distanceVal;
        
        // Calculate percentage for the bar
        const percentage = Math.min(100, (result.distance * 100));
        scoreBar.style.width = `${percentage}%`;

        if (result.isMatch) {
            scoreBar.className = 'h-4 rounded-full transition-all duration-1000 bg-brand-primary';
            matchVerdict.className = 'text-center p-4 rounded-lg font-mono font-bold tracking-wider border bg-brand-primary/10 border-brand-primary text-brand-primary';
            matchVerdict.innerText = `[ IDENTITY VERIFIED ] DISTANCE < ${result.threshold}`;
        } else {
            scoreBar.className = 'h-4 rounded-full transition-all duration-1000 bg-brand-danger';
            matchVerdict.className = 'text-center p-4 rounded-lg font-mono font-bold tracking-wider border bg-brand-danger/10 border-brand-danger text-brand-danger';
            matchVerdict.innerText = `[ IMPERSONATION ALERT ] DISTANCE > ${result.threshold}`;
        }
    }
}