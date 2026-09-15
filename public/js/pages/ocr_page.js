import { GroqVisionService } from '../modules/ocr_groq.js';

export function initOCRPage() {
    const fileInput = document.getElementById('file-upload');
    const dropzone = document.getElementById('dropzone');
    const uploadUi = document.getElementById('upload-ui');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const scanningBadge = document.getElementById('scanning-badge');
    
    const resultsEmpty = document.getElementById('results-empty');
    const parsedDataContainer = document.getElementById('parsed-data');
    const processTime = document.getElementById('process-time');

    // Drag and Drop Effects
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-brand-primary'); });
    dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('border-brand-primary'); });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageProcessing(file);
    });

    async function handleImageProcessing(file) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Unsupported file format. Please upload JPG, PNG, or WEBP.');
            return;
        }

        const reader = new FileReader();
        reader.onloadStart = () => {
            uploadUi.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            resultsEmpty.classList.add('hidden');
            parsedDataContainer.classList.add('hidden');
            parsedDataContainer.innerHTML = '';
        };

        reader.onload = async (e) => {
            const base64Image = e.target.result;
            imagePreview.src = base64Image;
            
            previewContainer.classList.add('is-scanning');
            scanningBadge.classList.remove('hidden');
            const startTime = performance.now();

            try {
                const extractedData = await GroqVisionService.extractDocumentData(base64Image);
                const endTime = performance.now();
                processTime.innerText = `${((endTime - startTime) / 1000).toFixed(2)}s runtime`;

                renderExtractedData(extractedData);
                
                // NEW: Push to Audit Logs with Dynamic Risk Score
                saveToAuditLog(extractedData);

            } catch (error) {
                renderError(error.message);
            } finally {
                previewContainer.classList.remove('is-scanning');
                scanningBadge.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    }

    // NEW: Feature to calculate risk and save to local storage
    function saveToAuditLog(data) {
        const logs = JSON.parse(localStorage.getItem('VERIGATE_LOGS')) || [];
        
        // Risk Scoring Engine: Penalize missing critical data
        let riskScore = 0;
        if (!data.document_number) riskScore += 40;
        if (!data.date_of_expiry) riskScore += 30;
        if (!data.mrz_line_1) riskScore += 15;

        let status = 'CLEAR';
        if (riskScore > 50) status = 'REJECTED';
        else if (riskScore > 20) status = 'REVIEW';

        const newLog = {
            id: data.document_number || `UNK-${Math.floor(Math.random()*10000)}`,
            type: data.document_type || 'Unknown Document',
            score: riskScore,
            status: status,
            timestamp: new Date().toISOString()
        };

        logs.unshift(newLog); // Add to beginning of array
        localStorage.setItem('VERIGATE_LOGS', JSON.stringify(logs));
    }

    function renderExtractedData(data) {
        let html = '';
        for (const [key, value] of Object.entries(data)) {
            const displayKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const valueStyle = value ? 'text-emerald-400' : 'text-slate-500 italic';
            const displayValue = value ? value : 'NULL / NOT FOUND';

            html += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/50 reveal-data">
                    <span class="text-slate-400 font-semibold">${displayKey}:</span>
                    <span class="font-mono font-bold ${valueStyle} text-right">${displayValue}</span>
                </div>
            `;
        }

        // NEW Feature: Copy JSON Payload Button
        html += `
            <button id="copy-json-btn" class="mt-4 bg-slate-800 hover:bg-brand-primary hover:text-black text-slate-300 font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 reveal-data border border-slate-700">
                <i data-lucide="copy" class="w-4 h-4"></i> Copy Raw JSON
            </button>
        `;

        parsedDataContainer.innerHTML = html;
        parsedDataContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        // Bind Copy Event
        document.getElementById('copy-json-btn').addEventListener('click', (e) => {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            const btn = e.currentTarget;
            btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Copied to Clipboard`;
            btn.classList.add('bg-brand-primary', 'text-black');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i> Copy Raw JSON`;
                btn.classList.remove('bg-brand-primary', 'text-black');
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });
    }

    function renderError(message) {
        parsedDataContainer.innerHTML = `
            <div class="bg-red-500/10 border border-red-500 rounded-md p-4 text-red-500 reveal-data">
                <div class="flex items-center gap-2 font-bold mb-1">
                    <i data-lucide="alert-octagon" class="w-4 h-4"></i> Extraction Error
                </div>
                <p class="text-sm">${message}</p>
            </div>
        `;
        parsedDataContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }
}