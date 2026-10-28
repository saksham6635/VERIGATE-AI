/*
 * Controller for index.html
*/
export function initDashboardPage() {
    const logsTableBody = document.getElementById('recent-logs-table');

    let logs = [];
    try {
        const savedLogs = JSON.parse(localStorage.getItem('VERIGATE_LOGS') || '[]');
        logs = Array.isArray(savedLogs) ? savedLogs : [];
    } catch (error) {
        console.warn('[Verigate AI] Unable to read audit history.', error);
    }

    const statusCounts = logs.reduce((counts, log) => {
        const status = String(log.status || '').toUpperCase();
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});
    const clearedCount = statusCounts.CLEAR || 0;

    setMetric('dashboard-total', logs.length);
    setMetric('dashboard-rejected', statusCounts.REJECTED || 0);
    setMetric('dashboard-review', statusCounts.REVIEW || 0);
    setMetric('dashboard-cleared', clearedCount);
    setMetric('dashboard-clear-rate', `${logs.length ? Math.round((clearedCount / logs.length) * 100) : 0}%`);
    renderInsights(logs, statusCounts);

    const emptyState = document.getElementById('dashboard-empty-state');
    if (!logsTableBody) return;

    emptyState?.classList.toggle('hidden', logs.length > 0);
    logsTableBody.replaceChildren();

    logs.slice(0, 5).forEach(log => {
        const row = document.createElement('tr');
        const timestamp = new Date(log.timestamp);
        const timeText = Number.isNaN(timestamp.getTime())
            ? 'Unknown time'
            : timestamp.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        const status = String(log.status || 'UNKNOWN').toUpperCase();

        appendCell(row, timeText, 'activity-time');
        appendCell(row, log.id || 'Unassigned', 'activity-id');
        appendCell(row, log.type || 'Unknown', 'activity-type');

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge status-badge--${status.toLowerCase()}`;
        badge.textContent = status;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        logsTableBody.appendChild(row);
    });
}

function setMetric(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function appendCell(row, value, className) {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = value;
    row.appendChild(cell);
}

function renderInsights(logs, statusCounts) {
    const chart = document.getElementById('volume-chart');
    if (chart) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - index));
            return { date, count: 0 };
        });

        logs.forEach(log => {
            const timestamp = new Date(log.timestamp);
            if (Number.isNaN(timestamp.getTime())) return;
            timestamp.setHours(0, 0, 0, 0);
            const day = days.find(entry => entry.date.getTime() === timestamp.getTime());
            if (day) day.count += 1;
        });

        const maximum = Math.max(1, ...days.map(day => day.count));
        chart.replaceChildren();
        days.forEach(day => {
            const item = document.createElement('div');
            item.className = 'volume-day';
            const count = document.createElement('span');
            count.className = 'volume-count';
            count.textContent = day.count;
            const track = document.createElement('div');
            track.className = 'volume-track';
            const bar = document.createElement('span');
            bar.className = 'volume-bar';
            bar.style.height = `${day.count ? Math.max(8, (day.count / maximum) * 100) : 3}%`;
            track.appendChild(bar);
            const label = document.createElement('span');
            label.className = 'volume-label';
            label.textContent = day.date.toLocaleDateString([], { weekday: 'short' });
            item.append(count, track, label);
            chart.appendChild(item);
        });

        const currentTotal = days.reduce((total, day) => total + day.count, 0);
        const priorStart = new Date(today);
        priorStart.setDate(today.getDate() - 13);
        const currentStart = new Date(today);
        currentStart.setDate(today.getDate() - 6);
        const priorTotal = logs.reduce((total, log) => {
            const timestamp = new Date(log.timestamp);
            if (Number.isNaN(timestamp.getTime())) return total;
            timestamp.setHours(0, 0, 0, 0);
            return timestamp >= priorStart && timestamp < currentStart ? total + 1 : total;
        }, 0);

        setMetric('volume-total', `${currentTotal} ${currentTotal === 1 ? 'screening' : 'screenings'}`);
        let comparison = 'No activity in the last 7 days';
        if (priorTotal === 0 && currentTotal > 0) comparison = 'Activity recorded this week';
        else if (priorTotal > 0) {
            const change = Math.round(((currentTotal - priorTotal) / priorTotal) * 100);
            comparison = `${change > 0 ? '+' : ''}${change}% vs. previous 7 days`;
        }
        setMetric('volume-comparison', comparison);
        chart.setAttribute('aria-label', `Last seven days: ${days.map(day => `${day.date.toLocaleDateString([], { weekday: 'long' })}, ${day.count}`).join('; ')}`);
    }

    const recognized = (statusCounts.CLEAR || 0) + (statusCounts.REVIEW || 0) + (statusCounts.REJECTED || 0);
    const outcomeCounts = {
        clear: statusCounts.CLEAR || 0,
        review: statusCounts.REVIEW || 0,
        rejected: statusCounts.REJECTED || 0,
        other: logs.length - recognized
    };

    Object.entries(outcomeCounts).forEach(([outcome, count]) => {
        const rate = logs.length ? Math.round((count / logs.length) * 100) : 0;
        setMetric(`outcome-${outcome}-count`, count);
        setMetric(`outcome-${outcome}-rate`, `${rate}%`);
        const bar = document.getElementById(`outcome-${outcome}-bar`);
        if (bar) bar.style.width = `${rate}%`;
    });
}