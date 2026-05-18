# FB Tools — Chrome Extension

Bộ công cụ quản lý Facebook Page chạy trực tiếp trên trình duyệt, không cần server hay tài khoản developer.

## Tính năng

### 📊 Followers Checker
Xem số followers của nhiều page cùng lúc.
- Nhập danh sách page (ID, URL hoặc username)
- Fetch song song theo batch, hiển thị kết quả inline
- Sắp xếp theo followers, xuất CSV

### 🗑 Xóa bài viết (Post Manager)
Lọc và xóa hàng loạt bài viết trên page.
- Lọc theo khoảng thời gian, loại bài (ảnh / video / link / text)
- Chọn từng bài hoặc chọn tất cả theo trang
- Xóa có xác nhận, hiển thị tiến trình từng bài
- **Page không phải admin**: hiển thị read-only + xuất CSV thay vì xóa

### 📈 Phân tích Content
Dashboard phân tích toàn bộ bài viết trên page.
- Tổng quan: số bài, avg reactions/comments/shares, engagement rate
- Biểu đồ: bài viết theo tuần, theo giờ, theo ngày trong tuần
- Phân loại nội dung (ảnh/video/link/text)
- Top 10 bài engagement cao nhất / thấp nhất

### ✍️ Đăng bài (Poster)
Đăng bài lên nhiều page cùng lúc.
- Chọn page từ danh sách page đang admin
- Mỗi bài có caption riêng + ảnh riêng (kéo thả)
- **Bulk upload**: thả nhiều ảnh cùng lúc → tự tạo 1 bài/ảnh
- Đính kèm nhiều ảnh vào 1 bài (multi-image)
- **Lên lịch**: chọn giờ đăng, khoảng cách giữa các bài (giờ/ngày/tuần)
- Preview danh sách thời gian đăng trước khi confirm
- Kết quả theo từng bài × từng page

### 💰 RPM Scanner
Ước tính RPM và phân tích niche từ bất kỳ public page nào.
- Không cần là admin của page
- Fetch: fan_count, talking_about_count, category, bài viết gần nhất
- **Phát hiện thị trường tự động per page** (theo priority):
  1. Ngôn ngữ từ ads đang/đã chạy (Ad Library API)
  2. Ngôn ngữ từ bài viết
  3. Fallback về dropdown mặc định
- Override thị trường thủ công từng page inline sau khi quét
- Ước tính RPM theo niche × engagement multiplier × video multiplier × market multiplier
- Organic reach thực tế: 1.5% | engRate baseline: 1%
- Sortable table, xuất CSV

**Niche RPM range (US baseline):**

| Niche | RPM |
|-------|-----|
| Finance | $8–18 |
| Real Estate | $6–16 |
| Tech/Business | $5–12 |
| Health | $3–8 |
| Education | $2–5 |
| News/Media | $1.5–4 |
| Food | $1–3 |
| Entertainment | $1–2.5 |
| Comedy/Meme | $0.5–1.5 |

**Market multiplier:**

| Thị trường | Multiplier |
|-----------|-----------|
| US / Global | ×1.0 |
| Western Europe | ×0.5 |
| LatAm / Brazil | ×0.15 |
| India / South Asia | ×0.08 |
| SEA / Việt Nam | ×0.06 |

## Cách dùng

1. Cài extension vào Chrome (Load unpacked)
2. Mở Side Panel
3. Nhập Access Token (bấm **Tự lấy** hoặc paste thủ công)
4. Nhập danh sách page — hỗ trợ các format:
   ```
   123456789
   https://www.facebook.com/pagename
   fb.com/pagename
   @pagename
   pagename
   ```
5. Chọn công cụ muốn dùng

## Lấy Access Token

Bấm **Tự lấy** trong extension — sẽ tự lấy token từ adsmanager.facebook.com nếu đang đăng nhập Facebook.

Nếu không tự lấy được: vào [adsmanager.facebook.com](https://adsmanager.facebook.com), mở DevTools → Network → tìm request có `access_token=EAAB...` trong URL.

## Lưu ý về quyền xóa bài

- Bài do **user đăng lên page** → xóa được bằng User Token (EAAB)
- Bài do **page đăng** → cần Page Access Token (lấy qua nút "Lấy Page Token tự động" trong tool Xóa bài)

## Files

```
manifest.json       — MV3 config
background.js       — Service worker, passive token capture
popup.html/js       — Side panel UI (tool launcher)
style.css           — Popup styles
analysis.html/js    — Content Analysis dashboard
analysis.css        — Shared dashboard styles (dùng cho analysis, manager, poster, scanner)
manager.html/js     — Post Manager (xóa bài / xuất bài)
poster.html/js      — Poster (đăng bài lên nhiều page)
scanner.html/js     — RPM Scanner
icons/              — Extension icons
```
