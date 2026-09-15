export function initLogsPage() {
    const tableBody = document.getElementById('logs-table-body');
    const emptyState = document.getElementById('empty-logs-state');
    const exportBtn = document.getElementById('export-json-btn');
    const clearBtn = document.getElementById('clear-logs-btn');
    
    // Seed some mock data
    let logs = JSON.parse(localStorage.getItem('VERIGATE_LOGS')) || [];
    
    if (logs.length === 0) {
        logs = [
            { id: "P92837461", type: "Passport", score: 12, status: "CLEAR", timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: "V11234900", type: "Visa", score: 85, status: "REJECTED", timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: "DL9948271", type: "Driving License", score: 45, status: "REVIEW", timestamp: new Date(Date.now() - 86400000).toISOString() }
        ];
        localStorage.setItem('VERIGATE_LOGS', JSON.stringify(logs));
    }

    renderTable(logs);

    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        data.forEach(log => {
            const dateObj = new Date(log.timestamp);
            const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
            
            let statusBadge = '';
            if (log.status === 'CLEAR') {
                statusBadge = `<span class="bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase">Clear</span>`;
            } else if (log.status === 'REJECTED') {
                statusBadge = `<span class="bg-brand-danger/20 text-brand-danger border border-brand-danger/30 px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase">Rejected</span>`;
            } else {
                statusBadge = `<span class="bg-brand-warning/20 text-brand-warning border border-brand-warning/30 px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase">Review</span>`;
            }

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-800/30 transition-colors reveal-data';
            tr.innerHTML = `
                <td class="px-6 py-4 text-slate-400 font-mono text-xs">${formattedDate}</td>
                <td class="px-6 py-4 font-bold text-slate-200">${log.id}</td>
                <td class="px-6 py-4 text-slate-300">${log.type}</td>
                <td class="px-6 py-4 font-mono">${log.score} <span class="text-[10px] text-slate-500">/ 100</span></td>
                <td class="px-6 py-4">${statusBadge}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Export JSON Feature
    exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `verigate_audit_report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // Clear Logs Feature
    clearBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to permanently delete all local screening logs?")) {
            localStorage.setItem('VERIGATE_LOGS', JSON.stringify([]));
            logs = [];
            renderTable(logs);
        }
    });
}