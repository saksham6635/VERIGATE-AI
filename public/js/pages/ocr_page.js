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
        uploadUi.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        resultsEmpty.classList.add('hidden');
        parsedDataContainer.classList.add('hidden');
        parsedDataContainer.replaceChildren();
        processTime.textContent = '';

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
        reader.onerror = () => renderError('The selected image could not be read. Try another file.');
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
        for (const [key, value] of Object.entries(data)) {
            const displayKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const row = document.createElement('div');
            row.className = 'ocr-field-row reveal-data';
            const label = document.createElement('span');
            label.className = 'ocr-field-label';
            label.textContent = displayKey;
            const fieldValue = document.createElement('span');
            fieldValue.className = value ? 'ocr-field-value' : 'ocr-field-value is-missing';
            fieldValue.textContent = value ? String(value) : 'Not found';
            row.append(label, fieldValue);
            parsedDataContainer.appendChild(row);
        }

        if (!Object.keys(data).length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'ocr-empty-message';
            emptyMessage.textContent = 'No structured fields were returned for this document.';
            parsedDataContainer.appendChild(emptyMessage);
        }

        const copyButton = document.createElement('button');
        copyButton.id = 'copy-json-btn';
        copyButton.className = 'button-secondary copy-json-button reveal-data';
        copyButton.type = 'button';
        copyButton.innerHTML = '<i data-lucide="copy" aria-hidden="true"></i> Copy raw JSON';
        parsedDataContainer.appendChild(copyButton);
        parsedDataContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        // Bind Copy Event
        document.getElementById('copy-json-btn').addEventListener('click', (e) => {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            const btn = e.currentTarget;
            btn.innerHTML = '<i data-lucide="check" aria-hidden="true"></i> Copied';
            btn.classList.add('is-saved');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="copy" aria-hidden="true"></i> Copy raw JSON';
                btn.classList.remove('is-saved');
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });
    }

    function renderError(message) {
        const errorPanel = document.createElement('div');
        errorPanel.className = 'module-error reveal-data';
        errorPanel.setAttribute('role', 'alert');
        const title = document.createElement('strong');
        title.textContent = 'Extraction could not be completed';
        const detail = document.createElement('p');
        detail.textContent = message;
        errorPanel.append(title, detail);
        parsedDataContainer.replaceChildren(errorPanel);
        parsedDataContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }
}