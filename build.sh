#!/bin/bash
# Đóng gói extension để upload lên Chrome Web Store

OUTPUT="fb-checker.zip"

# Xóa file zip cũ nếu có
rm -f "$OUTPUT"

# Tạo zip chỉ bao gồm các file cần thiết
zip -r "$OUTPUT" \
  manifest.json \
  popup.html \
  popup.js \
  style.css \
  background.js \
  -x "*.DS_Store" "*.git*"

echo "✅ Đã tạo: $OUTPUT ($(du -sh $OUTPUT | cut -f1))"
echo "👉 Upload file này lên: https://chrome.google.com/webstore/devconsole"
