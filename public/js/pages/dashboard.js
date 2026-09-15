/*
 * Controller for index.html
*/
export function initDashboardPage() {
    const logsTableBody = document.getElementById('recent-logs-table');
    
    // Retrieve historical logs from localStorage
    const logs = JSON.parse(localStorage.getItem('VERIGATE_LOGS')) || [];
    
    if (logs.length > 0 && logsTableBody) {
        const recentLogs = logs.slice(0, 5);
        logsTableBody.innerHTML = '';
        
        recentLogs.forEach(log => {
            const dateObj = new Date(log.timestamp);
            const timeStr = dateObj.toLocaleTimeString();
            
            let badgeClass = 'bg-brand-primary/20 text-brand-primary';
            if (log.status === 'REJECTED') {
                badgeClass = 'bg-brand-danger/20 text-brand-danger';
            } else if (log.status === 'REVIEW') {
                badgeClass = 'bg-brand-warning/20 text-brand-warning';
            }

            const row = document.createElement('tr');
            row.className = 'border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors';
            row.innerHTML = `
                <td class="px-4 py-3 text-slate-400 font-mono text-xs">${timeStr}</td>
                <td class="px-4 py-3 font-medium text-slate-200">${log.id}</td>
                <td class="px-4 py-3">${log.type}</td>
                <td class="px-4 py-3"><span class="${badgeClass} px-2 py-1 rounded text-xs font-bold uppercase">${log.status}</span></td>
            `;
            logsTableBody.appendChild(row);
        });
    }
}