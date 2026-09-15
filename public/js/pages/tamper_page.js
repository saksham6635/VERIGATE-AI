import { ELAEngine } from '../modules/tamper_ela.js';
import { CONFIG } from '../config.js';

export function initTamperPage() {
    const fileInput = document.getElementById('tamper-file');
    const originalPreview = document.getElementById('tamper-original-preview');
    const tamperUi = document.getElementById('tamper-ui');
    
    const elaCanvas = document.getElementById('ela-canvas');
    const elaEmpty = document.getElementById('ela-empty');
    const elaLoading = document.getElementById('ela-loading');
    
    const metricsContainer = document.getElementById('tamper-metrics');
    const metricVariance = document.getElementById('metric-variance');
    const metricVerdict = document.getElementById('metric-verdict');
    const metricVerdictBox = document.getElementById('metric-verdict-box');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleTamperScan(file);
    });

    function handleTamperScan(file) {
        const reader = new FileReader();
        
        reader.onloadStart = () => {
            tamperUi.classList.add('hidden');
            elaEmpty.classList.add('hidden');
            elaCanvas.classList.add('hidden');
            elaLoading.classList.remove('hidden');
            metricsContainer.classList.add('hidden');
        };

        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Show original image
                originalPreview.src = img.src;
                originalPreview.classList.remove('hidden', 'opacity-0');
                originalPreview.classList.add('opacity-100');

                // Execute ELA Processing
                setTimeout(async () => {
                    const result = await ELAEngine.processELA(img, 0.90);
                    renderELAResults(result);
                }, 800);
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    function renderELAResults(result) {
        // Setup visible canvas
        elaCanvas.width = result.width;
        elaCanvas.height = result.height;
        const ctx = elaCanvas.getContext('2d');
        
        // Paint the generated heatmap
        ctx.putImageData(result.elaImageData, 0, 0);
        
        // Update UI state
        elaLoading.classList.add('hidden');
        elaCanvas.classList.remove('hidden');
        metricsContainer.classList.remove('hidden');

        // Evaluate Score
        const score = result.varianceScore.toFixed(2);
        metricVariance.innerText = score;

        // Apply threshold logic from config
        if (score > CONFIG.THRESHOLDS.ELA_ANOMALY_SCORE) {
            metricVerdict.innerText = 'HIGH FORGERY RISK';
            metricVerdictBox.className = 'bg-brand-danger/20 border border-brand-danger p-3 rounded-lg text-brand-danger';
        } else {
            metricVerdict.innerText = 'AUTHENTIC (NO ALTERATIONS)';
            metricVerdictBox.className = 'bg-brand-primary/20 border border-brand-primary p-3 rounded-lg text-brand-primary';
        }
    }
}