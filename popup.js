const GRAPH_URL  = "https://graph.facebook.com/v21.0/";
const BATCH_SIZE = 10;

const tokenInput     = document.getElementById('tokenInput');
const btnGetToken    = document.getElementById('btnGetToken');
const tokenStatus    = document.getElementById('tokenStatus');
const pageIdsInput   = document.getElementById('pageIds');
const progressBar    = document.getElementById('progressBar');
const statusText     = document.getElementById('statusText');
const statSuccess    = document.getElementById('statSuccess');
const statError      = document.getElementById('statError');
const statTotal      = document.getElementById('statTotal');
const tableBody      = document.getElementById('tableBody');
const btnDownloadCsv = document.getElementById('btnDownloadCsv');
const resultsSection = document.getElementById('resultsSection');
const analyzeSection = document.getElementById('analyzeSection');
const analyzeBar     = document.getElementById('analyzeBar');
const analyzeText    = document.getElementById('analyzeText');

let allResults = [];
let sortState  = null;

const fmt      = (n) => (n !== '' && n != null) ? new Intl.NumberFormat('en-US').format(n) : '';
const esc      = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const chunkArr = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

// Chấp nhận: numeric ID, URL đầy đủ, fb.com, profile.php?id=, @username, username
function parsePageId(raw) {
    const s = raw.trim();
    if (!s) return null;

    // profile.php?id=123456789
    const profileId = s.match(/[?&]id=(\d+)/);
    if (profileId) return profileId[1];

    // facebook.com/... hoặc fb.com/...
    const urlMatch = s.match(/(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com|m\.facebook\.com)\/([^/?#\s]+)/i);
    if (urlMatch) {
        const seg = urlMatch[1];
        // Bỏ qua segment không phải page (pages/, groups/...)
        if (seg === 'pages') {
            const deepMatch = s.match(/\/pages\/(?:[^/]+\/)?(\d+)/);
            if (deepMatch) return deepMatch[1];
        }
        if (['groups','events','watch','marketplace','gaming','hashtag'].includes(seg)) return null;
        return seg;
    }

    // @username → bỏ @
    if (s.startsWith('@')) return s.slice(1);

    // Numeric ID hoặc username thuần
    return s;
}

// ── Persist state across sessions ────────────────────────
function saveState() {
    chrome.storage.local.set({ savedToken: tokenInput.value.trim(), savedPageIds: pageIdsInput.value });
}
tokenInput.addEventListener('input', saveState);
pageIdsInput.addEventListener('input', saveState);

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['savedToken', 'savedPageIds'], (data) => {
        if (data.savedToken)   tokenInput.value  = data.savedToken;
        if (data.savedPageIds) pageIdsInput.value = data.savedPageIds;
    });
    document.getElementById('thFollowers')?.addEventListener('click', () => {
        if (!allResults.length) return;
        sortState = sortState === 'desc' ? 'asc' : sortState === 'asc' ? null : 'desc';
        renderTable();
    });
});

// ── Token auto-fetch ──────────────────────────────────────
async function fetchEAABToken() {
    const html = await fetch('https://adsmanager.facebook.com/adsmanager/manage/campaigns', { credentials: 'include' }).then(r => r.text());
    const direct = html.match(/EAAB[A-Za-z0-9_]+/);
    if (direct) return direct[0];
    const redir = html.match(/window\.location\.replace\("(.*?)"\)/);
    if (redir) {
        const html2 = await fetch(decodeURIComponent(redir[1]), { credentials: 'include' }).then(r => r.text());
        const m2 = html2.match(/EAAB[A-Za-z0-9_]+/);
        if (m2) return m2[0];
    }
    return null;
}

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
            saveState();
        } else {
            tokenStatus.textContent = '✗ Không tìm thấy token. Hãy đảm bảo đang đăng nhập Facebook.';
            tokenStatus.className = 'status-err';
        }
    } catch (err) {
        tokenStatus.textContent = `Lỗi: ${err.message}`;
        tokenStatus.className = 'status-err';
    } finally {
        btnGetToken.disabled = false;
        btnGetToken.textContent = 'Tự lấy';
    }
});

// ── Shared helpers ────────────────────────────────────────
function validateInputs() {
    const token  = tokenInput.value.trim();
    const rawIds = pageIdsInput.value.split('\n').map(parsePageId).filter(Boolean);
    if (!token)        { alert('Chưa có token! Bấm "Tự lấy" hoặc paste vào.'); return null; }
    if (!rawIds.length){ alert('Nhập ít nhất 1 Page ID hoặc URL hợp lệ!'); return null; }
    return { token, rawIds };
}

// ── Tool: Scanner ────────────────────────────────────────
document.getElementById('toolScanner').addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) { alert('Chưa có token! Bấm "Tự lấy" hoặc paste vào.'); return; }
    saveState();
    chrome.tabs.create({ url: chrome.runtime.getURL('scanner.html') });
});

// ── Tool: Poster ─────────────────────────────────────────
document.getElementById('toolPoster').addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) { alert('Chưa có token! Bấm "Tự lấy" hoặc paste vào.'); return; }
    saveState();
    chrome.tabs.create({ url: chrome.runtime.getURL('poster.html') });
});

function setToolsDisabled(disabled) {
    ['toolFollowers', 'toolManager', 'toolAnalysis', 'toolPoster', 'toolScanner'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
    btnGetToken.disabled = disabled;
}

// ── Tool: Followers Checker (inline) ─────────────────────
document.getElementById('toolFollowers').addEventListener('click', async () => {
    const input = validateInputs();
    if (!input) return;
    const { token, rawIds } = input;

    allResults = [];
    tableBody.innerHTML = '';
    resultsSection.style.display = 'block';
    analyzeSection.style.display = 'none';
    progressBar.style.width = '0%';
    statSuccess.textContent = '0';
    statError.textContent   = '0';
    statTotal.textContent   = '0';
    btnDownloadCsv.disabled = true;
    setToolsDisabled(true);

    const chunks = chunkArr(rawIds, BATCH_SIZE);
    let success = 0, errors = 0, totalFollowers = 0;

    for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        statusText.textContent = `Batch ${i + 1}/${chunks.length} (${c.length} pages)...`;

        const batch = c.map(pid => ({ method: 'GET', relative_url: `${pid}?fields=name,followers_count,fan_count` }));
        try {
            const body = new URLSearchParams();
            body.append('access_token', token);
            body.append('batch', JSON.stringify(batch));
            const res  = await fetch(GRAPH_URL, { method: 'POST', body });
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
                            row.likes     = b.fan_count ?? '';
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
            c.forEach(pid => { allResults.push({ page_id: pid, name: '', followers: '', likes: '', error: 'Request Failed' }); errors++; });
        }

        progressBar.style.width = `${((i + 1) / chunks.length) * 100}%`;
        statSuccess.textContent = success;
        statError.textContent   = errors;
        statTotal.textContent   = fmt(totalFollowers);
    }

    renderTable();
    statusText.textContent = `Hoàn tất! ${success} thành công, ${errors} lỗi.`;
    setToolsDisabled(false);
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
    const th = document.getElementById('thFollowers');
    if (th) th.textContent = 'Followers' + (sortState === 'desc' ? ' ▼' : sortState === 'asc' ? ' ▲' : ' ⇅');
    rows.forEach((row, i) => {
        const tr = document.createElement('tr');
        if (row.error) {
            tr.className = 'row-error';
            tr.innerHTML = `<td>${i + 1}</td><td colspan="2">⚠ ${esc(row.error)}</td><td>${esc(row.page_id)}</td>`;
        } else {
            const fullName  = esc(row.name);
            const shortName = row.name.length > 30 ? esc(row.name.slice(0, 28)) + '..' : fullName;
            tr.innerHTML = `<td>${i + 1}</td><td title="${fullName}"><strong>${shortName}</strong></td><td>${fmt(row.followers)}</td><td class="muted">${esc(row.page_id)}</td>`;
        }
        tableBody.appendChild(tr);
    });
}

// ── Tool: Post Manager (full-tab) ─────────────────────────
document.getElementById('toolManager').addEventListener('click', () => {
    const input = validateInputs();
    if (!input) return;
    saveState();
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
});

// ── Tool: Content Analysis (full-tab) ────────────────────
async function getManagedPageTokens(userToken) {
    try {
        const res  = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(userToken)}`);
        const data = await res.json();
        if (data.error) return {};
        const map = {};
        (data.data || []).forEach(p => { map[p.id] = { token: p.access_token, name: p.name }; });
        return map;
    } catch { return {}; }
}

async function fetchAllPosts(pageId, token, isManaged, onProgress) {
    const FULL = 'id,message,story,created_time,shares,reactions.summary(true),comments.summary(true),attachments{type,media_type},permalink_url';
    const MIN  = 'id,message,story,created_time,shares,attachments{type,media_type},permalink_url';
    const attempts = [
        { ep: isManaged ? 'posts' : 'feed', fields: FULL },
        { ep: 'feed',  fields: FULL },
        { ep: 'feed',  fields: MIN  },
        { ep: 'posts', fields: MIN  },
    ];
    let lastError  = '';
    let bestPosts  = [];
    let bestError  = '';
    for (const { ep, fields } of attempts) {
        const posts = [];
        let url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/${ep}?fields=${fields}&limit=100&access_token=${encodeURIComponent(token)}`;
        let failed = false;
        while (url && posts.length < 1000) {
            try {
                const res  = await fetch(url);
                const data = await res.json();
                if (data.error) { lastError = `[${ep}] ${data.error.message}`; failed = true; break; }
                if (!data.data) { failed = true; break; }
                data.data.forEach(p => posts.push(p));
                onProgress(posts.length);
                url = data.paging?.next || null;
            } catch (e) { lastError = e.message; failed = true; break; }
        }
        const dedup = (arr) => { const s = new Set(); return arr.filter(p => s.has(p.id) ? false : s.add(p.id)); };
        if (!failed) return { posts: dedup(posts), error: null };
        if (posts.length > bestPosts.length) { bestPosts = posts; bestError = lastError; }
    }
    if (bestPosts.length > 0) {
        const s = new Set();
        return { posts: bestPosts.filter(p => s.has(p.id) ? false : s.add(p.id)), error: bestError };
    }
    return { posts: [], error: lastError || 'Không có quyền đọc bài viết' };
}

function normalizePost(p) {
    const att = p.attachments?.data?.[0];
    let type = 'text';
    if (att) {
        const t = att.type || att.media_type || '';
        if (t.includes('video')) type = 'video';
        else if (['photo','multi_share','cover_photo','profile_media','album'].includes(t)) type = 'photo';
        else if (t === 'share') type = 'link';
        else type = 'other';
    }
    return {
        id: p.id,
        message: (p.message || p.story || '').slice(0, 300),
        created_time: p.created_time,
        type,
        reactions: p.reactions?.summary?.total_count || 0,
        comments:  p.comments?.summary?.total_count  || 0,
        shares:    p.shares?.count || 0,
        permalink_url: p.permalink_url || ''
    };
}

document.getElementById('toolAnalysis').addEventListener('click', async () => {
    const input = validateInputs();
    if (!input) return;
    const { token, rawIds } = input;

    analyzeSection.style.display = 'block';
    resultsSection.style.display = 'none';
    analyzeBar.style.width  = '0%';
    analyzeText.textContent = 'Đang kiểm tra quyền truy cập...';
    setToolsDisabled(true);

    try {
        const managedMap   = await getManagedPageTokens(token);
        const analysisData = { fetchedAt: new Date().toISOString(), userToken: token, pageTokens: {}, pages: [] };

        for (let pi = 0; pi < rawIds.length; pi++) {
            const pageId    = rawIds[pi];
            const managed   = managedMap[pageId];
            const pageToken = managed?.token || token;
            const isManaged = !!managed;

            analyzeText.textContent = `Đang lấy thông tin page ${pageId}...`;

            const infoRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=name,followers_count&access_token=${encodeURIComponent(pageToken)}`);
            const info    = await infoRes.json();
            if (info.error) {
                analysisData.pages.push({ pageId, pageName: pageId, followersCount: 0, isManaged: false, posts: [], error: info.error.message });
                continue;
            }

            const pageName = info.name || pageId;
            const { posts: rawPosts, error: fetchError } = await fetchAllPosts(pageId, pageToken, isManaged, (count) => {
                analyzeText.textContent = `${pageName}: đã lấy ${count} bài...`;
            });

            analysisData.pageTokens[pageId] = pageToken;
            analysisData.pages.push({
                pageId, pageName,
                followersCount: info.followers_count || 0,
                isManaged,
                posts: rawPosts.map(normalizePost),
                fetchError: fetchError || null
            });

            analyzeBar.style.width = `${((pi + 1) / rawIds.length) * 100}%`;
        }

        await chrome.storage.local.set({ analysisData });
        analyzeText.textContent = 'Đang mở dashboard...';
        chrome.tabs.create({ url: chrome.runtime.getURL('analysis.html') });
        analyzeSection.style.display = 'none';
    } catch (err) {
        analyzeText.textContent = `Lỗi: ${err.message}`;
    } finally {
        setToolsDisabled(false);
    }
});

// ── Export CSV ────────────────────────────────────────────
btnDownloadCsv.addEventListener('click', () => {
    if (!allResults.length) return;
    const q  = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
    let csv  = '﻿page_id,name,followers,likes,error\n';
    allResults.forEach(r => { csv += [r.page_id, r.name, r.followers, r.likes, r.error].map(q).join(',') + '\n'; });
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `fb_followers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
});
