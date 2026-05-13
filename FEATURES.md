# Feature Roadmap — FB Checker

> Cột **Cần** = phải có cái này trước mới làm được. Trống = độc lập, làm được ngay.

---

## TẦNG 1 — DỮ LIỆU (Data Layer)

### 📋 Page Intelligence
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 1.1 | Followers count | Read | — | ✅ Done |
| 1.2 | Tên, mô tả, category, subcategory | Read | — | ⏳ |
| 1.3 | Phone, email, website, địa chỉ, GPS | Read | — | ⏳ |
| 1.4 | Giờ hoạt động, giờ đặc biệt | Read | — | ⏳ |
| 1.5 | Rating trung bình + số đánh giá + từng đánh giá | Read | — | ⏳ |
| 1.6 | Ảnh bìa, ảnh đại diện | Read | — | ⏳ |
| 1.7 | Ngày tạo page, verification status | Read | — | ⏳ |
| 1.8 | Talking about count, check-ins | Read | — | ⏳ |
| 1.9 | Call-to-action button | Read | — | ⏳ |
| 1.10 | Page milestones | Read | — | ⏳ |
| 1.11 | Danh sách admin/editor | Read | Admin token | ⏳ |
| 1.12 | Cập nhật bio, website, giờ hoạt động | Write | Admin token | ⏳ |
| 1.13 | Thay ảnh đại diện, ảnh bìa | Write | Admin token | ⏳ |
| 1.14 | Invite người follow page | Write | Admin token | ⏳ |
| 1.15 | Block/unblock user | Write | Admin token | ⏳ |
| 1.16 | Pin/unpin bài đăng | Write | Admin token | ⏳ |

### 📝 Posts & Content
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 2.1 | Toàn bộ bài đăng + engagement | Read | — | ⏳ |
| 2.2 | Breakdown reactions từng bài | Read | 2.1 | ⏳ |
| 2.3 | Visitor posts | Read | — | ⏳ |
| 2.4 | Bài đăng bị ẩn/xóa | Read | Admin token | ⏳ |
| 2.5 | Đăng bài mới (text/ảnh/video/link) | Write | Admin token | ⏳ |
| 2.6 | Lên lịch đăng (scheduled posts) | Write | Admin token | ⏳ |
| 2.7 | Sửa/xóa bài đăng | Write | Admin token + 2.1 | ⏳ |
| 2.8 | Like/unlike bài | Write | 2.1 | ⏳ |
| 2.9 | Đăng comment, reply comment | Write | 2.1 | ⏳ |
| 2.10 | Xóa comment | Write | Admin token + 2.1 | ⏳ |
| 2.11 | Boost post thành quảng cáo | Write | Business token + 2.1 | ⏳ |

### 🎥 Video & Live
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 3.1 | Danh sách video, lượt xem, thời lượng | Read | — | ⏳ |
| 3.2 | Lịch sử livestream + peak viewers | Read | — | ⏳ |
| 3.3 | Watch time, retention rate | Read | Admin token | ⏳ |
| 3.4 | Upload video lên page | Write | Admin token | ⏳ |
| 3.5 | Tạo/bắt đầu livestream | Write | Admin token | ⏳ |
| 3.6 | Thêm caption/thumbnail | Write | Admin token + 3.1 | ⏳ |
| 3.7 | Xóa video | Write | Admin token + 3.1 | ⏳ |

### 🖼 Photos & Albums
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 4.1 | Toàn bộ album + ảnh + engagement | Read | — | ⏳ |
| 4.2 | Upload ảnh lên page | Write | Admin token | ⏳ |
| 4.3 | Tạo album mới | Write | Admin token | ⏳ |
| 4.4 | Xóa ảnh | Write | Admin token + 4.1 | ⏳ |
| 4.5 | Tag người trong ảnh | Write | Admin token + 4.1 | ⏳ |

### 📅 Events
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 5.1 | Danh sách event, attending/interested count | Read | — | ⏳ |
| 5.2 | Danh sách người attending | Read | Admin token | ⏳ |
| 5.3 | Tạo event mới | Write | Admin token | ⏳ |
| 5.4 | Cập nhật/xóa event | Write | Admin token + 5.1 | ⏳ |
| 5.5 | Invite người tham dự | Write | Admin token + 5.1 | ⏳ |

### 📊 Insights & Analytics
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 6.1 | Reach, Impressions theo ngày/tuần/tháng | Read | Admin token | ⏳ |
| 6.2 | Engagement rate từng bài | Read | Admin token + 2.1 | ⏳ |
| 6.3 | Demographics: tuổi, giới tính, quốc gia | Read | Admin token | ⏳ |
| 6.4 | Giờ followers online nhiều nhất | Read | Admin token | ⏳ |
| 6.5 | Nguồn traffic (organic/paid/viral) | Read | Admin token | ⏳ |
| 6.6 | Page views, unique visitors | Read | Admin token | ⏳ |
| 6.7 | Click vào website, phone, directions | Read | Admin token | ⏳ |
| 6.8 | Negative feedback | Read | Admin token | ⏳ |
| 6.9 | Video completion rate | Read | Admin token + 3.1 | ⏳ |

### 📸 Instagram
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 7.1 | Followers, following, media count | Read | IG connected | ⏳ |
| 7.2 | Toàn bộ posts, reels, stories | Read | IG connected | ⏳ |
| 7.3 | Engagement từng post | Read | IG connected | ⏳ |
| 7.4 | Hashtag performance | Read | IG connected | ⏳ |
| 7.5 | Reach, impressions, profile visits | Read | IG Admin token | ⏳ |
| 7.6 | Audience demographics | Read | IG Admin token | ⏳ |
| 7.7 | Đăng post (ảnh/video/carousel) | Write | IG Admin token | ⏳ |
| 7.8 | Đăng Reels | Write | IG Admin token | ⏳ |
| 7.9 | Đăng Story | Write | IG Admin token | ⏳ |
| 7.10 | Reply/xóa comment | Write | IG Admin token + 7.2 | ⏳ |
| 7.11 | Tag sản phẩm trong post | Write | IG Admin token + 10.3 | ⏳ |
| 7.12 | Schedule post IG | Write | IG Admin token | ⏳ |

### 💬 Messenger
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 8.1 | Response rate, response time | Read | Admin token | ⏳ |
| 8.2 | Conversation volume theo ngày | Read | Admin token | ⏳ |
| 8.3 | Leads từ Messenger | Read | Admin token | ⏳ |
| 8.4 | Gửi tin nhắn cho user | Write | Admin token | ⏳ |
| 8.5 | Tạo message template | Write | Admin token | ⏳ |
| 8.6 | Setup auto-reply | Write | Admin token + A.6 | ⏳ |
| 8.7 | Gửi quick replies, buttons | Write | Admin token + 8.4 | ⏳ |

### 💰 Ads & Business
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 9.1 | Toàn bộ campaigns, ad sets, ads | Read | Business token | ⏳ |
| 9.2 | CPM, CPC, CTR, ROAS | Read | Business token + 9.1 | ⏳ |
| 9.3 | Custom audiences, lookalike | Read | Business token | ⏳ |
| 9.4 | Attribution reports | Read | Business token + 9.1 | ⏳ |
| 9.5 | Tạo campaign mới | Write | Business token | ⏳ |
| 9.6 | Tạo ad set, ad | Write | Business token + 9.5 | ⏳ |
| 9.7 | Pause/resume campaign | Write | Business token + 9.1 | ⏳ |
| 9.8 | Thay đổi budget | Write | Business token + 9.1 | ⏳ |
| 9.9 | Duplicate campaign | Write | Business token + 9.1 | ⏳ |
| 9.10 | Tạo custom audience | Write | Business token | ⏳ |
| 9.11 | Tạo lookalike audience | Write | Business token + 9.10 | ⏳ |

### 🏪 Shop & Commerce
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 10.1 | Product catalog, orders | Read | Business token | ⏳ |
| 10.2 | Revenue, conversion rate | Read | Business token + 10.1 | ⏳ |
| 10.3 | Thêm/sửa/xóa sản phẩm | Write | Business token | ⏳ |
| 10.4 | Cập nhật giá, inventory | Write | Business token + 10.3 | ⏳ |
| 10.5 | Xử lý đơn hàng | Write | Business token + 10.1 | ⏳ |

### 📋 Lead Generation
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 11.1 | Leads collected, form conversion rate | Read | Admin token | ⏳ |
| 11.2 | Tạo lead form mới | Write | Admin token | ⏳ |
| 11.3 | Auto-export leads về Google Sheets / CRM | Write | 11.1 + A.6 | ⏳ |

### 👥 Groups
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 12.1 | Members, posts, insights | Read | — | ⏳ |
| 12.2 | Đăng bài vào group | Write | Admin token | ⏳ |
| 12.3 | Approve/reject member requests | Write | Admin token | ⏳ |
| 12.4 | Remove thành viên | Write | Admin token | ⏳ |

### 📱 WhatsApp Business
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 13.1 | Message templates, analytics | Read | WA connected | ⏳ |
| 13.2 | Gửi tin nhắn hàng loạt | Write | WA connected | ⏳ |
| 13.3 | Tạo/xóa message template | Write | WA connected | ⏳ |
| 13.4 | Setup chatbot flow | Write | WA connected + A.6 | ⏳ |

### 🔍 Ad Library
| # | Tính năng | Loại | Cần | Trạng thái |
|---|-----------|------|-----|------------|
| 14.1 | Quảng cáo đang chạy của bất kỳ page | Read | — | ⏳ |
| 14.2 | Lịch sử quảng cáo | Read | — | ⏳ |
| 14.3 | Chi phí ước tính, targeting ước tính | Read | — | ⏳ |

---

## TẦNG 2 — TỰ ĐỘNG HÓA (Automation Layer)

| # | Tính năng | Cần | Trạng thái |
|---|-----------|-----|------------|
| A.1 | Auto-post theo lịch hàng loạt nhiều page | 2.5 + 2.6 | ⏳ |
| A.2 | Auto-reply comment/inbox theo rule | 2.9 hoặc 8.4 | ⏳ |
| A.3 | Auto-moderate — xóa comment từ khóa xấu | 2.10 | ⏳ |
| A.4 | Cross-post — đăng 1 lần lên nhiều page/IG | 2.5 + 7.7 | ⏳ |
| A.5 | Auto-boost — tự boost bài khi đạt ngưỡng | 2.11 + 9.5 | ⏳ |
| A.6 | Webhook — real-time khi có comment/message | — | ⏳ |
| A.7 | Auto-export leads về Google Sheets / CRM | 11.1 | ⏳ |
| A.8 | Trigger chain — khi A xảy ra tự động làm B | A.6 | ⏳ |

---

## TẦNG 3 — PHÂN TÍCH & THÔNG MINH (Intelligence Layer)

| # | Tính năng | Cần | Trạng thái |
|---|-----------|-----|------------|
| I.1 | Sentiment analysis — phân tích cảm xúc comment | 2.1 | ⏳ |
| I.2 | Competitor benchmarking | 1.1 + 2.1 | ⏳ |
| I.3 | Best time to post | 6.4 | ⏳ |
| I.4 | Content scoring — dự đoán bài nào viral | 2.1 + 6.2 | ⏳ |
| I.5 | Audience overlap giữa các page | 1.1 (nhiều page) | ⏳ |
| I.6 | Trend detection | 2.1 + Pha 3 (snapshot) | ⏳ |
| I.7 | Ad fatigue detection | 9.1 + 9.2 | ⏳ |
| I.8 | Attribution modeling | 9.2 + 2.1 | ⏳ |

---

## TẦNG 4 — AI (AI Layer)

| # | Tính năng | Cần | Trạng thái |
|---|-----------|-----|------------|
| AI.1 | AI viết caption từ top-performing posts | 2.1 | ⏳ |
| AI.2 | AI trả lời inbox tự động | 8.1 + 8.4 | ⏳ |
| AI.3 | AI tạo ảnh quảng cáo từ brief | — | ⏳ |
| AI.4 | AI phân tích đối thủ + đề xuất chiến lược | I.2 | ⏳ |
| AI.5 | AI tóm tắt hàng nghìn comment thành insight | 2.1 | ⏳ |
| AI.6 | AI dự đoán followers tháng tới | Pha 3 (historical data) | ⏳ |
| AI.7 | AI gợi ý ngân sách ads tối ưu | 9.1 + 9.2 | ⏳ |

---

## TẦNG 5 — SẢN PHẨM (Product Layer)

| # | Sản phẩm | Cần | Trạng thái |
|---|----------|-----|------------|
| P.1 | Social Media Management Tool | A.1 + A.2 + 2.5 + 7.7 | ⏳ |
| P.2 | Analytics Platform | Pha 3 + Pha 4 + Tầng 3 | ⏳ |
| P.3 | Ad Management Platform | Tầng 9 đầy đủ | ⏳ |
| P.4 | CRM tích hợp Facebook | 11.3 | ⏳ |
| P.5 | E-commerce Dashboard | Tầng 10 đầy đủ | ⏳ |
| P.6 | Agency White-label Tool | Pha 1–7 hoàn chỉnh | ⏳ |
| P.7 | Influencer Platform | 7.1–7.6 + I.2 | ⏳ |
| P.8 | Customer Service Platform | Tầng 8 đầy đủ | ⏳ |
| P.9 | Content Calendar | 2.6 + A.4 | ⏳ |
| P.10 | Report Generator | Pha 3 + Pha 4 | ⏳ |

---

## TẦNG 6 — KINH DOANH (Business Layer)

| # | Hướng monetize | Cần | Trạng thái |
|---|----------------|-----|------------|
| B.1 | Free tier — check followers cơ bản | — | ✅ Done |
| B.2 | Pro tier — history, charts, alerts, auto-fetch | Pha 1–7 | ⏳ |
| B.3 | Agency tier — white-label, báo cáo PDF | B.2 + P.6 | ⏳ |
| B.4 | API resell — bán data insights | Tầng 3 | ⏳ |
| B.5 | Marketplace — user share template/automation | A.8 | ⏳ |
