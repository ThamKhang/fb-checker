# Project Status

> File này cập nhật sau mỗi phiên làm việc. Đọc file này trước tiên.

---

## Phiên gần nhất: 2026-05-13

### ✅ Đã hoàn thành
- Extension v1.0 hoàn chỉnh, chạy được
- Side Panel (không reset khi đổi tab)
- Tự động lấy EAAB token từ adsmanager.facebook.com
- Batch fetch followers, sort, export CSV
- Fix XSS, bỏ permission thừa, thêm icon
- Push lên GitHub: git@github.com:ThamKhang/fb-checker.git
- FEATURES.md: 6 tầng, 100+ tính năng có thể làm
- Build script: `bash build.sh` → fb-checker.zip

### 🔄 Đang chờ
- Anh upload bản v1.0 lên Chrome Web Store (đã có zip, đã có Developer account)
- Cần: chụp screenshot giao diện để upload lên store listing

### ⚠️ Vấn đề đã biết
- Token EAAB lấy từ adsmanager — user phải đang đăng nhập Facebook
- API v21.0 — cần update khi Facebook ra version mới (check 6 tháng/lần)

### 📋 Việc tiếp theo (theo thứ tự)
1. Anh upload Chrome Web Store xong → báo em
2. Bắt đầu Pha 1: Refactor UI → Tab navigation (Pages / History / Alerts / Settings)
3. Pha 2: Quản lý nhiều nhóm Page (Groups) + IndexedDB
4. Pha 3: Snapshot + lịch sử tăng trưởng
5. Pha 4: Biểu đồ Chart.js
6. Pha 5: Auto-fetch (chrome.alarms)
7. Pha 6: Cảnh báo ngưỡng + desktop notification
8. Pha 7: Xuất báo cáo HTML + Google Sheets

### 🏗 Kiến trúc cần làm khi vào Pha 1
- Chuyển toàn bộ sang module structure
- Thêm IndexedDB layer cho storage
- Side panel tabs: Pages / History / Alerts / Settings
- Full tab riêng cho: Charts, Reports, Compare

---

## Cấu trúc file hiện tại
```
getfollow_extension/
├── manifest.json      — MV3, permissions: tabs + sidePanel
├── background.js      — Mở side panel khi click icon
├── popup.html         — Giao diện chính
├── popup.js           — Logic fetch, sort, export CSV
├── style.css          — Dark theme
├── icons/             — 16, 48, 128px
├── build.sh           — Tạo fb-checker.zip để upload store
├── README.md          — Hướng dẫn cài đặt
├── FEATURES.md        — 100+ tính năng 6 tầng đầy đủ
└── STATUS.md          — File này
```
