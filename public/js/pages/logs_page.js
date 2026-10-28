export function initLogsPage() {
    const tableBody = document.getElementById('logs-table-body');
    const emptyState = document.getElementById('empty-logs-state');
    const exportBtn = document.getElementById('export-json-btn');
    const clearBtn = document.getElementById('clear-logs-btn');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    let logs = [];
    try {
        const storedLogs = JSON.parse(localStorage.getItem('VERIGATE_LOGS') || '[]');
        logs = Array.isArray(storedLogs) ? storedLogs : [];
    } catch (error) {
        console.warn('[Verigate AI] Unable to read audit history.', error);
    }

    renderTable(getFilteredLogs());

    searchInput?.addEventListener('input', () => renderTable(getFilteredLogs()));
    statusFilter?.addEventListener('change', () => renderTable(getFilteredLogs()));

    function getFilteredLogs() {
        const query = searchInput?.value.trim().toLowerCase() || '';
        const status = statusFilter?.value || 'ALL';
        return logs.filter(log => {
            const matchesQuery = `${log.id || ''} ${log.type || ''}`.toLowerCase().includes(query);
            const matchesStatus = status === 'ALL' || String(log.status || '').toUpperCase() === status;
            return matchesQuery && matchesStatus;
        });
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            const message = emptyState.querySelector('p');
            if (message) message.textContent = logs.length ? 'No records match these filters.' : 'No screening logs recorded yet.';
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        data.forEach(log => {
            const dateObj = new Date(log.timestamp);
            const formattedDate = Number.isNaN(dateObj.getTime())
                ? 'Unknown time'
                : dateObj.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
            const status = String(log.status || 'UNKNOWN').toUpperCase();
            const tr = document.createElement('tr');
            tr.className = 'reveal-data';
            appendCell(tr, formattedDate);
            appendCell(tr, log.id || 'Unassigned');
            appendCell(tr, log.type || 'Unknown');

            const scoreCell = document.createElement('td');
            scoreCell.textContent = Number.isFinite(Number(log.score)) ? `${log.score} / 100` : 'Not scored';
            tr.appendChild(scoreCell);

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `audit-badge audit-badge--${status.toLowerCase()}`;
            statusBadge.textContent = status;
            statusCell.appendChild(statusBadge);
            tr.appendChild(statusCell);
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
            renderTable(getFilteredLogs());
        }
    });

    function appendCell(row, value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
    }
}