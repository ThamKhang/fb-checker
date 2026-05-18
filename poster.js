const GRAPH      = 'https://graph.facebook.com/v21.0';
const MAX_IMAGES = 10;
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const INTERVAL_UNITS = [
    { label: 'giờ',  ms: 3_600_000 },
    { label: 'ngày', ms: 86_400_000 },
    { label: 'tuần', ms: 604_800_000 },
];

let _userToken    = '';
let _managedPages = [];
let _posts        = [];
let _nextPostId   = 0;

function makePost() { return { id: _nextPostId++, caption: '', files: [] }; }

// ── Init ──────────────────────────────────────────────────

async function init() {
    const data = await new Promise(r => chrome.storage.local.get(['savedToken'], r));
    _userToken = (data.savedToken || '').trim();

    if (!_userToken) {
        document.getElementById('mainContent').innerHTML =
            `<div class="loading">❌ Chưa có token. Quay lại extension để nhập token rồi mở lại.</div>`;
        return;
    }

    setupSchedule();
    setupBulkDropzone();
    _posts = [makePost()];
    renderQueue();
    setupButtons();
    await loadPages();
}

// ── Pages ─────────────────────────────────────────────────

async function loadPages() {
    const statusEl = document.getElementById('pageStatus');
    statusEl.textContent = '⏳ Đang tải danh sách page...';
    try {
        const res  = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=200&access_token=${encodeURIComponent(_userToken)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        _managedPages = data.data || [];
        statusEl.textContent = '';
        renderPageList();
    } catch (err) {
        statusEl.textContent = `❌ ${err.message}`;
    }
}

function renderPageList() {
    const listEl = document.getElementById('pageList');
    if (!_managedPages.length) {
        listEl.innerHTML = '<div class="poster-empty">Không tìm thấy page nào bạn quản lý.</div>';
        return;
    }
    listEl.innerHTML = _managedPages.map(p => `
        <label class="page-select-item">
          <input type="checkbox" class="page-checkbox" data-id="${esc(p.id)}" data-token="${esc(p.access_token)}">
          <div class="page-select-info">
            <span class="page-select-name">${esc(p.name)}</span>
            <span class="page-select-id">${esc(p.id)}</span>
          </div>
        </label>`).join('');

    listEl.addEventListener('change', refreshButton);
    document.getElementById('btnSelectAll').addEventListener('click', () => {
        listEl.querySelectorAll('.page-checkbox').forEach(cb => cb.checked = true);
        refreshButton();
    });
    document.getElementById('btnSelectNone').addEventListener('click', () => {
        listEl.querySelectorAll('.page-checkbox').forEach(cb => cb.checked = false);
        refreshButton();
    });
}

function selectedPages() {
    return [...document.querySelectorAll('.page-checkbox:checked')].map(cb => ({
        id:           cb.dataset.id,
        access_token: cb.dataset.token,
        name:         cb.closest('.page-select-item').querySelector('.page-select-name').textContent,
    }));
}

// ── Bulk dropzone ─────────────────────────────────────────

function setupBulkDropzone() {
    const zone  = document.getElementById('bulkDropzone');
    const input = document.getElementById('bulkFileInput');

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { bulkAddImages(input.files); input.value = ''; });
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        bulkAddImages(e.dataTransfer.files);
    });
}

function bulkAddImages(files) {
    const images = [...files].filter(f => f.type.startsWith('image/'));
    if (!images.length) return;

    // Nếu chỉ có 1 bài trống, replace luôn thay vì giữ lại
    const isEmpty = _posts.length === 1 && !_posts[0].caption.trim() && !_posts[0].files.length;
    if (isEmpty) _posts = [];

    images.forEach(file => {
        const post = makePost();
        post.files = [file];
        _posts.push(post);
    });

    renderQueue();
}

// ── Queue ─────────────────────────────────────────────────

function renderQueue() {
    const el = document.getElementById('postQueue');
    el.innerHTML = '';
    _posts.forEach(post => el.appendChild(buildCard(post)));
    refreshPreview();
    refreshButton();
}

function buildCard(post) {
    const idx  = _posts.indexOf(post);
    const card = document.createElement('div');
    card.className    = 'post-card';
    card.dataset.postId = post.id;
    card.innerHTML = `
        <div class="post-card-header">
          <span class="post-card-num">Bài ${idx + 1}</span>
          ${_posts.length > 1 ? `<button class="post-card-remove" title="Xóa bài này">✕ Xóa</button>` : ''}
        </div>
        <textarea class="poster-caption post-caption" placeholder="Viết caption...&#10;(Để trống nếu chỉ đăng ảnh)"></textarea>
        <div class="poster-preview-grid post-preview-grid"></div>
        <div class="poster-dropzone post-dropzone">
          <input type="file" class="post-file-input" accept="image/*" multiple style="display:none">
          <span style="font-size:20px">🖼</span>
          <span>Kéo thả ảnh hoặc <u style="cursor:pointer">chọn file</u></span>
          <span class="poster-dropzone-hint">Tối đa ${MAX_IMAGES} ảnh</span>
        </div>
        <div class="post-img-count"></div>`;

    card.querySelector('.post-caption').value = post.caption;
    card.querySelector('.post-caption').addEventListener('input', e => { post.caption = e.target.value; });

    card.querySelector('.post-card-remove')?.addEventListener('click', () => {
        _posts = _posts.filter(p => p.id !== post.id);
        renderQueue();
    });

    const zone  = card.querySelector('.post-dropzone');
    const input = card.querySelector('.post-file-input');
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { addFiles(post, input.files, card); input.value = ''; });
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); addFiles(post, e.dataTransfer.files, card); });

    card.querySelector('.post-preview-grid').addEventListener('click', e => {
        const btn = e.target.closest('.poster-remove-img');
        if (!btn) return;
        post.files.splice(+btn.dataset.idx, 1);
        renderPreviews(post, card);
    });

    renderPreviews(post, card);
    return card;
}

function addFiles(post, files, card) {
    const imgs = [...files].filter(f => f.type.startsWith('image/'));
    const room = MAX_IMAGES - post.files.length;
    if (!room) { alert(`Tối đa ${MAX_IMAGES} ảnh mỗi bài.`); return; }
    post.files = [...post.files, ...imgs.slice(0, room)];
    renderPreviews(post, card);
}

function renderPreviews(post, card) {
    const grid    = card.querySelector('.post-preview-grid');
    const zone    = card.querySelector('.post-dropzone');
    const countEl = card.querySelector('.post-img-count');

    grid.innerHTML = '';
    post.files.forEach((file, i) => {
        const div = document.createElement('div');
        div.className = 'poster-preview-item';
        div.innerHTML = `
            <img src="${URL.createObjectURL(file)}" class="poster-preview-img" alt="">
            <button class="poster-remove-img" data-idx="${i}" title="Xóa">✕</button>`;
        grid.appendChild(div);
    });

    countEl.textContent = post.files.length ? `${post.files.length}/${MAX_IMAGES} ảnh` : '';
    zone.style.display  = post.files.length >= MAX_IMAGES ? 'none' : 'flex';
}

// ── Schedule ──────────────────────────────────────────────

function setupSchedule() {
    const intUnitEl = document.getElementById('intUnit');
    INTERVAL_UNITS.forEach((u, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = u.label;
        if (i === 1) opt.selected = true;
        intUnitEl.appendChild(opt);
    });

    const def = new Date(Date.now() + 15 * 60_000);
    document.getElementById('schedStart').value = def.toISOString().slice(0, 16);

    document.getElementById('schedNow').addEventListener('change',   onSchedChange);
    document.getElementById('schedLater').addEventListener('change', onSchedChange);
    document.getElementById('schedStart').addEventListener('input',  refreshPreview);
    document.getElementById('intVal').addEventListener('input',      refreshPreview);
    document.getElementById('intUnit').addEventListener('change',    refreshPreview);
}

function onSchedChange() {
    const isLater = document.getElementById('schedLater').checked;
    document.getElementById('schedOptions').style.display  = isLater ? 'block' : 'none';
    document.getElementById('intervalRow').style.display   = isLater && _posts.length > 1 ? 'flex' : 'none';
    refreshPreview();
    refreshButton();
}

function schedSettings() {
    const isNow    = document.getElementById('schedNow').checked;
    const intVal   = Math.max(1, parseInt(document.getElementById('intVal').value) || 1);
    const unitIdx  = Math.max(0, Math.min(INTERVAL_UNITS.length - 1, parseInt(document.getElementById('intUnit').value) || 1));
    const intervalMs = INTERVAL_UNITS[unitIdx].ms * intVal;
    const startVal = document.getElementById('schedStart').value;
    const startTime = (!isNow && startVal) ? new Date(startVal) : null;
    return { isNow, startTime, intervalMs };
}

function postTime(postIdx) {
    const { isNow, startTime, intervalMs } = schedSettings();
    if (isNow || !startTime) return null;
    return new Date(startTime.getTime() + postIdx * intervalMs);
}

function fmtTime(date) {
    return date.toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function refreshPreview() {
    const el = document.getElementById('schedPreview');
    const { isNow } = schedSettings();
    // Show interval row only when scheduling + multiple posts
    document.getElementById('intervalRow').style.display =
        (!isNow && _posts.length > 1) ? 'flex' : 'none';

    if (isNow || _posts.length <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = _posts.map((_, i) => {
        const t = postTime(i);
        return t ? `<span class="sched-preview-item">Bài ${i + 1}: ${fmtTime(t)}</span>` : '';
    }).join('');
}

// ── Button label ──────────────────────────────────────────

function refreshButton() {
    const pages  = selectedPages();
    const total  = _posts.length * pages.length;
    const { isNow } = schedSettings();
    const action = isNow ? 'Đăng' : 'Lên lịch';
    const btn    = document.getElementById('btnPost');
    btn.textContent = total > 0
        ? `🚀 ${action} ${_posts.length} bài × ${pages.length} page (${total} lần đăng)`
        : '🚀 Đăng bài';
}

// ── API ───────────────────────────────────────────────────

async function uploadUnpublished(pageId, token, file) {
    const form = new FormData();
    form.append('source', file);
    form.append('published', 'false');
    form.append('access_token', token);
    const res  = await fetch(`${GRAPH}/${pageId}/photos`, { method: 'POST', body: form });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id;
}

async function postToPage(page, post, schedTime, onStatus) {
    const { id, access_token }  = page;
    const { caption, files }    = post;
    const unixTs = schedTime ? Math.floor(schedTime.getTime() / 1000) : null;

    // Text-only
    if (!files.length) {
        onStatus('Đang đăng...');
        const p = new URLSearchParams({ message: caption, access_token });
        if (unixTs) { p.set('published', 'false'); p.set('scheduled_publish_time', unixTs); }
        const res  = await fetch(`${GRAPH}/${id}/feed`, { method: 'POST', body: p });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return;
    }

    // Single image, no schedule → simpler endpoint
    if (files.length === 1 && !unixTs) {
        onStatus('Upload ảnh...');
        const form = new FormData();
        form.append('source', files[0]);
        form.append('message', caption);
        form.append('published', 'true');
        form.append('access_token', access_token);
        const res  = await fetch(`${GRAPH}/${id}/photos`, { method: 'POST', body: form });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return;
    }

    // Multi-image or scheduled: upload unpublished → feed post
    const photoIds = [];
    for (let i = 0; i < files.length; i++) {
        onStatus(`Upload ảnh ${i + 1}/${files.length}...`);
        photoIds.push(await uploadUnpublished(id, access_token, files[i]));
    }

    onStatus(unixTs ? 'Đang lên lịch...' : 'Tạo bài viết...');
    const p = new URLSearchParams();
    if (caption) p.set('message', caption);
    p.set('access_token', access_token);
    if (unixTs) { p.set('published', 'false'); p.set('scheduled_publish_time', unixTs); }
    photoIds.forEach((pid, i) => p.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: pid })));
    const res  = await fetch(`${GRAPH}/${id}/feed`, { method: 'POST', body: p });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
}

// ── Buttons ───────────────────────────────────────────────

function setupButtons() {
    document.getElementById('btnAddPost').addEventListener('click', () => {
        _posts.push(makePost());
        renderQueue();
    });

    document.getElementById('btnPost').addEventListener('click', async () => {
        const pages = selectedPages();
        const { isNow, startTime } = schedSettings();

        if (!pages.length) { alert('Chọn ít nhất 1 page!'); return; }
        if (_posts.every(p => !p.caption.trim() && !p.files.length)) {
            alert('Thêm nội dung hoặc ảnh cho ít nhất 1 bài!'); return;
        }
        if (!isNow) {
            if (!startTime || isNaN(startTime.getTime())) { alert('Chọn ngày giờ bắt đầu hợp lệ!'); return; }
            if (startTime < new Date(Date.now() + 10 * 60_000)) {
                alert('Thời gian lên lịch phải ít nhất 10 phút từ bây giờ!'); return;
            }
        }

        const resultsEl = document.getElementById('results');
        resultsEl.innerHTML = '';
        resultsEl.style.display = 'block';
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const btn    = document.getElementById('btnPost');
        const addBtn = document.getElementById('btnAddPost');
        btn.disabled = addBtn.disabled = true;
        btn.textContent = '⏳ Đang xử lý...';

        // Pre-build all result rows
        const rowOf = {}; // key: `${postId}_${pageId}`
        _posts.forEach((post, pi) => {
            const t       = isNow ? 'Đăng ngay' : fmtTime(postTime(pi));
            const group   = document.createElement('div');
            group.className = 'result-group';
            group.innerHTML = `<div class="result-group-title">Bài ${pi + 1} <span class="result-group-time">${t}</span></div>`;
            const rows = document.createElement('div');
            rows.className = 'result-group-rows';
            pages.forEach(page => {
                const row = document.createElement('div');
                row.className = 'poster-result-row pending';
                row.innerHTML = `<span class="poster-result-name">${esc(page.name)}</span><span class="poster-result-status">⏳ Chờ...</span>`;
                rows.appendChild(row);
                rowOf[`${post.id}_${page.id}`] = row;
            });
            group.appendChild(rows);
            resultsEl.appendChild(group);
        });

        // Execute post × page
        for (let pi = 0; pi < _posts.length; pi++) {
            const post = _posts[pi];
            const time = isNow ? null : postTime(pi);
            for (const page of pages) {
                const row  = rowOf[`${post.id}_${page.id}`];
                const stat = row.querySelector('.poster-result-status');
                stat.textContent = '⏳ Đang xử lý...';
                try {
                    await postToPage(page, post, time, msg => { stat.textContent = `⏳ ${msg}`; });
                    row.className    = 'poster-result-row success';
                    stat.textContent = isNow ? '✓ Đã đăng' : '✓ Đã lên lịch';
                } catch (err) {
                    row.className    = 'poster-result-row error';
                    stat.textContent = `✗ ${err.message}`;
                }
            }
        }

        btn.disabled = addBtn.disabled = false;
        refreshButton();
    });
}

init();
