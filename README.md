# FB Page Follower Checker

Chrome Extension kiểm tra số Followers của nhiều Facebook Page cùng lúc. Chạy trong Side Panel, tự động lấy token từ session Facebook đang đăng nhập — không cần tài khoản Developer Facebook.

---

## Cài đặt local (để dev / test)

1. Mở Chrome → vào `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Bấm **Load unpacked** → chọn thư mục này
4. Click icon extension trên thanh toolbar → Side Panel mở ra

---

## Đóng gói & Upload lên Chrome Web Store

### Bước 1 — Tạo file ZIP

Chạy lệnh sau trong thư mục này:

```bash
bash build.sh
```

File `fb-checker.zip` sẽ được tạo ra, sẵn sàng để upload.

> Không dùng "Compress" của macOS hay zip thông thường vì sẽ bao gồm file thừa (`.git`, `.DS_Store`...).

### Bước 2 — Upload lên Chrome Web Store

1. Vào **[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)**
2. Đăng nhập bằng Google account → trả phí **$5** (1 lần duy nhất) nếu chưa có developer account
3. Bấm **"New item"** → Upload file `fb-checker.zip`
4. Điền thông tin store listing:
   - **Name**: FB Page Follower Checker
   - **Description**: (xem gợi ý bên dưới)
   - **Screenshots**: chụp giao diện extension (1280×800 hoặc 640×400)
   - **Category**: Productivity
   - **Privacy Policy**: bắt buộc vì extension đọc token (xem gợi ý bên dưới)
5. Bấm **Submit for review** → Google duyệt trong 3–7 ngày

---

## Gợi ý mô tả (Store Description)

```
Kiểm tra số Followers của hàng loạt Facebook Page chỉ trong vài giây.

Tính năng:
• Tự động lấy Access Token từ session Facebook đang đăng nhập
• Fetch dữ liệu hàng loạt (batch API), xử lý nhanh
• Hiển thị trong Side Panel — không mất dữ liệu khi chuyển tab
• Sắp xếp theo Followers, giữ thứ tự gốc mặc định
• Xuất CSV chuẩn UTF-8 dùng được trên Excel

Không cần tài khoản Facebook Developer.
```

---

## Gợi ý Privacy Policy

Tạo 1 trang web đơn giản (hoặc Google Doc public) với nội dung:

```
Privacy Policy — FB Page Follower Checker

Extension này truy cập Facebook Access Token từ session trình duyệt
của người dùng để gọi Facebook Graph API lấy thông tin public của Pages.

- Token chỉ được dùng trong phiên làm việc, không lưu lên server
- Không thu thập hay chia sẻ dữ liệu cá nhân với bên thứ ba
- Mọi dữ liệu chỉ lưu cục bộ trên máy người dùng (chrome.storage.local)
```

---

## Roadmap

| Pha | Tính năng | Trạng thái |
|-----|-----------|------------|
| 1 | Tab navigation trong Side Panel | ⏳ Chờ |
| 2 | Quản lý nhiều nhóm Page (Groups) | ⏳ Chờ |
| 3 | Lưu snapshot + lịch sử tăng trưởng | ⏳ Chờ |
| 4 | Biểu đồ Chart.js trên full tab | ⏳ Chờ |
| 5 | Auto-fetch theo lịch (chrome.alarms) | ⏳ Chờ |
| 6 | Cảnh báo ngưỡng + thông báo desktop | ⏳ Chờ |
| 7 | Xuất báo cáo HTML + Google Sheets | ⏳ Chờ |
