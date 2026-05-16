// analysis.js — Content Analysis + Post Management Dashboard

const esc  = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt  = (n) => (n != null && n !== '') ? new Intl.NumberFormat('vi-VN').format(+n) : '0';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });

const PALETTE   = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316'];
const DAYS_VI   = ['CN','T2','T3','T4','T5','T6','T7'];
const TYPE_LABEL = { photo:'🖼 Ảnh', video:'🎬 Video', link:'🔗 Link', text:'📝 Text', other:'📎 Khác' };
const PAGE_SIZE  = 50;

const TIME_PRESETS = [
    { label: '30 ngày', days: 30  },
    { label: '3 tháng', days: 90  },
    { label: '6 tháng', days: 180 },
    { label: '1 năm',   days: 365 },
    { label: 'Tất cả',  days: null },
];

// ── Data processing ──────────────────────────────────────

function computeStats(posts, followersCount) {
    const n = posts.length;
    if (!n) return null;
    const totalR = posts.reduce((s, p) => s + p.reactions, 0);
    const totalC = posts.reduce((s, p) => s + p.comments, 0);
    const totalS = posts.reduce((s, p) => s + p.shares, 0);
    const times   = posts.map(p => new Date(p.created_time).getTime());
    const minT = Math.min(...times), maxT = Math.max(...times);
    const daysDiff = Math.max(1, (maxT - minT) / 86400000);
    const avgEng = followersCount > 0
        ? +((totalR + totalC + totalS) / n / followersCount * 100).toFixed(2) : null;
    return {
        totalPosts: n,
        avgReactions: +(totalR / n).toFixed(1),
        avgComments:  +(totalC / n).toFixed(1),
        avgShares:    +(totalS / n).toFixed(1),
        avgEngagement: avgEng,
        postsPerWeek: +(n / daysDiff * 7).toFixed(1),
        dateFrom: new Date(minT),
        dateTo:   new Date(maxT),
    };
}

function getPostsOverTime(posts) {
    const buckets = {};
    posts.forEach(p => {
        const d = new Date(p.created_time);
        const ws = new Date(d);
        ws.setDate(d.getDate() - d.getDay());
        ws.setHours(0, 0, 0, 0);
        const k = ws.toISOString().slice(0, 10);
        buckets[k] = (buckets[k] || 0) + 1;
    });
    return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({ label: k, value: v }));
}

function getPostTypes(posts) {
    const counts = {};
    posts.forEach(p => { const t = p.type || 'text'; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([t, v]) => ({ label: TYPE_LABEL[t] || t, value: v }));
}

function getPostsByHour(posts) {
    const h = Array(24).fill(0);
    posts.forEach(p => { h[new Date(p.created_time).getHours()]++; });
    return h.map((v, i) => ({ label: `${i}h`, value: v }));
}

function getPostsByDay(posts) {
    const d = Array(7).fill(0);
    posts.forEach(p => { d[new Date(p.created_time).getDay()]++; });
    return d.map((v, i) => ({ label: DAYS_VI[i], value: v }));
}

function getTopPosts(posts, n = 10) {
    return [...posts]
        .sort((a, b) => (b.reactions + b.comments + b.shares) - (a.reactions + a.comments + a.shares))
        .slice(0, n);
}

function getWorstPosts(posts, n = 10) {
    return [...posts]
        .sort((a, b) => (a.reactions + a.comments + a.shares) - (b.reactions + b.comments + b.shares))
        .slice(0, n);
}

function applyPostFilter(posts, { fromDate, toDate, type }) {
    return posts.filter(p => {
        const t = new Date(p.created_time);
        if (fromDate && t < fromDate) return false;
        if (toDate   && t > toDate)   return false;
        if (type && type !== 'all' && p.type !== type) return false;
        return true;
    });
}

// ── SVG helpers ──────────────────────────────────────────

const NS = 'http://www.w3.org/2000/svg';

function mkEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

function makeSvg(vw, vh) {
    return mkEl('svg', { viewBox: `0 0 ${vw} ${vh}`, class: 'chart-svg' });
}

function svgTxt(x, y, text, { size = 9, fill = '#64748b', anchor = 'middle', weight = '' } = {}) {
    const t = mkEl('text', { x, y, 'font-size': size, fill, 'text-anchor': anchor, ...(weight ? { 'font-weight': weight } : {}) });
    t.textContent = text;
    return t;
}

// ── Line / Area chart ────────────────────────────────────

function renderLineChart(data) {
    const VW = 560, VH = 160, pL = 34, pR = 14, pT = 10, pB = 26;
    const cW = VW - pL - pR, cH = VH - pT - pB;
    const svg = makeSvg(VW, VH);
    if (!data.length) return svg;

    const maxV = Math.max(...data.map(d => d.value), 1);
    const n = data.length;
    const xS = n > 1 ? cW / (n - 1) : cW;
    const pts = data.map((d, i) => ({ x: pL + i * xS, y: pT + cH - (d.value / maxV * cH), ...d }));

    [0, 0.5, 1].forEach(f => {
        const y = pT + cH - f * cH;
        svg.appendChild(mkEl('line', { x1: pL, y1: y, x2: VW - pR, y2: y, stroke: 'rgba(255,255,255,0.06)' }));
        svg.appendChild(svgTxt(pL - 4, y + 3, Math.round(maxV * f), { anchor: 'end' }));
    });

    let ad = `M${pL},${pT + cH} L${pts[0].x},${pts[0].y}`;
    pts.slice(1).forEach(p => { ad += ` L${p.x},${p.y}`; });
    ad += ` L${pts[pts.length - 1].x},${pT + cH} Z`;
    svg.appendChild(mkEl('path', { d: ad, fill: 'rgba(59,130,246,0.12)' }));

    let ld = `M${pts[0].x},${pts[0].y}`;
    pts.slice(1).forEach(p => { ld += ` L${p.x},${p.y}`; });
    svg.appendChild(mkEl('path', { d: ld, fill: 'none', stroke: '#3b82f6', 'stroke-width': 1.5 }));

    const step = Math.max(1, Math.ceil(n / 8));
    pts.forEach((p, i) => {
        svg.appendChild(mkEl('circle', { cx: p.x, cy: p.y, r: n > 24 ? 2 : 3, fill: '#3b82f6' }));
        if (i % step === 0 || i === n - 1) svg.appendChild(svgTxt(p.x, VH - 4, p.label.slice(5)));
    });

    return svg;
}

// ── Donut chart ──────────────────────────────────────────

function renderDonutChart(data) {
    const VW = 300, VH = 170, cx = 80, cy = 85, R = 66, ri = 38;
    const svg = makeSvg(VW, VH);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return svg;

    let angle = -Math.PI / 2;
    data.forEach((d, i) => {
        const sweep = (d.value / total) * 2 * Math.PI;
        const col = PALETTE[i % PALETTE.length];
        d._color = col;

        if (sweep >= 2 * Math.PI - 0.001) {
            // 100% — arc command breaks when start===end, draw two circles instead
            svg.appendChild(mkEl('circle', { cx, cy, r: R, fill: col }));
            svg.appendChild(mkEl('circle', { cx, cy, r: ri, fill: '#1e293b' }));
        } else {
            const end = angle + sweep;
            const x1 = cx + R * Math.cos(angle),  y1 = cy + R * Math.sin(angle);
            const x2 = cx + R * Math.cos(end),    y2 = cy + R * Math.sin(end);
            const ix1 = cx + ri * Math.cos(end),  iy1 = cy + ri * Math.sin(end);
            const ix2 = cx + ri * Math.cos(angle), iy2 = cy + ri * Math.sin(angle);
            const lg = sweep > Math.PI ? 1 : 0;
            svg.appendChild(mkEl('path', {
                d: `M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${ri},${ri} 0 ${lg},0 ${ix2},${iy2} Z`,
                fill: col
            }));
            angle = end;
        }
    });

    data.forEach((d, i) => {
        const y = 28 + i * 22;
        svg.appendChild(mkEl('rect', { x: 178, y: y - 8, width: 10, height: 10, fill: d._color, rx: 2 }));
        const pct = ((d.value / total) * 100).toFixed(0);
        svg.appendChild(svgTxt(192, y, `${d.label}  ${pct}%`, { anchor: 'start', size: 10, fill: '#94a3b8' }));
    });

    return svg;
}

// ── Bar chart ────────────────────────────────────────────

function renderBarChart(data, color = '#3b82f6') {
    const VW = 560, VH = 150, pL = 32, pR = 10, pT = 8, pB = 24;
    const cW = VW - pL - pR, cH = VH - pT - pB;
    const n = data.length;
    const bW = Math.max(1, Math.floor(cW / n) - 2);
    const svg = makeSvg(VW, VH);
    const maxV = Math.max(...data.map(d => d.value), 1);

    [0, 0.5, 1].forEach(f => {
        const y = pT + cH - f * cH;
        svg.appendChild(mkEl('line', { x1: pL, y1: y, x2: VW - pR, y2: y, stroke: 'rgba(255,255,255,0.06)' }));
        svg.appendChild(svgTxt(pL - 4, y + 3, Math.round(maxV * f), { anchor: 'end' }));
    });

    data.forEach((d, i) => {
        const bH = Math.max(2, Math.round(d.value / maxV * cH));
        const x = pL + i * (cW / n) + 1;
        svg.appendChild(mkEl('rect', {
            x, y: pT + cH - bH, width: bW, height: bH,
            fill: d.value === maxV ? '#f59e0b' : color, rx: 2
        }));
        svg.appendChild(svgTxt(x + bW / 2, VH - 4, d.label));
    });

    return svg;
}

// ── Stats grid ───────────────────────────────────────────

function renderStatsGrid(stats) {
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    [
        { v: fmt(stats.totalPosts),   label: 'Tổng bài viết',        cls: 'blue'   },
        { v: fmt(stats.avgReactions), label: 'Avg Reactions / bài',   cls: 'green'  },
        { v: fmt(stats.avgComments),  label: 'Avg Comments / bài',    cls: 'purple' },
        { v: fmt(stats.avgShares),    label: 'Avg Shares / bài',      cls: 'yellow' },
        { v: stats.avgEngagement != null ? stats.avgEngagement + '%' : 'N/A', label: 'Engagement Rate', cls: 'cyan' },
        { v: stats.postsPerWeek,      label: 'Bài / tuần',            cls: 'red'    },
    ].forEach(c => {
        const card = document.createElement('div');
        card.className = `stat-card ${c.cls}`;
        card.innerHTML = `<div class="stat-value">${c.v}</div><div class="stat-label">${c.label}</div>`;
        grid.appendChild(card);
    });
    return grid;
}

// ── Posts table (top/worst) ──────────────────────────────

function renderPostsTable(posts, title, titleColor) {
    const card = document.createElement('div');
    card.className = 'chart-card';

    const h = document.createElement('div');
    h.className = 'chart-title';
    h.style.color = titleColor;
    h.textContent = title;
    card.appendChild(h);

    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'post-table';
    table.innerHTML = `<thead><tr>
      <th>#</th><th>Bài viết</th><th>Ngày</th>
      <th class="num">❤️</th><th class="num">💬</th><th class="num">🔁</th>
      <th class="total-eng">Tổng</th><th></th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    posts.forEach((p, i) => {
        const tr = document.createElement('tr');
        const total = p.reactions + p.comments + p.shares;
        const raw   = p.message || '(Không có nội dung)';
        const short = raw.length > 58 ? raw.slice(0, 56) + '…' : raw;
        tr.innerHTML = `
          <td class="rank">${i + 1}</td>
          <td class="post-msg" title="${esc(raw)}">${esc(short)}</td>
          <td class="post-date">${fmtDate(p.created_time)}</td>
          <td class="num">${fmt(p.reactions)}</td>
          <td class="num">${fmt(p.comments)}</td>
          <td class="num">${fmt(p.shares)}</td>
          <td class="total-eng">${fmt(total)}</td>
          <td>${p.permalink_url ? `<a href="${esc(p.permalink_url)}" target="_blank" class="post-link">↗</a>` : ''}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);
    return card;
}

// ── Modal helper ─────────────────────────────────────────

function showConfirmModal({ title, body, confirmLabel, danger = false, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${body}</div>
        <div class="modal-btns">
          <button class="modal-cancel">Hủy</button>
          <button class="modal-confirm${danger ? ' danger' : ''}">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm').addEventListener('click', () => { overlay.remove(); onConfirm(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Page Token auto-fetch ────────────────────────────────

const TOKEN_RE = /EAAB[A-Za-z0-9_]{40,}/g;

function longestToken(html, exclude = '') {
    const matches = (html.match(TOKEN_RE) || []).filter(t => t !== exclude);
    return matches.sort((a, b) => b.length - a.length)[0] || null;
}

// Trích fb_dtsg từ HTML của Facebook (dùng cho cookie-based auth)
function extractFbDtsg(html) {
    const patterns = [
        /"DTSGInitialData"[^[]*\[.*?"token":"([^"]+)"/s,
        /"token":"([^"]+)","async_get_token/,
        /name="fb_dtsg"\s+value="([^"]+)"/,
        /"fb_dtsg"[^"]*"([^"]{10,})"/,
    ];
    for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1];
    }
    return null;
}

async function autoFetchPageToken(pageId, userToken) {
    const errors = [];

    // Method 0: check tokens passively captured by background.js webRequest listener
    try {
        const stored = await new Promise(resolve => chrome.storage.local.get('capturedPageTokens', d => resolve(d.capturedPageTokens || {})));
        if (stored[pageId]) return { token: stored[pageId], source: 'Auto-capture (webRequest)' };
        if (stored['_latest'] && stored['_latest'] !== userToken) {
            // Verify this token actually works for our page before using it
            const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=id&access_token=${encodeURIComponent(stored['_latest'])}`);
            const d = await r.json();
            if (!d.error) return { token: stored['_latest'], source: 'Auto-capture (latest token)' };
        }
    } catch (e) { errors.push(`M0: ${e.message}`); }

    // Method 1: direct access_token field on page object
    try {
        const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`);
        const d = await r.json();
        if (!d.error && d.access_token) return { token: d.access_token, source: 'Graph API direct' };
        if (d.error) errors.push(`M1: ${d.error.message}`);
    } catch (e) { errors.push(`M1: ${e.message}`); }

    // Method 2: /me/accounts
    try {
        const r = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(userToken)}`);
        const d = await r.json();
        if (!d.error) {
            const match = (d.data || []).find(p => p.id === pageId);
            if (match?.access_token) return { token: match.access_token, source: 'Tài khoản cá nhân' };
        } else errors.push(`M2: ${d.error.message}`);
    } catch (e) { errors.push(`M2: ${e.message}`); }

    // Method 3: Business Manager
    try {
        const br = await fetch(`https://graph.facebook.com/v21.0/me/businesses?fields=id,name&limit=10&access_token=${encodeURIComponent(userToken)}`);
        const bd = await br.json();
        if (!bd.error) {
            for (const biz of (bd.data || [])) {
                const pr = await fetch(`https://graph.facebook.com/v21.0/${biz.id}/owned_pages?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(userToken)}`);
                const pd = await pr.json();
                if (!pd.error) {
                    const match = (pd.data || []).find(p => p.id === pageId);
                    if (match?.access_token) return { token: match.access_token, source: `Business Manager: ${biz.name}` };
                }
            }
        } else errors.push(`M3: ${bd.error.message}`);
    } catch (e) { errors.push(`M3: ${e.message}`); }

    // Method 4: Cookie-based — dùng fb_dtsg để call Graph API batch
    try {
        const homeHtml = await fetch('https://www.facebook.com/', { credentials: 'include' }).then(r => r.text());
        const fbDtsg   = extractFbDtsg(homeHtml);
        if (fbDtsg) {
            const body = new URLSearchParams({
                fb_dtsg: fbDtsg,
                batch:   JSON.stringify([{ method: 'GET', relative_url: `me/accounts?fields=id,access_token&limit=100` }]),
            });
            const res  = await fetch('https://graph.facebook.com/v21.0/', { method: 'POST', credentials: 'include', body });
            const json = await res.json();
            if (Array.isArray(json) && json[0]?.code === 200) {
                const data  = JSON.parse(json[0].body);
                const match = (data.data || []).find(p => p.id === pageId);
                if (match?.access_token) return { token: match.access_token, source: 'Cookie session (fb_dtsg)' };
            }
        } else errors.push('M4: không tìm được fb_dtsg');
    } catch (e) { errors.push(`M4: ${e.message}`); }

    // Method 5: Creator Studio
    try {
        const html  = await fetch(`https://business.facebook.com/creatorstudio/page/${pageId}/posts/published`, { credentials: 'include' }).then(r => r.text());
        const token = longestToken(html, userToken);
        if (token) return { token, source: 'Creator Studio' };
        else errors.push('M5: không tìm thấy token trong HTML');
    } catch (e) { errors.push(`M5: ${e.message}`); }

    // Method 6: Pages Manage
    try {
        const html  = await fetch(`https://www.facebook.com/pages/manage/?page_id=${pageId}`, { credentials: 'include' }).then(r => r.text());
        const token = longestToken(html, userToken);
        if (token) return { token, source: 'Pages Manager' };
        else errors.push('M6: không tìm thấy token trong HTML');
    } catch (e) { errors.push(`M6: ${e.message}`); }

    // Tất cả thất bại — trả về lỗi chi tiết
    return { token: null, source: null, errors };
}

// ── Delete API ───────────────────────────────────────────

async function deletePostsWithProgress(postIds, token, onProgress) {
    const results = { success: 0, failed: 0, failedIds: [], lastError: '' };

    async function tryDelete(id, retries = 2) {
        for (let attempt = 0; attempt < retries; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
            try {
                const res = await fetch(
                    `https://graph.facebook.com/v21.0/${encodeURIComponent(id)}?access_token=${encodeURIComponent(token)}`,
                    { method: 'DELETE' }
                );
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    if (json === true || json?.success === true) return { ok: true };
                    const msg = json?.error?.message || 'Unknown error';
                    // Only retry generic "unknown" errors, not permission errors
                    if (attempt < retries - 1 && msg.toLowerCase().includes('unknown')) continue;
                    return { ok: false, error: msg };
                } catch {
                    if (text.trim() === 'true') return { ok: true };
                    return { ok: false, error: text.slice(0, 80) };
                }
            } catch (e) {
                if (attempt < retries - 1) continue;
                return { ok: false, error: e.message };
            }
        }
        return { ok: false, error: 'Max retries exceeded' };
    }

    for (let i = 0; i < postIds.length; i++) {
        const id = postIds[i];
        const { ok, error } = await tryDelete(id);
        if (ok) results.success++;
        else {
            results.failed++;
            results.failedIds.push(id);
            if (error) results.lastError = error;
        }
        onProgress(i + 1, postIds.length, results);
        // 500ms between requests to avoid Facebook rate limiting
        if (i < postIds.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    return results;
}

// ── Management Section ───────────────────────────────────

function renderManagementSection(pageData, pageToken) {
    // Mutable state
    let allPosts = [...pageData.posts];
    let filtered = [...allPosts];
    let selected  = new Set();
    let currentPage = 1;

    const section = document.createElement('section');
    section.className = 'chart-card management-card';

    // Header
    // Allow token override if auto-detection failed
    let activeToken = pageToken;

    section.innerHTML = `
      <div class="mgmt-header">
        <div class="chart-title" style="margin-bottom:0">🗑 Quản lý &amp; Xóa bài viết</div>
        ${!pageData.isManaged
            ? '<span class="mgmt-notice">⚠️ Token tự động có thể thiếu quyền xóa — thử trực tiếp hoặc nhập Page Token bên dưới</span>'
            : ''}
      </div>
      ${!pageData.isManaged ? `
      <div class="mgmt-token-row" id="mgmtTokenRow">
        <button id="btnAutoToken" class="btn-auto-token">🔑 Lấy Page Token tự động</button>
        <span class="token-divider">hoặc</span>
        <input type="password" id="manualPageToken" placeholder="Dán Page Access Token thủ công...">
        <button id="btnSetToken" class="btn-apply">Dùng</button>
        <span id="tokenMsg" class="token-msg"></span>
      </div>` : ''}

      <div class="mgmt-filter">
        <div class="mgmt-presets" id="mgmtPresets"></div>
        <div class="mgmt-date-row">
          <label>Từ <input type="date" id="mgmtFrom"></label>
          <label>Đến <input type="date" id="mgmtTo"></label>
          <select id="mgmtType">
            <option value="all">Tất cả loại</option>
            <option value="photo">🖼 Ảnh</option>
            <option value="video">🎬 Video</option>
            <option value="link">🔗 Link</option>
            <option value="text">📝 Text</option>
            <option value="other">📎 Khác</option>
          </select>
          <button id="mgmtApply" class="btn-apply">Áp dụng</button>
        </div>
      </div>

      <div class="mgmt-sel-row">
        <label class="check-all-label">
          <input type="checkbox" id="checkAll"> Chọn tất cả
        </label>
        <span id="selCount" class="sel-count">Đã chọn: 0 / ${allPosts.length} bài</span>
        <button id="btnDeleteSel" class="btn-delete-sel" disabled>
          🗑 Xóa bài đã chọn
        </button>
      </div>

      <div class="mgmt-progress" id="mgmtProgress" style="display:none">
        <div class="mgmt-prog-bar-wrap"><div class="mgmt-prog-bar" id="mgmtProgBar"></div></div>
        <div id="mgmtProgText" class="mgmt-prog-text"></div>
      </div>

      <div class="mgmt-list-wrap" id="mgmtList"></div>

      <div class="mgmt-pagination">
        <button id="pagPrev">← Trước</button>
        <span id="pagInfo"></span>
        <button id="pagNext">Tiếp →</button>
      </div>
    `;

    // Token override (only rendered when isManaged = false)
    const manualTokenInput = section.querySelector('#manualPageToken');
    const btnSetToken      = section.querySelector('#btnSetToken');
    const btnAutoToken     = section.querySelector('#btnAutoToken');
    const tokenMsg         = section.querySelector('#tokenMsg');

    function setTokenOk(token, label) {
        activeToken = token;
        if (tokenMsg) { tokenMsg.textContent = `✓ ${label}`; tokenMsg.className = 'token-msg ok'; }
    }

    if (btnSetToken) {
        btnSetToken.addEventListener('click', () => {
            const val = manualTokenInput?.value.trim();
            if (val) setTokenOk(val, 'Token đã lưu');
        });
    }

    if (btnAutoToken) {
        btnAutoToken.addEventListener('click', async () => {
            const userToken = _analysisData?.userToken;
            if (!userToken) {
                if (tokenMsg) { tokenMsg.textContent = '✗ Không có userToken — chạy lại Phân tích từ extension'; tokenMsg.className = 'token-msg err'; }
                return;
            }
            btnAutoToken.disabled = true;
            btnAutoToken.textContent = '⏳ Đang lấy...';
            if (tokenMsg) { tokenMsg.textContent = ''; tokenMsg.className = 'token-msg'; }

            const result = await autoFetchPageToken(pageData.pageId, userToken);
            btnAutoToken.disabled = false;
            btnAutoToken.textContent = '🔑 Lấy Page Token tự động';

            if (result?.token) {
                if (manualTokenInput) manualTokenInput.value = result.token;
                setTokenOk(result.token, `Lấy thành công (${result.source})`);
            } else {
                const errDetail = result?.errors?.join(' | ') || '';
                if (tokenMsg) {
                    tokenMsg.innerHTML = `✗ Tự động thất bại.<br>
                      <small style="color:#475569">${esc(errDetail)}</small><br>
                      <strong style="color:#f59e0b">💡 Thử cách này:</strong> Mở tab mới → vào trang Facebook của page (facebook.com/${esc(pageData.pageId)}) → duyệt qua vài mục (Bài viết, Cài đặt...) → quay lại bấm <em>Lấy Page Token tự động</em> lại.<br>
                      Nếu vẫn không được: Vào <a href="https://developers.facebook.com/tools/explorer/" target="_blank" class="post-link">Graph API Explorer ↗</a>
                      → tick <code>pages_manage_posts</code> → copy dán vào ô bên trên.`;
                    tokenMsg.className = 'token-msg err';
                }
            }
        });
    }

    // Refs
    const presetsWrap  = section.querySelector('#mgmtPresets');
    const fromInput    = section.querySelector('#mgmtFrom');
    const toInput      = section.querySelector('#mgmtTo');
    const typeSelect   = section.querySelector('#mgmtType');
    const applyBtn     = section.querySelector('#mgmtApply');
    const checkAll     = section.querySelector('#checkAll');
    const selCount     = section.querySelector('#selCount');
    const btnDeleteSel = section.querySelector('#btnDeleteSel');
    const progressArea = section.querySelector('#mgmtProgress');
    const progBar      = section.querySelector('#mgmtProgBar');
    const progText     = section.querySelector('#mgmtProgText');
    const listWrap     = section.querySelector('#mgmtList');
    const pagPrev      = section.querySelector('#pagPrev');
    const pagNext      = section.querySelector('#pagNext');
    const pagInfo      = section.querySelector('#pagInfo');

    // ── Preset buttons ──────────────────────────────────

    TIME_PRESETS.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
            presetsWrap.querySelectorAll('.preset-btn').forEach((b, j) => b.classList.toggle('active', j === i));
            const now = new Date();
            if (p.days) {
                fromInput.value = new Date(now - p.days * 86400000).toISOString().slice(0, 10);
                toInput.value   = now.toISOString().slice(0, 10);
            } else {
                fromInput.value = '';
                toInput.value   = '';
            }
        });
        presetsWrap.appendChild(btn);
    });

    // ── Update selection counter ────────────────────────

    function updateCounts() {
        const selInFiltered = [...selected].filter(id => filtered.some(p => p.id === id));
        const n = selInFiltered.length;
        selCount.textContent = `Đã chọn: ${n} / ${filtered.length} bài`;
        btnDeleteSel.disabled = n === 0;
        btnDeleteSel.textContent = n > 0 ? `🗑 Xóa ${n} bài đã chọn` : '🗑 Xóa bài đã chọn';
    }

    // ── Render post list ────────────────────────────────

    function renderList() {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        currentPage = Math.min(currentPage, totalPages);
        const start = (currentPage - 1) * PAGE_SIZE;
        const pagePosts = filtered.slice(start, start + PAGE_SIZE);

        pagPrev.disabled = currentPage <= 1;
        pagNext.disabled = currentPage >= totalPages;
        pagInfo.textContent = `Trang ${currentPage} / ${totalPages}  (${fmt(filtered.length)} bài)`;

        listWrap.innerHTML = '';
        if (!filtered.length) {
            listWrap.innerHTML = '<div class="mgmt-empty">Không có bài viết nào khớp bộ lọc.</div>';
            updateCounts();
            return;
        }

        const table = document.createElement('table');
        table.className = 'post-table mgmt-table';
        table.innerHTML = `<thead><tr>
          <th><input type="checkbox" id="checkPage"></th>
          <th>#</th><th>Bài viết</th><th>Ngày</th>
          <th class="num">❤️</th><th class="num">💬</th><th class="num">🔁</th>
          <th>Loại</th><th></th>
        </tr></thead>`;

        const tbody = document.createElement('tbody');
        pagePosts.forEach((p, i) => {
            const tr = document.createElement('tr');
            if (selected.has(p.id)) tr.classList.add('selected-row');
            const raw   = p.message || '(Không có nội dung)';
            const short = raw.length > 62 ? raw.slice(0, 60) + '…' : raw;
            tr.innerHTML = `
              <td><input type="checkbox" class="post-chk" data-id="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}></td>
              <td class="rank">${start + i + 1}</td>
              <td class="post-msg" title="${esc(raw)}">${esc(short)}</td>
              <td class="post-date">${fmtDate(p.created_time)}</td>
              <td class="num">${fmt(p.reactions)}</td>
              <td class="num">${fmt(p.comments)}</td>
              <td class="num">${fmt(p.shares)}</td>
              <td class="post-type">${TYPE_LABEL[p.type] || p.type}</td>
              <td>${p.permalink_url ? `<a href="${esc(p.permalink_url)}" target="_blank" class="post-link">↗</a>` : ''}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        listWrap.appendChild(table);

        // Page-level checkbox state
        const pageChk = table.querySelector('#checkPage');
        const allChked  = pagePosts.every(p => selected.has(p.id));
        const someChked = pagePosts.some(p => selected.has(p.id));
        pageChk.checked       = allChked;
        pageChk.indeterminate = someChked && !allChked;

        pageChk.addEventListener('change', () => {
            pagePosts.forEach(p => { if (pageChk.checked) selected.add(p.id); else selected.delete(p.id); });
            renderList();
            updateCounts();
        });

        table.querySelectorAll('.post-chk').forEach(chk => {
            chk.addEventListener('change', () => {
                if (chk.checked) selected.add(chk.dataset.id);
                else             selected.delete(chk.dataset.id);
                chk.closest('tr').classList.toggle('selected-row', chk.checked);
                const all  = pagePosts.every(p => selected.has(p.id));
                const some = pagePosts.some(p => selected.has(p.id));
                pageChk.checked = all; pageChk.indeterminate = some && !all;
                checkAll.checked = filtered.every(p => selected.has(p.id));
                checkAll.indeterminate = filtered.some(p => selected.has(p.id)) && !checkAll.checked;
                updateCounts();
            });
        });

        updateCounts();
    }

    // ── Filter apply ────────────────────────────────────

    applyBtn.addEventListener('click', () => {
        const fromV = fromInput.value ? new Date(fromInput.value + 'T00:00:00') : null;
        const toV   = toInput.value   ? new Date(toInput.value + 'T23:59:59')   : null;
        filtered = applyPostFilter(allPosts, { fromDate: fromV, toDate: toV, type: typeSelect.value });
        selected = new Set([...selected].filter(id => filtered.some(p => p.id === id)));
        currentPage = 1;
        checkAll.checked = checkAll.indeterminate = false;
        renderList();
    });

    // ── Check all ───────────────────────────────────────

    checkAll.addEventListener('change', () => {
        if (checkAll.checked) filtered.forEach(p => selected.add(p.id));
        else                  selected.clear();
        checkAll.indeterminate = false;
        renderList();
    });

    // ── Pagination ──────────────────────────────────────

    pagPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderList(); } });
    pagNext.addEventListener('click', () => {
        if (currentPage < Math.ceil(filtered.length / PAGE_SIZE)) { currentPage++; renderList(); }
    });

    // ── Delete ──────────────────────────────────────────

    btnDeleteSel.addEventListener('click', () => {
        const toDelete = [...selected].filter(id => filtered.some(p => p.id === id));
        if (!toDelete.length) return;

        showConfirmModal({
            title: `Xóa ${toDelete.length} bài viết?`,
            body:  `⚠️ Hành động này <strong>không thể hoàn tác</strong>.<br>Bài viết sẽ bị xóa vĩnh viễn khỏi Facebook.`,
            confirmLabel: 'Xóa vĩnh viễn',
            danger: true,
            onConfirm: async () => {
                btnDeleteSel.disabled = true;
                applyBtn.disabled     = true;
                progressArea.style.display = 'block';
                progBar.style.background   = '#3b82f6';
                listWrap.style.opacity     = '0.4';

                const results = await deletePostsWithProgress(toDelete, activeToken, (done, total, r) => {
                    progBar.style.width = Math.round(done / total * 100) + '%';
                    progText.textContent = `Đang xóa ${done}/${total}…  ✓ ${r.success}  ✗ ${r.failed}`;
                });

                // Remove successfully deleted posts from lists
                const failedSet  = new Set(results.failedIds);
                const deletedIds = new Set(toDelete.filter(id => !failedSet.has(id)));
                allPosts = allPosts.filter(p => !deletedIds.has(p.id));
                filtered = filtered.filter(p => !deletedIds.has(p.id));
                selected = new Set([...selected].filter(id => !deletedIds.has(id)));
                pageData.posts = [...allPosts];

                progBar.style.background = results.failed ? (results.success ? '#f59e0b' : '#ef4444') : '#10b981';
                progText.textContent = `Hoàn tất: ✓ ${results.success} thành công  ✗ ${results.failed} thất bại`
                    + (results.failed && results.lastError ? `  — Lỗi: ${results.lastError}` : '');

                listWrap.style.opacity = '1';
                applyBtn.disabled      = false;
                checkAll.checked = checkAll.indeterminate = false;
                setTimeout(() => { progressArea.style.display = 'none'; }, 5000);
                renderList();
            }
        });
    });

    // Initial render
    renderList();
    return section;
}

// ── Page Section ─────────────────────────────────────────

function renderPageSection(pageData, pageToken) {
    const { pageName, followersCount, isManaged, posts, error } = pageData;
    const frag = document.createDocumentFragment();

    // Info bar
    const bar = document.createElement('div');
    bar.className = 'page-info-bar';
    bar.innerHTML = `
      <span class="page-name">${esc(pageName)}</span>
      ${isManaged
          ? '<span class="managed-badge">✓ Quản lý</span>'
          : '<span class="public-badge">🌐 Public</span>'}
      ${followersCount ? `<span class="followers">👥 ${fmt(followersCount)} followers</span>` : ''}
      <span style="color:#475569;font-size:11px">${fmt(posts.length)} bài được phân tích</span>
    `;
    frag.appendChild(bar);

    if (error) {
        const errEl = document.createElement('div');
        errEl.className = 'error-msg';
        errEl.textContent = `Lỗi: ${error}`;
        frag.appendChild(errEl);
        return frag;
    }

    if (!posts.length) {
        const empty = document.createElement('div');
        empty.className = 'fetch-error-box';
        empty.innerHTML = `
          <div class="fetch-err-icon">⚠️</div>
          <div class="fetch-err-title">Không lấy được bài viết</div>
          ${pageData.fetchError
              ? `<div class="fetch-err-detail">${esc(pageData.fetchError)}</div>`
              : ''}
          <div class="fetch-err-hint">
            Token EAAB có thể thiếu quyền <code>pages_read_engagement</code> với page này.<br>
            Thử bấm <strong>🔑 Lấy Page Token tự động</strong> rồi chạy lại phân tích.
          </div>`;
        frag.appendChild(empty);
        return frag;
    }

    // Stats
    frag.appendChild(renderStatsGrid(computeStats(posts, followersCount)));

    // Line + Donut
    const cr = document.createElement('div');
    cr.className = 'charts-row';

    const lineCard = document.createElement('div');
    lineCard.className = 'chart-card';
    lineCard.innerHTML = `<div class="chart-title">📈 Số bài viết theo tuần</div>`;
    lineCard.appendChild(renderLineChart(getPostsOverTime(posts)));
    cr.appendChild(lineCard);

    const donutCard = document.createElement('div');
    donutCard.className = 'chart-card';
    donutCard.innerHTML = `<div class="chart-title">🎯 Phân loại bài</div>`;
    donutCard.appendChild(renderDonutChart(getPostTypes(posts)));
    cr.appendChild(donutCard);
    frag.appendChild(cr);

    // Hours + Days
    const cr2 = document.createElement('div');
    cr2.className = 'charts-row-equal';

    const hCard = document.createElement('div');
    hCard.className = 'chart-card';
    hCard.innerHTML = `<div class="chart-title">🕐 Giờ đăng bài  <span style="color:#f59e0b;font-size:10px">■ Cao điểm</span></div>`;
    hCard.appendChild(renderBarChart(getPostsByHour(posts), '#3b82f6'));
    cr2.appendChild(hCard);

    const dCard = document.createElement('div');
    dCard.className = 'chart-card';
    dCard.innerHTML = `<div class="chart-title">📅 Ngày trong tuần  <span style="color:#f59e0b;font-size:10px">■ Cao điểm</span></div>`;
    dCard.appendChild(renderBarChart(getPostsByDay(posts), '#8b5cf6'));
    cr2.appendChild(dCard);
    frag.appendChild(cr2);

    // Top / Worst tables
    const tablesRow = document.createElement('div');
    tablesRow.className = 'tables-row';
    tablesRow.appendChild(renderPostsTable(getTopPosts(posts, 10),   '🏆 Top 10 bài engagement cao nhất', '#34d399'));
    tablesRow.appendChild(renderPostsTable(getWorstPosts(posts, 10), '📉 Top 10 bài engagement thấp nhất', '#fb7185'));
    frag.appendChild(tablesRow);

    // Management section
    frag.appendChild(renderManagementSection(pageData, pageToken));

    return frag;
}

// ── Main ─────────────────────────────────────────────────

let _analysisData = null; // accessible by management sections

async function init() {
    const mainContent = document.getElementById('mainContent');
    const dashMeta    = document.getElementById('dashMeta');
    const pageTabs    = document.getElementById('pageTabs');

    let data;
    try {
        const result = await chrome.storage.local.get('analysisData');
        data = result.analysisData;
    } catch (e) {
        mainContent.innerHTML = `<div class="error-msg">Lỗi đọc dữ liệu: ${esc(e.message)}</div>`;
        return;
    }

    _analysisData = data;

    if (!data?.pages?.length) {
        mainContent.innerHTML = `<div class="no-data">
          Không có dữ liệu phân tích.<br>
          <small>Mở extension → chọn Page ID → bấm 📊 Phân tích</small>
        </div>`;
        return;
    }

    const totalPosts = data.pages.reduce((s, p) => s + p.posts.length, 0);
    dashMeta.textContent = `${data.pages.length} page · ${fmt(totalPosts)} bài · ${new Date(data.fetchedAt).toLocaleString('vi-VN')}`;

    const getToken = (pageId) => data.pageTokens?.[pageId] || null;

    if (data.pages.length === 1) {
        mainContent.innerHTML = '';
        mainContent.appendChild(renderPageSection(data.pages[0], getToken(data.pages[0].pageId)));
        return;
    }

    function showPage(idx) {
        mainContent.innerHTML = '';
        const p = data.pages[idx];
        mainContent.appendChild(renderPageSection(p, getToken(p.pageId)));
        document.querySelectorAll('.page-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    }

    data.pages.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className = 'page-tab' + (i === 0 ? ' active' : '');
        btn.textContent = p.pageName;
        btn.addEventListener('click', () => showPage(i));
        pageTabs.appendChild(btn);
    });

    mainContent.innerHTML = '';
    mainContent.appendChild(renderPageSection(data.pages[0], getToken(data.pages[0].pageId)));
}

document.addEventListener('DOMContentLoaded', init);
