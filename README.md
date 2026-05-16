# FB Tools — Chrome Extension

Bộ công cụ quản lý Facebook Page chạy trực tiếp trên trình duyệt, không cần server hay tài khoản developer.

## Tính năng

### 📊 Followers Checker
Xem số followers của nhiều page cùng lúc.
- Nhập danh sách page (ID, URL hoặc username)
- Fetch song song theo batch, hiển thị kết quả inline
- Sắp xếp theo followers, xuất CSV

### 🗑 Xóa bài viết
Lọc và xóa hàng loạt bài viết trên page.
- Lọc theo khoảng thời gian, loại bài (ảnh / video / link / text)
- Chọn từng bài hoặc chọn tất cả theo trang
- Xóa có xác nhận, hiển thị tiến trình từng bài
- Hỗ trợ tự động lấy Page Access Token (6 phương pháp)

### 📈 Phân tích Content
Dashboard phân tích toàn bộ bài viết trên page.
- Tổng quan: số bài, avg reactions/comments/shares, engagement rate
- Biểu đồ: bài viết theo tuần, theo giờ, theo ngày trong tuần
- Phân loại nội dung (ảnh/video/link/text)
- Top 10 bài engagement cao nhất / thấp nhất

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
analysis.css        — Dashboard styles
manager.html/js     — Post Manager (xóa bài)
icons/              — Extension icons
```
