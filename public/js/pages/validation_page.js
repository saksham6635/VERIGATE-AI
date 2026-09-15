import { MRZValidator } from '../modules/mrz_validation.js';

export function initValidationPage() {
    const form = document.getElementById('validation-form');
    const resultsContainer = document.getElementById('results-container');
    const loadSampleBtn = document.getElementById('load-sample-btn');

    // DOM Inputs
    const inputs = {
        docNum: document.getElementById('doc-number'),
        docCheck: document.getElementById('doc-check'),
        dob: document.getElementById('dob-mrz'),
        dobCheck: document.getElementById('dob-check'),
        exp: document.getElementById('exp-mrz'),
        expCheck: document.getElementById('exp-check')
    };

    // Load Sample Valid Data
    loadSampleBtn.addEventListener('click', () => {
        inputs.docNum.value = 'L898902C3';
        inputs.docCheck.value = '6';
        inputs.dob.value = '690806';
        inputs.dobCheck.value = '1';
        
        // Calculate a valid future date dynamically for the sample
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);
        const yy = String(futureDate.getFullYear()).slice(-2);
        const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
        const dd = String(futureDate.getDate()).padStart(2, '0');
        const sampleExp = `${yy}${mm}${dd}`;
        
        inputs.exp.value = sampleExp;
        inputs.expCheck.value = MRZValidator.calculateCheckDigit(sampleExp);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Build Data Array
        const checks = [
            { label: 'Document Number Checksum', str: inputs.docNum.value, check: inputs.docCheck.value },
            { label: 'Date of Birth Checksum', str: inputs.dob.value, check: inputs.dobCheck.value },
            { label: 'Expiration Date Checksum', str: inputs.exp.value, check: inputs.expCheck.value }
        ];

        let failedChecks = 0;

        // Process Checksums
        checks.forEach(item => {
            if (!item.str || !item.check) return; // Skip empty
            
            const isValid = MRZValidator.isValid(item.str, item.check);
            const calcDigit = MRZValidator.calculateCheckDigit(item.str);
            if (!isValid) failedChecks++;

            renderResultRow(item.label, isValid, `Expected: ${item.check} | Computed: ${calcDigit}`);
        });

        // Process Expiration
        if (inputs.exp.value) {
            const isExpired = MRZValidator.isExpired(inputs.exp.value);
            if (isExpired) failedChecks++;
            renderResultRow('Document Expiry Status', !isExpired, isExpired ? 'Document is EXPIRED' : 'Document is VALID');
        }

        // Render Final Verdict
        renderVerdict(failedChecks);
        if (window.lucide) window.lucide.createIcons();
    });

    function renderResultRow(label, passed, detailText) {
        const icon = passed ? 'check-circle-2' : 'x-circle';
        const colorClass = passed ? 'text-brand-primary bg-brand-primary/10 border-brand-primary/20' : 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
        
        const html = `
            <div class="flex items-center justify-between p-3 rounded-lg border ${colorClass} reveal-data">
                <div class="flex items-center gap-3">
                    <i data-lucide="${icon}" class="w-5 h-5"></i>
                    <div>
                        <p class="font-bold text-sm">${label}</p>
                        <p class="text-xs opacity-80">${detailText}</p>
                    </div>
                </div>
                <div class="text-xs font-black tracking-widest uppercase px-2 py-1 rounded bg-black/20">
                    ${passed ? 'PASS' : 'FAIL'}
                </div>
            </div>
        `;
        resultsContainer.insertAdjacentHTML('beforeend', html);
    }

    function renderVerdict(failedCount) {
        const passed = failedCount === 0;
        const color = passed ? 'text-brand-primary' : 'text-brand-danger';
        const message = passed ? 'ALL CHECKS PASSED. MRZ IS AUTHENTIC.' : 'FRAUD DETECTED: CHECKSUM OR DATE VALIDATION FAILED.';
        
        const html = `
            <div class="mt-4 pt-4 border-t border-slate-700 text-center reveal-data" style="animation-delay: 0.3s">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Final Verdict</p>
                <p class="font-mono font-black ${color}">${message}</p>
            </div>
        `;
        resultsContainer.insertAdjacentHTML('beforeend', html);
    }
}