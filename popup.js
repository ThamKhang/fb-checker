const DEFAULT_PAGE_IDS = [];

const GRAPH_URL = "https://graph.facebook.com/v21.0/";
const BATCH_SIZE = 10;

const tokenInput    = document.getElementById('tokenInput');
const btnGetToken   = document.getElementById('btnGetToken');
const tokenStatus   = document.getElementById('tokenStatus');
const pageIdsInput  = document.getElementById('pageIds');
const btnFetch      = document.getElementById('btnFetch');
const progressBar   = document.getElementById('progressBar');
const statusText    = document.getElementById('statusText');
const statSuccess   = document.getElementById('statSuccess');
const statError     = document.getElementById('statError');
const statTotal     = document.getElementById('statTotal');
const tableBody     = document.getElementById('tableBody');
const btnDownloadCsv = document.getElementById('btnDownloadCsv');
const resultsSection = document.getElementById('resultsSection');

let allResults = [];
let sortState = null; // null = giữ thứ tự gốc, 'desc' = giảm dần, 'asc' = tăng dần

document.addEventListener('DOMContentLoaded', () => {
    pageIdsInput.value = DEFAULT_PAGE_IDS.join('\n');
});

const fmt = (n) => (n !== '' && n != null) ? new Intl.NumberFormat('en-US').format(n) : '';
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const chunkArr = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

// Lấy EAAB token từ adsmanager.facebook.com (cùng cách extension "Get Token Cookie")
async function fetchEAABToken() {
    const html = await fetch('https://adsmanager.facebook.com/adsmanager/manage/campaigns', {
        credentials: 'include'
    }).then(r => r.text());

    // Trường hợp bình thường: token có trong HTML
    const direct = html.match(/EAAB[A-Za-z0-9_]+/);
    if (direct) return direct[0];

    // Trường hợp có redirect
    const redirectMatch = html.match(/window\.location\.replace\("(.*?)"\)/);
    if (redirectMatch) {
        const redirectUrl = decodeURIComponent(redirectMatch[1]);
        const html2 = await fetch(redirectUrl, { credentials: 'include' }).then(r => r.text());
        const m2 = html2.match(/EAAB[A-Za-z0-9_]+/);
        if (m2) return m2[0];
    }

    return null;
}

// Tự động lấy token
btnGetToken.addEventListener('click', async () => {
    btnGetToken.disabled = true;
    btnGetToken.textContent = 'Đang lấy...';
    tokenStatus.textContent = 'Đang kết nối adsmanager...';
    tokenStatus.className = '';

    try {
        const token = await fetchEAABToken();

        if (token) {
            tokenInput.value = token;
            tokenStatus.textContent = '✓ Lấy token thành công!';
            tokenStatus.className = 'status-ok';
        } else {
            tokenStatus.textContent = '✗ Không tìm thấy token. Hãy đảm bảo đang đăng nhập Facebook.';
            tokenStatus.className = 'status-err';
        }
    } catch (err) {
        tokenStatus.textContent = `Lỗi: ${err.message}`;
        tokenStatus.className = 'status-err';
    } finally {
        btnGetToken.disabled = false;
        btnGetToken.textContent = '🔑 Tự lấy';
    }
});

// Fetch dữ liệu
btnFetch.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const rawIds = pageIdsInput.value.split('\n').map(s => s.trim()).filter(Boolean);

    if (!token) { alert('Chưa có token! Bấm "Tự lấy" hoặc paste vào.'); return; }
    if (rawIds.length === 0) { alert('Nhập ít nhất 1 Page ID!'); return; }

    allResults = [];
    tableBody.innerHTML = '';
    btnFetch.disabled = true;
    btnDownloadCsv.disabled = true;
    resultsSection.style.display = 'block';
    progressBar.style.width = '0%';
    statSuccess.textContent = '0';
    statError.textContent = '0';
    statTotal.textContent = '0';

    const chunks = chunkArr(rawIds, BATCH_SIZE);
    let success = 0, errors = 0, totalFollowers = 0;

    for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        statusText.textContent = `Batch ${i + 1}/${chunks.length} (${c.length} pages)...`;

        const batch = c.map(pid => ({
            method: 'GET',
            relative_url: `${pid}?fields=name,followers_count,fan_count`
        }));

        try {
            const body = new URLSearchParams();
            body.append('access_token', token);
            body.append('batch', JSON.stringify(batch));

            const res = await fetch(GRAPH_URL, { method: 'POST', body });
            const data = await res.json();

            data.forEach((item, idx) => {
                const row = { page_id: c[idx], name: '', followers: '', likes: '', error: '' };
                if (item.code === 200) {
                    try {
                        const b = JSON.parse(item.body);
                        if (b.error) { row.error = b.error.message; errors++; }
                        else {
                            row.name = b.name || '';
                            row.followers = b.followers_count ?? '';
                            row.likes = b.fan_count ?? '';
                            success++;
                            if (row.followers !== '') totalFollowers += Number(row.followers);
                        }
                    } catch { row.error = 'Parse Error'; errors++; }
                } else {
                    try { row.error = JSON.parse(item.body)?.error?.message || `HTTP ${item.code}`; }
                    catch { row.error = `HTTP ${item.code}`; }
                    errors++;
                }
                allResults.push(row);
            });
        } catch (err) {
            c.forEach(pid => {
                allResults.push({ page_id: pid, name: '', followers: '', likes: '', error: 'Request Failed' });
                errors++;
            });
        }

        progressBar.style.width = `${((i + 1) / chunks.length) * 100}%`;
        statSuccess.textContent = success;
        statError.textContent = errors;
        statTotal.textContent = fmt(totalFollowers);
    }

    renderTable();
    statusText.textContent = `Hoàn tất! ${success} thành công, ${errors} lỗi.`;
    btnFetch.disabled = false;
    if (allResults.length) btnDownloadCsv.disabled = false;
});

function getSortedResults() {
    if (!sortState) return [...allResults];
    return [...allResults].sort((a, b) => {
        const fA = a.followers !== '' ? Number(a.followers) : -1;
        const fB = b.followers !== '' ? Number(b.followers) : -1;
        return sortState === 'desc' ? fB - fA : fA - fB;
    });
}

function renderTable() {
    tableBody.innerHTML = '';
    const rows = getSortedResults();

    // Cập nhật icon header
    const thFollowers = document.getElementById('thFollowers');
    if (thFollowers) {
        thFollowers.textContent = 'Followers' + (sortState === 'desc' ? ' ▼' : sortState === 'asc' ? ' ▲' : ' ⇅');
    }

    rows.forEach((row, i) => {
        const tr = document.createElement('tr');
        if (row.error) {
            tr.className = 'row-error';
            tr.innerHTML = `<td>${i + 1}</td><td colspan="2">⚠ ${esc(row.error)}</td><td>${esc(row.page_id)}</td>`;
        } else {
            const fullName = esc(row.name);
            const shortName = row.name.length > 30 ? esc(row.name.slice(0, 28)) + '..' : fullName;
            tr.innerHTML = `<td>${i + 1}</td><td title="${fullName}"><strong>${shortName}</strong></td><td>${fmt(row.followers)}</td><td class="muted">${esc(row.page_id)}</td>`;
        }
        tableBody.appendChild(tr);
    });
}

// Sort khi click header Followers
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('thFollowers')?.addEventListener('click', () => {
        if (!allResults.length) return;
        sortState = sortState === 'desc' ? 'asc' : sortState === 'asc' ? null : 'desc';
        renderTable();
    });
});

// Export CSV
btnDownloadCsv.addEventListener('click', () => {
    if (!allResults.length) return;
    const esc = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
    let csv = '﻿' + 'page_id,name,followers,likes,error\n';
    allResults.forEach(r => { csv += [r.page_id, r.name, r.followers, r.likes, r.error].map(esc).join(',') + '\n'; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `fb_followers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
});
