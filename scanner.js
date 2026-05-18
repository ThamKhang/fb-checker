const GRAPH = 'https://graph.facebook.com/v21.0';
const esc   = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtN  = n => (n != null && n !== '') ? new Intl.NumberFormat('en-US').format(Math.round(n)) : '—';
const fmtPct = n => n != null ? (n * 100).toFixed(1) + '%' : '—';
const fmtUSD = (min, max) => `$${min.toFixed(1)}–$${max.toFixed(1)}`;

// ── Niche definitions ─────────────────────────────────────
// rpm = [publisher_min, publisher_max] per 1000 views (USD)

const NICHES = [
    {
        name: 'Finance', color: '#10b981', rpm: [8, 18],
        keys: ['bank','financial','invest','insurance','mortgage','accounting','tax','credit','loan','forex','stock','crypto','wealth','finance','tài chính','ngân hàng','bảo hiểm','chứng khoán','fintech','trading'],
    },
    {
        name: 'Real Estate', color: '#3b82f6', rpm: [6, 16],
        keys: ['real estate','property','realt','bất động sản','nhà đất','housing','apartment','land'],
    },
    {
        name: 'Tech/Business', color: '#8b5cf6', rpm: [5, 12],
        keys: ['technology','software','tech','it service','computer','digital','marketing','business','entrepreneur','startup','saas','ecommerce','e-commerce','kinh doanh','khởi nghiệp','công nghệ','thương mại'],
    },
    {
        name: 'Health', color: '#f59e0b', rpm: [3, 8],
        keys: ['health','medical','doctor','hospital','clinic','dental','pharmacy','wellness','fitness','nutrition','diet','y tế','sức khỏe','bệnh viện','phòng khám','spa','beauty'],
    },
    {
        name: 'Education', color: '#06b6d4', rpm: [2, 5],
        keys: ['education','school','university','college','tutor','learning','course','training','giáo dục','trường','đại học','học viện'],
    },
    {
        name: 'News/Media', color: '#64748b', rpm: [1.5, 4],
        keys: ['news','media','press','journalism','báo','tin tức','truyền thông','thời sự','tạp chí'],
    },
    {
        name: 'Food', color: '#84cc16', rpm: [1, 3],
        keys: ['food','restaurant','recipe','cooking','cafe','ẩm thực','quán','nhà hàng','đồ ăn','nấu ăn','coffee','bakery'],
    },
    {
        name: 'Entertainment', color: '#ec4899', rpm: [1, 2.5],
        keys: ['entertainment','music','movie','film','celebrity','artist','actor','singer','giải trí','âm nhạc','phim','ca sĩ','nghệ sĩ','gaming','game','sport','thể thao'],
    },
    {
        name: 'Comedy/Meme', color: '#f97316', rpm: [0.5, 1.5],
        keys: ['comedy','funny','meme','humor','joke','hài','vui','cười'],
    },
    {
        name: 'General', color: '#475569', rpm: [1, 3],
        keys: [],
    },
];

// RPM benchmarks trên là US-based. Nhân với mult theo thị trường thực tế.
const MARKETS = [
    { label: '🌏 SEA / Việt Nam',      value: 'sea',   mult: 0.06 },
    { label: '🇺🇸 US / Global',        value: 'us',    mult: 1.00 },
    { label: '🌍 Western Europe',      value: 'eu',    mult: 0.50 },
    { label: '🇧🇷 LatAm / Brazil',     value: 'latam', mult: 0.15 },
    { label: '🇮🇳 India / South Asia', value: 'india', mult: 0.08 },
];

function detectNiche(page) {
    const hay = [
        page.name || '',
        page.category || '',
        (page.category_list || []).map(c => c.name).join(' '),
        page.about || '',
    ].join(' ').toLowerCase();

    for (const niche of NICHES.slice(0, -1)) {
        if (niche.keys.some(k => hay.includes(k))) return niche;
    }
    return NICHES[NICHES.length - 1];
}

// ── RPM formula ───────────────────────────────────────────

function estimateRPM(page, posts, marketMult = 1) {
    const fans    = page.fan_count || page.followers_count || 0;
    const talking = page.talking_about_count || 0;

    if (fans < 10000) return { eligible: false, min: 0, max: 0, niche: NICHES[NICHES.length - 1] };

    const niche = detectNiche(page);

    // Engagement multiplier: 1% talking/fans = baseline 1x (thực tế page lớn thường 0.5–1%)
    const engRate = fans > 0 ? talking / fans : 0;
    const engMult = Math.min(2.0, Math.max(0.4, engRate / 0.01));

    // Video ratio từ attachments (type field đã deprecated trong Graph API v3.3+)
    const videoPosts = posts.filter(p => {
        const att = p.attachments?.data?.[0];
        if (!att) return false;
        const t = (att.type || att.media_type || '').toLowerCase();
        return t.includes('video');
    }).length;
    const videoRatio = posts.length > 0 ? videoPosts / posts.length : 0;
    const videoMult  = videoRatio >= 0.5 ? 1.5 : videoRatio >= 0.2 ? 1.0 : 0.7;

    // Post frequency
    let postsPerWeek = null;
    if (posts.length >= 2) {
        const oldest = new Date(posts[posts.length - 1].created_time);
        const newest = new Date(posts[0].created_time);
        const diffMs = newest - oldest;
        const weeks  = diffMs < 3 * 86400000
            ? (posts.length / Math.max(diffMs / 86400000, 0.5)) * 7 / 7
            : Math.max(1, diffMs / (7 * 86400000));
        postsPerWeek = diffMs < 3 * 86400000
            ? (posts.length / Math.max(diffMs / 86400000, 0.5)) * 7
            : posts.length / weeks;
    } else if (posts.length === 1) {
        postsPerWeek = 1;
    }

    // RPM áp dụng market multiplier
    const rpmMin = niche.rpm[0] * engMult * videoMult * marketMult;
    const rpmMax = niche.rpm[1] * engMult * videoMult * marketMult;

    // Organic reach thực tế hiện tại ~1.5% (đã giảm từ 3% trước đây)
    const postsPerMonth = (postsPerWeek || 4) * 4.3;
    const monthlyViews  = fans * 0.015 * postsPerMonth;
    const monthlyMin    = (monthlyViews / 1000) * rpmMin;
    const monthlyMax    = (monthlyViews / 1000) * rpmMax;

    // Avg engagement — null khi không load được posts (tránh hiển thị 0 sai)
    const avgReactions = posts.length
        ? posts.reduce((s, p) => s + (p.reactions?.summary?.total_count || 0), 0) / posts.length
        : null;
    const avgComments = posts.length
        ? posts.reduce((s, p) => s + (p.comments?.summary?.total_count  || 0), 0) / posts.length
        : null;
    const avgShares = posts.length
        ? posts.reduce((s, p) => s + (p.shares?.count || 0), 0) / posts.length
        : null;

    // Lưu base values (không có market mult) để có thể recalculate khi user override market
    const rpmBaseMin = niche.rpm[0] * engMult * videoMult;
    const rpmBaseMax = niche.rpm[1] * engMult * videoMult;

    return {
        eligible: true, niche,
        engRate, videoRatio, postsPerWeek,
        rpmBaseMin, rpmBaseMax, monthlyViews,
        min: rpmMin, max: rpmMax,
        monthlyMin, monthlyMax,
        avgReactions, avgComments, avgShares,
    };
}

// ── Market detection ──────────────────────────────────────

const SEA_CC   = new Set(['VN','PH','TH','ID','MY','SG','MM','KH','LA','BN']);
const US_CC    = new Set(['US','GB','AU','CA','NZ','IE']);
const EU_CC    = new Set(['DE','FR','IT','ES','NL','SE','NO','DK','FI','PL','BE','AT','CH','PT','CZ','HU','RO','GR']);
const INDIA_CC = new Set(['IN','PK','BD','LK','NP']);
const LATAM_CC = new Set(['BR','MX','AR','CO','CL','PE','VE','EC','UY','BO']);

function locationCodesToMarket(codes) {
    // codes = [{country_code:'VN'}, ...] hoặc string array
    const tally = { sea: 0, us: 0, eu: 0, india: 0, latam: 0 };
    codes.forEach(c => {
        const cc = (typeof c === 'string' ? c : c.country_code || c.name || '').toUpperCase();
        if (SEA_CC.has(cc))   tally.sea++;
        else if (US_CC.has(cc))    tally.us++;
        else if (EU_CC.has(cc))    tally.eu++;
        else if (INDIA_CC.has(cc)) tally.india++;
        else if (LATAM_CC.has(cc)) tally.latam++;
    });
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    if (!total) return null;
    const [best] = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return best[1] / total >= 0.3 ? best[0] : null; // cần ≥30% concentration
}

function detectMarketFromText(text) {
    if (!text || text.replace(/\s/g, '').length < 80) return null;
    const viChars = (text.match(/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi) || []).length;
    if (viChars / text.replace(/\s/g, '').length > 0.04) return 'sea';
    return null;
}

function detectMarketFromPosts(posts) {
    return detectMarketFromText(posts.map(p => p.message || p.story || '').join(' '));
}

async function fetchPageAds(pageId, token) {
    // ad_reached_countries là param bắt buộc của Ad Library API
    // target_locations không public — dùng ad creative text để detect ngôn ngữ
    try {
        const cc  = encodeURIComponent(JSON.stringify(['US','VN','GB','AU','IN','BR','DE','TH','PH','ID','SG','MY']));
        const url = `${GRAPH}/ads_archive?search_page_ids=${encodeURIComponent(pageId)}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=${cc}&fields=ad_creative_bodies&limit=15&access_token=${encodeURIComponent(token)}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.error || !data.data?.length) return null;
        const texts = data.data.flatMap(ad => ad.ad_creative_bodies || []);
        return texts.length ? texts.join(' ') : null;
    } catch { return null; }
}

// ── API helpers ───────────────────────────────────────────

function parsePageId(raw) {
    const s = raw.trim();
    if (!s) return null;
    const pid = s.match(/[?&]id=(\d+)/);
    if (pid) return pid[1];
    const url = s.match(/(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([^/?#\s]+)/i);
    if (url) {
        const seg = url[1];
        if (['groups','events','watch','marketplace','gaming'].includes(seg)) return null;
        return seg;
    }
    if (s.startsWith('@')) return s.slice(1);
    return s;
}

async function loadManagedTokens(userToken) {
    try {
        const res  = await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`);
        const data = await res.json();
        if (data.error) return {};
        const map = {};
        (data.data || []).forEach(p => { map[p.id] = p.access_token; });
        return map;
    } catch { return {}; }
}

async function fetchPageInfo(pageId, token) {
    const fields = 'id,name,fan_count,followers_count,talking_about_count,category,category_list,is_verified,link';
    const res    = await fetch(`${GRAPH}/${encodeURIComponent(pageId)}?fields=${fields}&access_token=${encodeURIComponent(token)}`);
    return res.json();
}

async function fetchPosts(pageId, token) {
    // Dùng y chang fields của popup.js — đã được confirm hoạt động
    const FULL = 'id,message,story,created_time,shares,reactions.summary(true),comments.summary(true),attachments{type,media_type},permalink_url';
    const MIN  = 'id,message,story,created_time,shares,attachments{type,media_type},permalink_url';
    const attempts = [
        { ep: 'feed',  fields: FULL },
        { ep: 'posts', fields: FULL },
        { ep: 'feed',  fields: MIN  },
        { ep: 'posts', fields: MIN  },
    ];

    let best = { posts: [], source: null };

    for (const { ep, fields } of attempts) {
        try {
            const url  = `${GRAPH}/${encodeURIComponent(pageId)}/${ep}?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`;
            const res  = await fetch(url);
            const data = await res.json();
            if (data.error) continue;
            const list = data.data || [];
            if (list.length > best.posts.length) best = { posts: list, source: ep };
            if (list.length > 0) return best;
        } catch {}
    }
    return best;
}

// ── Table ─────────────────────────────────────────────────

let _rows    = [];
let _market  = null;
let _sortCol = 'rpmMin';
let _sortDir = 'desc';

function renderTable() {
    const sorted = [..._rows].sort((a, b) => {
        const av = a[_sortCol] ?? -1;
        const bv = b[_sortCol] ?? -1;
        if (typeof av === 'string') return _sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return _sortDir === 'asc' ? av - bv : bv - av;
    });

    const body = document.getElementById('scannerBody');
    body.innerHTML = '';

    // Inline market override — event delegation tránh memory leak khi re-render
    body.addEventListener('change', e => {
        const sel = e.target.closest('.sc-market-inline');
        if (!sel) return;
        const pid = sel.dataset.pid;
        const row = _rows.find(r => r.pageId === pid);
        if (!row || !row.eligible) return;
        const m = MARKETS.find(x => x.value === sel.value) || _market;
        row.market    = m;
        row.marketSrc = 'manual';
        row.min        = row.rpmBaseMin * m.mult;
        row.max        = row.rpmBaseMax * m.mult;
        row.monthlyMin = (row.monthlyViews / 1000) * row.min;
        row.monthlyMax = (row.monthlyViews / 1000) * row.max;
        renderTable();
    }, { once: true }); // once: true vì renderTable() gắn lại listener mới mỗi lần

    sorted.forEach((row, i) => {
        const tr = document.createElement('tr');
        if (!row.eligible) tr.className = 'sc-row-ineligible';
        if (row.error)     tr.className = 'sc-row-error';

        const engClass = row.engRate > 0.05 ? 'eng-hi' : row.engRate > 0.02 ? 'eng-mid' : 'eng-lo';
        const nc       = row.niche?.color || '#475569';
        const rpmStr   = row.eligible
            ? `<strong>${fmtUSD(row.min, row.max)}</strong>`
            : `<span class="sc-badge-no">< 10K fans</span>`;
        const moStr    = row.eligible && row.monthlyMin > 0
            ? `$${fmtN(row.monthlyMin)}–$${fmtN(row.monthlyMax)}`
            : '—';

        tr.innerHTML = `
            <td class="rank">${i + 1}</td>
            <td>
              ${row.error
                ? `<span class="sc-error-name">⚠ ${esc(row.name)}</span><div class="sc-sub">${esc(row.error)}</div>`
                : `<a href="https://facebook.com/${esc(row.pageId)}" target="_blank" class="sc-page-name">
                     ${row.verified ? '<span class="sc-verified">✓</span>' : ''}${esc(row.name)}
                   </a>
                   <div class="sc-sub">${esc(row.pageId)}</div>`}
            </td>
            <td class="num">${fmtN(row.followers)}</td>
            <td class="num">${fmtN(row.talking)}</td>
            <td class="num ${engClass}">${row.engRate != null ? fmtPct(row.engRate) : '—'}</td>
            <td class="num">${row.videoRatio != null ? fmtPct(row.videoRatio) : '—'}</td>
            <td class="num">${
                row.postsPerWeek != null
                    ? row.postsPerWeek.toFixed(1)
                    : row.postsLoaded === 0
                        ? '<span class="sc-no-posts" title="Không đọc được posts của page này">n/a</span>'
                        : '—'
            }</td>
            <td>
              <span class="sc-niche" style="background:${nc}18;color:${nc};border-color:${nc}35">${row.niche?.name || '—'}</span>
              <select class="sc-market-inline sc-market-src-${row.marketSrc || 'default'}" data-pid="${esc(row.pageId)}"
                title="${row.marketSrc === 'ads' ? '✓ Phát hiện từ ads' : row.marketSrc === 'lang' ? '✓ Phát hiện từ ngôn ngữ bài' : 'Mặc định — chọn để override'}">
                ${MARKETS.map(m => `<option value="${m.value}"${row.market?.value === m.value ? ' selected' : ''}>${m.label.split('(')[0].trim()}</option>`).join('')}
              </select>
            </td>
            <td class="num">${rpmStr}</td>
            <td class="num sc-monthly">${moStr}</td>
        `;
        body.appendChild(tr);
    });

    const eligible = _rows.filter(r => r.eligible).length;
    document.getElementById('resultSummary').textContent =
        `${_rows.length} page · ${eligible} eligible · ${_rows.length - eligible} chưa đủ điều kiện`;
}

function setupSort() {
    document.querySelectorAll('#scannerTable th[data-col]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (_sortCol === col) _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
            else { _sortCol = col; _sortDir = 'desc'; }
            document.querySelectorAll('#scannerTable th').forEach(t => {
                t.textContent = t.textContent.replace(' ▼','').replace(' ▲','');
            });
            th.textContent += _sortDir === 'desc' ? ' ▼' : ' ▲';
            renderTable();
        });
    });
}

// ── Export ────────────────────────────────────────────────

function exportCSV() {
    const q   = s => `"${String(s ?? '').replace(/"/g,'""')}"`;
    const mkt = _market?.label || '';
    let csv   = `﻿Page,ID,Followers,7-day Talking,Eng Rate %,Video %,Posts/week,Niche,Market,RPM Min,RPM Max,Monthly Min ($),Monthly Max ($),Avg Reactions,Avg Comments,Avg Shares\n`;
    _rows.forEach(r => {
        csv += [
            r.name, r.pageId, r.followers, r.talking,
            r.engRate    != null ? (r.engRate    * 100).toFixed(2) : '',
            r.videoRatio != null ? (r.videoRatio * 100).toFixed(1) : '',
            r.postsPerWeek != null ? r.postsPerWeek.toFixed(1) : '',
            r.niche?.name || '',
            mkt,
            r.eligible ? r.min.toFixed(2)         : 0,
            r.eligible ? r.max.toFixed(2)         : 0,
            r.eligible ? Math.round(r.monthlyMin) : 0,
            r.eligible ? Math.round(r.monthlyMax) : 0,
            r.avgReactions != null ? r.avgReactions.toFixed(1) : '',
            r.avgComments  != null ? r.avgComments.toFixed(1)  : '',
            r.avgShares    != null ? r.avgShares.toFixed(1)    : '',
        ].map(q).join(',') + '\n';
    });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `rpm_scan_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// ── Init ──────────────────────────────────────────────────

async function init() {
    const data  = await new Promise(r => chrome.storage.local.get(['savedToken','savedPageIds'], r));
    const token = (data.savedToken || '').trim();

    if (!token) {
        document.querySelector('.sc-main').innerHTML =
            `<div class="loading">❌ Chưa có token. Quay lại extension để nhập token.</div>`;
        return;
    }

    if (data.savedPageIds) document.getElementById('pageInput').value = data.savedPageIds;

    setupSort();
    document.getElementById('btnExport').addEventListener('click', exportCSV);

    document.getElementById('btnScan').addEventListener('click', async () => {
        const ids = document.getElementById('pageInput').value
            .split('\n').map(parsePageId).filter(Boolean);

        if (!ids.length) { alert('Nhập ít nhất 1 page ID!'); return; }

        _rows = [];
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('scanProgress').style.display   = 'block';
        document.getElementById('scannerBody').innerHTML        = '';

        const bar    = document.getElementById('scanBar');
        const status = document.getElementById('scanStatus');
        const btn    = document.getElementById('btnScan');
        btn.disabled = true;

        const marketVal = document.getElementById('marketSelect').value;
        _market = MARKETS.find(m => m.value === marketVal) || MARKETS[0];

        status.textContent = 'Đang tải page tokens...';
        const managedTokens = await loadManagedTokens(token);

        for (let i = 0; i < ids.length; i++) {
            const pageId = ids[i];
            status.textContent = `(${i + 1}/${ids.length}) Đang quét ${pageId}...`;
            bar.style.width    = `${((i + 0.5) / ids.length) * 100}%`;

            try {
                // Lấy info trước để resolve username → numeric ID
                const info = await fetchPageInfo(pageId, token);
                if (info.error) {
                    _rows.push({
                        pageId, name: pageId,
                        error: info.error.message,
                        eligible: false,
                        niche: NICHES[NICHES.length - 1],
                    });
                    bar.style.width = `${((i + 1) / ids.length) * 100}%`;
                    continue;
                }

                // Dùng numeric ID (info.id) để lookup managed token — tránh username mismatch
                const numericId = info.id || pageId;
                const pageToken = managedTokens[numericId] || token;

                // Fetch posts + ads song song
                const [{ posts, source: postSource }, adText] = await Promise.all([
                    fetchPosts(numericId, pageToken),
                    fetchPageAds(numericId, token),
                ]);

                // Auto-detect market per page (priority: ads text > post language > fallback)
                let marketSrc = 'default';
                let marketVal = _market.value;
                if (adText) {
                    const detected = detectMarketFromText(adText);
                    if (detected) { marketVal = detected; marketSrc = 'ads'; }
                }
                if (marketSrc === 'default' && posts.length) {
                    const detected = detectMarketFromPosts(posts);
                    if (detected) { marketVal = detected; marketSrc = 'lang'; }
                }
                const pageMarket = MARKETS.find(m => m.value === marketVal) || _market;

                const est = estimateRPM(info, posts, pageMarket.mult);
                _rows.push({
                    pageId,
                    name:        info.name || pageId,
                    followers:   info.followers_count || info.fan_count || 0,
                    talking:     info.talking_about_count || 0,
                    verified:    info.is_verified || false,
                    postsLoaded: posts.length,
                    postSource,
                    market: pageMarket,
                    marketSrc,
                    ...est,
                });
            } catch (err) {
                _rows.push({
                    pageId, name: pageId,
                    error: err.message,
                    eligible: false,
                    niche: NICHES[NICHES.length - 1],
                });
            }

            bar.style.width = `${((i + 1) / ids.length) * 100}%`;
        }

        status.textContent = `Hoàn tất — đã quét ${ids.length} page`;
        document.getElementById('scanProgress').style.display   = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        btn.disabled = false;
        renderTable();
    });
}

init();
