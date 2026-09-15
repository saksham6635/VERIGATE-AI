/*
    Pipeline & State Manager
    Tracks document progress across HTML pages to Audit Logs
 */
export class PipelineManager {
    
    // 1. Initialize a new scan
    static initScan(documentId, documentType) {
        const scan = {
            id: documentId || `UNK-${Math.floor(Math.random() * 10000)}`,
            type: documentType || 'Unknown Document',
            timestamp: new Date().toISOString(),
            modules: {
                ocr: { passed: false, score: 0 },
                validation: { passed: false, score: 0 },
                tamper: { passed: false, score: 0 },
                biometric: { passed: false, score: 0 }
            }
        };
        localStorage.setItem('ACTIVE_SCAN', JSON.stringify(scan));
        return scan;
    }

    // 2. Update a specific module's result
    static updateModule(moduleName, passed, riskScorePenalty = 0) {
        let scan = JSON.parse(localStorage.getItem('ACTIVE_SCAN'));
        if (!scan) scan = this.initScan('MANUAL_ENTRY', 'Unknown'); // Fallback if they skip Mod 1

        scan.modules[moduleName] = { passed, score: riskScorePenalty };
        localStorage.setItem('ACTIVE_SCAN', JSON.stringify(scan));
    }

    // 3. Finalize and push to Audit Logs 
    static commitToLogs(isManualOverride = false) {
        let scan = JSON.parse(localStorage.getItem('ACTIVE_SCAN'));
        if (!scan) throw new Error("No active scan found to commit.");

        let finalStatus = '';
        let totalRiskScore = 0;

        // Calculate cumulative risk
        Object.values(scan.modules).forEach(mod => {
            totalRiskScore += mod.score;
        });

        if (isManualOverride) {
            finalStatus = 'MANUALLY APPROVED';
        } else {
            const allPassed = Object.values(scan.modules).every(mod => mod.passed);
            finalStatus = allPassed ? 'CLEAR' : 'REJECTED (FAILED MODULE)';
        }

        // Format for the logs page
        const logEntry = {
            id: scan.id,
            type: scan.type,
            score: Math.min(100, totalRiskScore), 
            status: finalStatus,
            timestamp: new Date().toISOString()
        };

        // Push to historical logs array
        let logs = JSON.parse(localStorage.getItem('VERIGATE_LOGS')) || [];
        logs.unshift(logEntry); // Add to beginning of array
        localStorage.setItem('VERIGATE_LOGS', JSON.stringify(logs));
        
        // Clear the active pipeline
        localStorage.removeItem('ACTIVE_SCAN');
        
        return logEntry;
    }
}