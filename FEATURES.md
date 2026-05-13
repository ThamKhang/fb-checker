# Feature Roadmap — FB Checker

---

## TẦNG 1 — DỮ LIỆU (Data Layer)

### 📋 Page Intelligence
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 1.1 | Followers count | Read | ✅ Done |
| 1.2 | Tên, mô tả, category, subcategory | Read | ⏳ |
| 1.3 | Phone, email, website, địa chỉ, GPS | Read | ⏳ |
| 1.4 | Giờ hoạt động, giờ đặc biệt | Read | ⏳ |
| 1.5 | Rating trung bình + số đánh giá + từng đánh giá | Read | ⏳ |
| 1.6 | Ảnh bìa, ảnh đại diện | Read | ⏳ |
| 1.7 | Ngày tạo page, verification status | Read | ⏳ |
| 1.8 | Talking about count, check-ins | Read | ⏳ |
| 1.9 | Call-to-action button | Read | ⏳ |
| 1.10 | Page milestones | Read | ⏳ |
| 1.11 | Danh sách admin/editor | Read | ⏳ |
| 1.12 | Cập nhật bio, website, giờ hoạt động | Write | ⏳ |
| 1.13 | Thay ảnh đại diện, ảnh bìa | Write | ⏳ |
| 1.14 | Invite người follow page | Write | ⏳ |
| 1.15 | Block/unblock user | Write | ⏳ |
| 1.16 | Pin/unpin bài đăng | Write | ⏳ |

### 📝 Posts & Content
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 2.1 | Toàn bộ bài đăng + engagement | Read | ⏳ |
| 2.2 | Breakdown reactions từng bài | Read | ⏳ |
| 2.3 | Visitor posts | Read | ⏳ |
| 2.4 | Bài đăng bị ẩn/xóa (admin) | Read | ⏳ |
| 2.5 | Đăng bài mới (text/ảnh/video/link) | Write | ⏳ |
| 2.6 | Lên lịch đăng (scheduled posts) | Write | ⏳ |
| 2.7 | Sửa/xóa bài đăng | Write | ⏳ |
| 2.8 | Like/unlike bài | Write | ⏳ |
| 2.9 | Đăng comment, reply comment | Write | ⏳ |
| 2.10 | Xóa comment | Write | ⏳ |
| 2.11 | Boost post thành quảng cáo | Write | ⏳ |

### 🎥 Video & Live
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 3.1 | Danh sách video, lượt xem, thời lượng | Read | ⏳ |
| 3.2 | Lịch sử livestream + peak viewers | Read | ⏳ |
| 3.3 | Watch time, retention rate (admin) | Read | ⏳ |
| 3.4 | Upload video lên page | Write | ⏳ |
| 3.5 | Tạo/bắt đầu livestream | Write | ⏳ |
| 3.6 | Thêm caption/thumbnail | Write | ⏳ |
| 3.7 | Xóa video | Write | ⏳ |

### 🖼 Photos & Albums
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 4.1 | Toàn bộ album + ảnh + engagement | Read | ⏳ |
| 4.2 | Upload ảnh lên page | Write | ⏳ |
| 4.3 | Tạo album mới | Write | ⏳ |
| 4.4 | Xóa ảnh | Write | ⏳ |
| 4.5 | Tag người trong ảnh | Write | ⏳ |

### 📅 Events
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 5.1 | Danh sách event, attending/interested count | Read | ⏳ |
| 5.2 | Danh sách người attending (admin) | Read | ⏳ |
| 5.3 | Tạo event mới | Write | ⏳ |
| 5.4 | Cập nhật/xóa event | Write | ⏳ |
| 5.5 | Invite người tham dự | Write | ⏳ |

### 📊 Insights & Analytics *(cần Page Admin Token)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 6.1 | Reach, Impressions theo ngày/tuần/tháng | Read | ⏳ |
| 6.2 | Engagement rate từng bài | Read | ⏳ |
| 6.3 | Demographics: tuổi, giới tính, quốc gia, thành phố | Read | ⏳ |
| 6.4 | Giờ followers online nhiều nhất | Read | ⏳ |
| 6.5 | Nguồn traffic (organic/paid/viral) | Read | ⏳ |
| 6.6 | Page views, unique visitors | Read | ⏳ |
| 6.7 | Click vào website, phone, directions | Read | ⏳ |
| 6.8 | Negative feedback (hide/unlike/spam) | Read | ⏳ |
| 6.9 | Video completion rate | Read | ⏳ |

### 📸 Instagram *(gắn với Facebook Page)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 7.1 | Followers, following, media count | Read | ⏳ |
| 7.2 | Toàn bộ posts, reels, stories | Read | ⏳ |
| 7.3 | Engagement từng post | Read | ⏳ |
| 7.4 | Hashtag performance | Read | ⏳ |
| 7.5 | Reach, impressions, profile visits (admin) | Read | ⏳ |
| 7.6 | Audience demographics (admin) | Read | ⏳ |
| 7.7 | Đăng post (ảnh/video/carousel) | Write | ⏳ |
| 7.8 | Đăng Reels | Write | ⏳ |
| 7.9 | Đăng Story | Write | ⏳ |
| 7.10 | Reply/xóa comment | Write | ⏳ |
| 7.11 | Tag sản phẩm trong post | Write | ⏳ |
| 7.12 | Schedule post IG | Write | ⏳ |

### 💬 Messenger *(cần Page Admin Token)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 8.1 | Response rate, response time | Read | ⏳ |
| 8.2 | Conversation volume theo ngày | Read | ⏳ |
| 8.3 | Leads từ Messenger | Read | ⏳ |
| 8.4 | Gửi tin nhắn cho user | Write | ⏳ |
| 8.5 | Tạo message template | Write | ⏳ |
| 8.6 | Setup auto-reply | Write | ⏳ |
| 8.7 | Gửi quick replies, buttons | Write | ⏳ |

### 💰 Ads & Business *(cần Business Token)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 9.1 | Toàn bộ campaigns, ad sets, ads | Read | ⏳ |
| 9.2 | CPM, CPC, CTR, ROAS | Read | ⏳ |
| 9.3 | Custom audiences, lookalike audiences | Read | ⏳ |
| 9.4 | Attribution reports | Read | ⏳ |
| 9.5 | Tạo campaign mới | Write | ⏳ |
| 9.6 | Tạo ad set, ad | Write | ⏳ |
| 9.7 | Pause/resume campaign | Write | ⏳ |
| 9.8 | Thay đổi budget | Write | ⏳ |
| 9.9 | Duplicate campaign | Write | ⏳ |
| 9.10 | Tạo custom audience | Write | ⏳ |
| 9.11 | Tạo lookalike audience | Write | ⏳ |

### 🏪 Shop & Commerce *(cần Business Token)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 10.1 | Product catalog, orders | Read | ⏳ |
| 10.2 | Revenue, conversion rate | Read | ⏳ |
| 10.3 | Thêm/sửa/xóa sản phẩm | Write | ⏳ |
| 10.4 | Cập nhật giá, inventory | Write | ⏳ |
| 10.5 | Xử lý đơn hàng | Write | ⏳ |

### 📋 Lead Generation
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 11.1 | Leads collected, form conversion rate | Read | ⏳ |
| 11.2 | Tạo lead form mới | Write | ⏳ |
| 11.3 | Auto-export leads về Google Sheets / CRM | Write | ⏳ |

### 👥 Groups
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 12.1 | Members, posts, insights | Read | ⏳ |
| 12.2 | Đăng bài vào group | Write | ⏳ |
| 12.3 | Approve/reject member requests | Write | ⏳ |
| 12.4 | Remove thành viên | Write | ⏳ |

### 📱 WhatsApp Business
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 13.1 | Message templates, analytics | Read | ⏳ |
| 13.2 | Gửi tin nhắn hàng loạt | Write | ⏳ |
| 13.3 | Tạo/xóa message template | Write | ⏳ |
| 13.4 | Setup chatbot flow | Write | ⏳ |

### 🔍 Ad Library *(không cần token)*
| # | Tính năng | Loại | Trạng thái |
|---|-----------|------|------------|
| 14.1 | Tất cả quảng cáo đang chạy của bất kỳ page | Read | ⏳ |
| 14.2 | Lịch sử quảng cáo | Read | ⏳ |
| 14.3 | Chi phí ước tính, targeting ước tính | Read | ⏳ |

---

## TẦNG 2 — TỰ ĐỘNG HÓA (Automation Layer)

| # | Tính năng | Trạng thái |
|---|-----------|------------|
| A.1 | Auto-post theo lịch hàng loạt nhiều page | ⏳ |
| A.2 | Auto-reply comment/inbox theo rule | ⏳ |
| A.3 | Auto-moderate — xóa comment chứa từ khóa xấu | ⏳ |
| A.4 | Cross-post — đăng 1 lần lên nhiều page/group/IG | ⏳ |
| A.5 | Auto-boost — tự boost bài khi đạt ngưỡng engagement | ⏳ |
| A.6 | Webhook — real-time khi có comment/message mới | ⏳ |
| A.7 | Auto-export leads về Google Sheets / CRM | ⏳ |
| A.8 | Trigger chain — khi A xảy ra tự động làm B | ⏳ |

---

## TẦNG 3 — PHÂN TÍCH & THÔNG MINH (Intelligence Layer)

| # | Tính năng | Trạng thái |
|---|-----------|------------|
| I.1 | Sentiment analysis — phân tích cảm xúc comment | ⏳ |
| I.2 | Competitor benchmarking — so sánh với đối thủ | ⏳ |
| I.3 | Best time to post — giờ đăng tối ưu từ data thật | ⏳ |
| I.4 | Content scoring — dự đoán bài nào sẽ viral | ⏳ |
| I.5 | Audience overlap — page nào có tệp khán giả giống nhau | ⏳ |
| I.6 | Trend detection — chủ đề đang hot trong ngành | ⏳ |
| I.7 | Ad fatigue detection — cảnh báo khi quảng cáo mệt | ⏳ |
| I.8 | Attribution modeling — content nào thật sự ra đơn | ⏳ |

---

## TẦNG 4 — AI (AI Layer)

| # | Tính năng | Trạng thái |
|---|-----------|------------|
| AI.1 | AI viết caption dựa trên top-performing posts | ⏳ |
| AI.2 | AI trả lời inbox tự động nhưng tự nhiên | ⏳ |
| AI.3 | AI tạo ảnh quảng cáo từ brief | ⏳ |
| AI.4 | AI phân tích đối thủ và đề xuất chiến lược | ⏳ |
| AI.5 | AI tóm tắt hàng nghìn comment thành insight | ⏳ |
| AI.6 | AI dự đoán followers tháng tới | ⏳ |
| AI.7 | AI gợi ý ngân sách ads tối ưu | ⏳ |

---

## TẦNG 5 — SẢN PHẨM (Product Layer)

| # | Sản phẩm | Trạng thái |
|---|----------|------------|
| P.1 | Social Media Management Tool (như Hootsuite, Buffer) | ⏳ |
| P.2 | Analytics Platform (như Sprout Social) | ⏳ |
| P.3 | Ad Management Platform (như AdEspresso) | ⏳ |
| P.4 | CRM tích hợp Facebook (sync leads về HubSpot/Salesforce) | ⏳ |
| P.5 | E-commerce Dashboard (quản lý shop Facebook/IG) | ⏳ |
| P.6 | Agency White-label Tool | ⏳ |
| P.7 | Influencer Platform (tìm KOL, đo hiệu quả) | ⏳ |
| P.8 | Customer Service Platform (inbox nhiều page tập trung) | ⏳ |
| P.9 | Content Calendar (lên kế hoạch cả tháng) | ⏳ |
| P.10 | Report Generator (tự động xuất PDF cho client) | ⏳ |

---

## TẦNG 6 — KINH DOANH (Business Layer)

| # | Hướng monetize | Trạng thái |
|---|----------------|------------|
| B.1 | Free tier — check followers cơ bản | ✅ Done |
| B.2 | Pro tier — history, charts, alerts, auto-fetch | ⏳ |
| B.3 | Agency tier — nhiều page, white-label, báo cáo | ⏳ |
| B.4 | API resell — bán data insights cho bên thứ 3 | ⏳ |
| B.5 | Marketplace — user share template/automation | ⏳ |
