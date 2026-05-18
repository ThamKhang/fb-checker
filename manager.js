// manager.js — Standalone Post Manager (no analysis dependency)

const esc     = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt     = (n) => (n != null && n !== '') ? new Intl.NumberFormat('vi-VN').format(+n) : '0';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });

const GRAPH     = 'https://graph.facebook.com/v21.0';
const PAGE_SIZE = 50;

const TIME_PRESETS = [
    { label: '30 ngày', days: 30  },
    { label: '3 tháng', days: 90  },
    { label: '6 tháng', days: 180 },
    { label: '1 năm',   days: 365 },
    { label: 'Tất cả',  days: null },
];

const TYPE_LABEL = { photo:'🖼 Ảnh', video:'🎬 Video', link:'🔗 Link', text:'📝 Text', other:'📎 Khác' };

// userToken set in init(), used by autoFetchPageToken button handlers
let _userToken = '';

// Chấp nhận: numeric ID, URL đầy đủ, fb.com, profile.php?id=, @username, username
function parsePageId(raw) {
    const s = raw.trim();
    if (!s) return null;
    const profileId = s.match(/[?&]id=(\d+)/);
    if (profileId) return profileId[1];
    const urlMatch = s.match(/(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com|m\.facebook\.com)\/([^/?#\s]+)/i);
    if (urlMatch) {
        const seg = urlMatch[1];
        if (seg === 'pages') { const d = s.match(/\/pages\/(?:[^/]+\/)?(\d+)/); if (d) return d[1]; }
        if (['groups','events','watch','marketplace','gaming','hashtag'].includes(seg)) return null;
        return seg;
    }
    if (s.startsWith('@')) return s.slice(1);
    return s;
}

// ── Post fetching ─────────────────────────────────────────

async function fetchAllPosts(pageId, token, onProgress) {
    const FULL = 'id,message,story,created_time,shares,reactions.summary(true),comments.summary(true),attachments{type,media_type},permalink_url';
    const MIN  = 'id,message,story,created_time,shares,attachments{type,media_type},permalink_url';
    // feed trước: trả về nhiều bài hơn (kể cả bài của người dùng đăng lên page)
    const attempts = [
        { ep: 'feed',  fields: FULL },
        { ep: 'posts', fields: FULL },
        { ep: 'feed',  fields: MIN  },
        { ep: 'posts', fields: MIN  },
    ];
    let lastError  = '';
    let bestResult = { posts: [], error: '' };

    for (const { ep, fields } of attempts) {
        const posts = [];
        let url    = `${GRAPH}/${encodeURIComponent(pageId)}/${ep}?fields=${fields}&limit=100&access_token=${encodeURIComponent(token)}`;
        let failed = false;

        while (url && posts.length < 2000) {
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

        if (posts.length > bestResult.posts.length) bestResult = { posts, error: lastError };
    }

    if (bestResult.posts.length > 0) {
        const s = new Set();
        return { posts: bestResult.posts.filter(p => s.has(p.id) ? false : s.add(p.id)), error: bestResult.error };
    }
    return { posts: [], error: lastError || 'Không có quyền đọc bài viết' };
}

function normalizePost(p) {
    const att = p.attachments?.data?.[0];
    let type  = 'text';
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

function applyPostFilter(posts, { fromDate, toDate, type }) {
    return posts.filter(p => {
        const d = new Date(p.created_time);
        if (fromDate && d < fromDate) return false;
        if (toDate   && d > toDate)   return false;
        if (type && type !== 'all' && p.type !== type) return false;
        return true;
    });
}

// ── Page token helpers ────────────────────────────────────

const TOKEN_RE = /EAAB[A-Za-z0-9_]{40,}/g;

function longestToken(html, exclude = '') {
    const matches = (html.match(TOKEN_RE) || []).filter(t => t !== exclude);
    return matches.sort((a, b) => b.length - a.length)[0] || null;
}

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

    // M0: passively captured by background.js
    try {
        const stored = await new Promise(r => chrome.storage.local.get('capturedPageTokens', d => r(d.capturedPageTokens || {})));
        if (stored[pageId]) return { token: stored[pageId], source: 'Auto-capture (webRequest)' };
        if (stored['_latest'] && stored['_latest'] !== userToken) {
            const r = await fetch(`${GRAPH}/${pageId}?fields=id&access_token=${encodeURIComponent(stored['_latest'])}`);
            const d = await r.json();
            if (!d.error) return { token: stored['_latest'], source: 'Auto-capture (latest)' };
        }
    } catch (e) { errors.push(`M0: ${e.message}`); }

    // M1: direct access_token field
    try {
        const r = await fetch(`${GRAPH}/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`);
        const d = await r.json();
        if (!d.error && d.access_token) return { token: d.access_token, source: 'Graph API direct' };
        if (d.error) errors.push(`M1: ${d.error.message}`);
    } catch (e) { errors.push(`M1: ${e.message}`); }

    // M2: /me/accounts
    try {
        const r = await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`);
        const d = await r.json();
        if (!d.error) {
            const match = (d.data || []).find(p => p.id === pageId);
            if (match?.access_token) return { token: match.access_token, source: 'Tài khoản cá nhân' };
        } else errors.push(`M2: ${d.error.message}`);
    } catch (e) { errors.push(`M2: ${e.message}`); }

    // M3: Business Manager
    try {
        const br = await fetch(`${GRAPH}/me/businesses?fields=id,name&limit=10&access_token=${encodeURIComponent(userToken)}`);
        const bd = await br.json();
        if (!bd.error) {
            for (const biz of (bd.data || [])) {
                const pr = await fetch(`${GRAPH}/${biz.id}/owned_pages?fields=id,access_token&limit=100&access_token=${encodeURIComponent(userToken)}`);
                const pd = await pr.json();
                if (!pd.error) {
                    const match = (pd.data || []).find(p => p.id === pageId);
                    if (match?.access_token) return { token: match.access_token, source: `Business: ${biz.name}` };
                }
            }
        } else errors.push(`M3: ${bd.error.message}`);
    } catch (e) { errors.push(`M3: ${e.message}`); }

    // M4: Cookie fb_dtsg
    try {
        const homeHtml = await fetch('https://www.facebook.com/', { credentials: 'include' }).then(r => r.text());
        const fbDtsg   = extractFbDtsg(homeHtml);
        if (fbDtsg) {
            const body = new URLSearchParams({ fb_dtsg: fbDtsg, batch: JSON.stringify([{ method:'GET', relative_url:'me/accounts?fields=id,access_token&limit=100' }]) });
            const res  = await fetch(`${GRAPH}/`, { method:'POST', credentials:'include', body });
            const json = await res.json();
            if (Array.isArray(json) && json[0]?.code === 200) {
                const data  = JSON.parse(json[0].body);
                const match = (data.data || []).find(p => p.id === pageId);
                if (match?.access_token) return { token: match.access_token, source: 'Cookie session' };
            }
        } else errors.push('M4: không tìm được fb_dtsg');
    } catch (e) { errors.push(`M4: ${e.message}`); }

    // M5: Creator Studio
    try {
        const html  = await fetch(`https://business.facebook.com/creatorstudio/page/${pageId}/posts/published`, { credentials: 'include' }).then(r => r.text());
        const token = longestToken(html, userToken);
        if (token) return { token, source: 'Creator Studio' };
        else errors.push('M5: không tìm thấy token');
    } catch (e) { errors.push(`M5: ${e.message}`); }

    // M6: Pages Manager
    try {
        const html  = await fetch(`https://www.facebook.com/pages/manage/?page_id=${pageId}`, { credentials: 'include' }).then(r => r.text());
        const token = longestToken(html, userToken);
        if (token) return { token, source: 'Pages Manager' };
        else errors.push('M6: không tìm thấy token');
    } catch (e) { errors.push(`M6: ${e.message}`); }

    return { token: null, source: null, errors };
}

// ── Delete ────────────────────────────────────────────────

async function deletePostsWithProgress(postIds, token, onProgress) {
    const results = { success: 0, failed: 0, failedIds: [], lastError: '' };

    async function tryDelete(id, retries = 2) {
        for (let attempt = 0; attempt < retries; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
            try {
                const res  = await fetch(`${GRAPH}/${encodeURIComponent(id)}?access_token=${encodeURIComponent(token)}`, { method: 'DELETE' });
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    if (json === true || json?.success === true) return { ok: true };
                    const msg = json?.error?.message || 'Unknown error';
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
        const { ok, error } = await tryDelete(postIds[i]);
        if (ok) results.success++;
        else { results.failed++; results.failedIds.push(postIds[i]); if (error) results.lastError = error; }
        onProgress(i + 1, postIds.length, results);
        if (i < postIds.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    return results;
}

// ── Modal ─────────────────────────────────────────────────

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

// ── Export CSV ────────────────────────────────────────────

function exportPostsCsv(posts, pageName) {
    const q   = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
    let csv   = '﻿id,message,created_time,type,reactions,comments,shares,url\n';
    posts.forEach(p => {
        csv += [p.id, p.message, p.created_time, p.type, p.reactions, p.comments, p.shares, p.permalink_url].map(q).join(',') + '\n';
    });
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${pageName.replace(/[^a-z0-9]/gi, '_')}_posts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

// ── Management section ────────────────────────────────────

function renderManagementSection(container, pageData, pageToken, isManaged) {
    let allPosts    = [...pageData.posts];
    let filtered    = [...allPosts];
    let selected    = new Set();
    let currentPage = 1;
    let activeToken = pageToken;

    container.innerHTML = `
      <section class="chart-card management-card">

        ${isManaged ? `
        <div class="mgmt-token-row">
          <button id="btnAutoToken" class="btn-auto-token">🔑 Lấy Page Token tự động</button>
          <span class="token-divider">hoặc</span>
          <input type="password" id="manualPageToken" placeholder="Dán Page Access Token...">
          <button id="btnSetToken" class="btn-apply">Dùng</button>
          <span id="tokenMsg" class="token-msg"></span>
        </div>
        ` : `
        <div class="mgmt-readonly-notice">
          🔒 Bạn không phải admin — chỉ xem và xuất dữ liệu
        </div>
        `}

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
          ${isManaged ? `<label class="check-all-label"><input type="checkbox" id="checkAll"> Chọn tất cả</label>` : ''}
          <span id="selCount" class="sel-count">${isManaged ? `Đã chọn: 0 / ${allPosts.length} bài` : `${allPosts.length} bài viết`}</span>
          <button id="btnExportCsv" class="btn-export">⬇ Xuất CSV</button>
          ${isManaged ? `<button id="btnDeleteSel" class="btn-delete-sel" disabled>🗑 Xóa bài đã chọn</button>` : ''}
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
      </section>
    `;

    const section      = container.querySelector('section');
    const presetsWrap  = section.querySelector('#mgmtPresets');
    const fromInput    = section.querySelector('#mgmtFrom');
    const toInput      = section.querySelector('#mgmtTo');
    const typeSelect   = section.querySelector('#mgmtType');
    const applyBtn     = section.querySelector('#mgmtApply');
    const selCount     = section.querySelector('#selCount');
    const btnExportCsv = section.querySelector('#btnExportCsv');
    const listWrap     = section.querySelector('#mgmtList');
    const pagPrev      = section.querySelector('#pagPrev');
    const pagNext      = section.querySelector('#pagNext');
    const pagInfo      = section.querySelector('#pagInfo');

    // Admin-only refs
    const manualInput  = section.querySelector('#manualPageToken');
    const btnSetToken  = section.querySelector('#btnSetToken');
    const btnAutoToken = section.querySelector('#btnAutoToken');
    const tokenMsg     = section.querySelector('#tokenMsg');
    const checkAll     = section.querySelector('#checkAll');
    const btnDeleteSel = section.querySelector('#btnDeleteSel');
    const progressArea = section.querySelector('#mgmtProgress');
    const progBar      = section.querySelector('#mgmtProgBar');
    const progText     = section.querySelector('#mgmtProgText');

    // ── Export ──
    btnExportCsv.addEventListener('click', () => exportPostsCsv(filtered, pageData.pageName));

    // ── Admin-only: token management ──
    if (isManaged) {
        function setTokenOk(token, label) {
            activeToken = token;
            tokenMsg.textContent = `✓ ${label}`;
            tokenMsg.className   = 'token-msg ok';
        }

        btnSetToken.addEventListener('click', () => {
            const val = manualInput.value.trim();
            if (val) setTokenOk(val, 'Token đã lưu');
        });

        btnAutoToken.addEventListener('click', async () => {
            if (!_userToken) { tokenMsg.textContent = '✗ Chưa có token — mở lại từ extension'; tokenMsg.className = 'token-msg err'; return; }
            btnAutoToken.disabled    = true;
            btnAutoToken.textContent = '⏳ Đang lấy...';
            tokenMsg.textContent     = '';
            tokenMsg.className       = 'token-msg';

            const result = await autoFetchPageToken(pageData.pageId, _userToken);

            btnAutoToken.disabled    = false;
            btnAutoToken.textContent = '🔑 Lấy Page Token tự động';

            if (result?.token) {
                manualInput.value = result.token;
                setTokenOk(result.token, `Lấy thành công (${result.source})`);
            } else {
                const errDetail = result?.errors?.join(' | ') || '';
                tokenMsg.innerHTML = `✗ Tự động thất bại.<br>
                  <small style="color:#475569">${esc(errDetail)}</small><br>
                  <strong style="color:#f59e0b">💡 Thử:</strong> Mở tab Facebook → vào trang quản lý page → bấm lại.<br>
                  Hoặc vào <a href="https://developers.facebook.com/tools/explorer/" target="_blank" class="post-link">Graph API Explorer ↗</a> → tick <code>pages_manage_posts</code> → dán token vào ô trên.`;
                tokenMsg.className = 'token-msg err';
            }
        });
    }

    // Preset buttons
    TIME_PRESETS.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className   = 'preset-btn';
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
            presetsWrap.querySelectorAll('.preset-btn').forEach((b, j) => b.classList.toggle('active', j === i));
            const now = new Date();
            fromInput.value = p.days ? new Date(now - p.days * 86400000).toISOString().slice(0, 10) : '';
            toInput.value   = p.days ? now.toISOString().slice(0, 10) : '';
        });
        presetsWrap.appendChild(btn);
    });

    function updateCounts() {
        if (isManaged) {
            const n = [...selected].filter(id => filtered.some(p => p.id === id)).length;
            selCount.textContent     = `Đã chọn: ${n} / ${filtered.length} bài`;
            btnDeleteSel.disabled    = n === 0;
            btnDeleteSel.textContent = n > 0 ? `🗑 Xóa ${n} bài đã chọn` : '🗑 Xóa bài đã chọn';
        } else {
            selCount.textContent = `${filtered.length} bài viết`;
        }
    }

    function renderList() {
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        currentPage      = Math.min(currentPage, totalPages);
        const start      = (currentPage - 1) * PAGE_SIZE;
        const pagePosts  = filtered.slice(start, start + PAGE_SIZE);

        pagPrev.disabled    = currentPage <= 1;
        pagNext.disabled    = currentPage >= totalPages;
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
          ${isManaged ? '<th><input type="checkbox" id="checkPage"></th>' : ''}
          <th>#</th><th>Bài viết</th><th>Ngày</th>
          <th class="num">❤️</th><th class="num">💬</th><th class="num">🔁</th>
          <th>Loại</th><th></th>
        </tr></thead>`;

        const tbody = document.createElement('tbody');
        pagePosts.forEach((p, i) => {
            const tr    = document.createElement('tr');
            if (isManaged && selected.has(p.id)) tr.classList.add('selected-row');
            const raw   = p.message || '(Không có nội dung)';
            const short = raw.length > 62 ? raw.slice(0, 60) + '…' : raw;
            tr.innerHTML = `
              ${isManaged ? `<td><input type="checkbox" class="post-chk" data-id="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}></td>` : ''}
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

        if (isManaged) {
            const pageChk   = table.querySelector('#checkPage');
            const allChked  = pagePosts.every(p => selected.has(p.id));
            const someChked = pagePosts.some(p => selected.has(p.id));
            pageChk.checked       = allChked;
            pageChk.indeterminate = someChked && !allChked;

            pageChk.addEventListener('change', () => {
                pagePosts.forEach(p => { if (pageChk.checked) selected.add(p.id); else selected.delete(p.id); });
                renderList(); updateCounts();
            });

            table.querySelectorAll('.post-chk').forEach(chk => {
                chk.addEventListener('change', () => {
                    if (chk.checked) selected.add(chk.dataset.id);
                    else             selected.delete(chk.dataset.id);
                    chk.closest('tr').classList.toggle('selected-row', chk.checked);
                    const all  = pagePosts.every(p => selected.has(p.id));
                    const some = pagePosts.some(p => selected.has(p.id));
                    pageChk.checked        = all;
                    pageChk.indeterminate  = some && !all;
                    checkAll.checked       = filtered.every(p => selected.has(p.id));
                    checkAll.indeterminate = filtered.some(p => selected.has(p.id)) && !checkAll.checked;
                    updateCounts();
                });
            });
        }

        updateCounts();
    }

    applyBtn.addEventListener('click', () => {
        const fromV = fromInput.value ? new Date(fromInput.value + 'T00:00:00') : null;
        const toV   = toInput.value   ? new Date(toInput.value + 'T23:59:59')   : null;
        filtered    = applyPostFilter(allPosts, { fromDate: fromV, toDate: toV, type: typeSelect.value });
        if (isManaged) {
            selected = new Set([...selected].filter(id => filtered.some(p => p.id === id)));
            checkAll.checked = checkAll.indeterminate = false;
        }
        currentPage = 1;
        renderList();
    });

    if (isManaged) {
        checkAll.addEventListener('change', () => {
            if (checkAll.checked) filtered.forEach(p => selected.add(p.id));
            else                  selected.clear();
            checkAll.indeterminate = false;
            renderList();
        });

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

                    const results = await deletePostsWithProgress(toDelete, activeToken, (done, total, r) => {
                        const pct = Math.round(done / total * 100);
                        progBar.style.width  = pct + '%';
                        progText.textContent = `${done}/${total} — ✓ ${r.success}  ✗ ${r.failed}`;
                    });

                    progressArea.style.display = 'none';
                    applyBtn.disabled          = false;

                    const deletedSet = new Set(results.failedIds.length < toDelete.length
                        ? toDelete.filter(id => !results.failedIds.includes(id))
                        : []);
                    allPosts  = allPosts.filter(p => !deletedSet.has(p.id));
                    filtered  = filtered.filter(p => !deletedSet.has(p.id));
                    selected  = new Set([...selected].filter(id => !deletedSet.has(id)));

                    const msg = results.lastError
                        ? `Hoàn tất: ✓ ${results.success} thành công  ✗ ${results.failed} thất bại — Lỗi: ${results.lastError}`
                        : `Hoàn tất: ✓ ${results.success} bài đã xóa thành công`;
                    showConfirmModal({ title: 'Kết quả xóa', body: msg, confirmLabel: 'OK', danger: false, onConfirm: () => {} });

                    renderList();
                    btnDeleteSel.disabled = false;
                }
            });
        });
    }

    pagPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderList(); } });
    pagNext.addEventListener('click', () => {
        if (currentPage < Math.ceil(filtered.length / PAGE_SIZE)) { currentPage++; renderList(); }
    });

    renderList();
}

// ── Per-page loader ───────────────────────────────────────

async function loadPage(pageId, panel, tabEl) {
    panel.innerHTML = `<div class="loading" id="loadingMsg">⏳ Đang tải thông tin page...</div>`;

    const setMsg = (t) => { const el = panel.querySelector('#loadingMsg'); if (el) el.textContent = t; };

    try {
        // Page info
        const infoRes = await fetch(`${GRAPH}/${encodeURIComponent(pageId)}?fields=name,followers_count&access_token=${encodeURIComponent(_userToken)}`);
        const info    = await infoRes.json();
        if (info.error) throw new Error(info.error.message);

        const pageName = info.name || pageId;
        tabEl.textContent = pageName.length > 18 ? pageName.slice(0, 16) + '…' : pageName;

        // Try to get page token via /me/accounts first (fast path)
        let pageToken = _userToken;
        let isManaged = false;
        try {
            const ar = await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(_userToken)}`);
            const ad = await ar.json();
            if (!ad.error) {
                const match = (ad.data || []).find(p => p.id === pageId);
                if (match?.access_token) { pageToken = match.access_token; isManaged = true; }
            }
        } catch {}

        // Fetch posts
        setMsg(`${pageName}: đang tải bài viết...`);
        const { posts: raw, error: fetchErr } = await fetchAllPosts(pageId, pageToken, (count) => {
            setMsg(`${pageName}: đã tải ${fmt(count)} bài...`);
        });

        panel.innerHTML = '';

        // Error notice if fetch failed
        if (fetchErr) {
            const notice = document.createElement('div');
            notice.className = 'fetch-error-box';
            notice.innerHTML = `<div class="fetch-err-title">⚠ Không đọc được bài viết đầy đủ</div>
              <div class="fetch-err-msg">${esc(fetchErr)}</div>
              <div class="fetch-err-hint">Token thiếu quyền <code>pages_read_engagement</code>. Dùng "Lấy Page Token tự động" bên dưới để thử lại.</div>`;
            panel.appendChild(notice);
        }

        const pageData = { pageId, pageName, followersCount: info.followers_count || 0, posts: raw.map(normalizePost) };
        renderManagementSection(panel, pageData, pageToken, isManaged);

    } catch (err) {
        panel.innerHTML = `<div class="loading">❌ ${esc(err.message)}</div>`;
    }
}

// ── Init ──────────────────────────────────────────────────

async function init() {
    const data     = await new Promise(r => chrome.storage.local.get(['savedToken', 'savedPageIds'], r));
    _userToken     = (data.savedToken || '').trim();
    const rawIds   = (data.savedPageIds || '').split('\n').map(parsePageId).filter(Boolean);

    const mainContent = document.getElementById('mainContent');
    const pageTabs    = document.getElementById('pageTabs');
    const dashMeta    = document.getElementById('dashMeta');

    if (!_userToken || !rawIds.length) {
        mainContent.innerHTML = `<div class="loading">❌ Chưa có token hoặc Page ID.<br>Quay lại extension để nhập rồi bấm <strong>Xóa bài viết</strong> lại.</div>`;
        return;
    }

    dashMeta.textContent = `${rawIds.length} page · Token: ${_userToken.slice(0, 20)}…`;

    if (rawIds.length === 1) {
        mainContent.innerHTML = '';
        const panel = document.createElement('div');
        mainContent.appendChild(panel);
        loadPage(rawIds[0], panel, { textContent: '' });
        return;
    }

    // Multi-page: tab UI
    mainContent.innerHTML = '';
    const panels  = {};
    const loaded  = new Set();

    rawIds.forEach((pageId, idx) => {
        const tab = document.createElement('button');
        tab.className     = 'page-tab' + (idx === 0 ? ' active' : '');
        tab.textContent   = '…' + pageId.slice(-6);
        tab.dataset.id    = pageId;
        pageTabs.appendChild(tab);

        const panel = document.createElement('div');
        panel.style.display = idx === 0 ? 'block' : 'none';
        mainContent.appendChild(panel);
        panels[pageId] = { panel, tab };
    });

    function switchTo(pageId) {
        rawIds.forEach(id => {
            panels[id].tab.classList.toggle('active', id === pageId);
            panels[id].panel.style.display = id === pageId ? 'block' : 'none';
        });
        if (!loaded.has(pageId)) {
            loaded.add(pageId);
            loadPage(pageId, panels[pageId].panel, panels[pageId].tab);
        }
    }

    pageTabs.addEventListener('click', e => {
        const tab = e.target.closest('.page-tab');
        if (tab) switchTo(tab.dataset.id);
    });

    switchTo(rawIds[0]);
}

init();
