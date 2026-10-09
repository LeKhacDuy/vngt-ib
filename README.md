# VNGroup Tourist – English site (vngt-ib)

Website tiếng Anh bán tour inbound cho khách nước ngoài. Là site tĩnh, được build từ API tour
(`https://lekhacduy.io.vn`) – cùng nguồn dữ liệu với vngrouptourist.vn.

## Chạy ở máy

```bash
npm install
npm run build      # tạo dist/
npm run check      # kiểm tra link/ảnh hỏng trong dist/
python3 -m http.server 4000 --directory dist
```

Mở http://localhost:4000. Sửa file nguồn xong phải `npm run build` lại mới thấy.

## Cấu trúc

| Đường dẫn | Là gì |
|---|---|
| `*.html` | Các trang nguồn. `tour-details.html` là khuôn cho trang từng tour |
| `assets/js/tour-utils.js` | Hàm dùng chung: dịch điểm đến/nhãn sang tiếng Anh, giá USD, thẻ tour, định dạng nội dung |
| `assets/js/tour-page.js` | Dựng nội dung trang tour – dùng cả lúc build lẫn trên trình duyệt |
| `assets/js/inquiry.js` | Form liên hệ/đặt tour (mở app email của khách) |
| `assets/css/main.css`, `tailwind.config.js` | CSS; build ra `dist/assets/css/site.css` |
| `assets/img/places/` | Ảnh phong cảnh dùng trên các trang |
| `scripts/build.mjs` | Build: lấy tour từ API, nén ảnh, tạo `/tours/<slug>/`, sitemap, CSS |
| `public/` | File chép thẳng ra gốc site (vd. file xác minh Google Search Console) |
| `deploy/` | Cấu hình nginx mẫu và script build định kỳ |

Tỷ giá quy đổi VND → USD nằm ở `VND_PER_USD` trong `assets/js/tour-utils.js`.

## Biến môi trường khi build

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SITE_URL` | `https://vngrouptourist.com` | Địa chỉ public, dùng cho canonical, sitemap, ảnh chia sẻ |
| `API_BASE` | `https://lekhacduy.io.vn` | API tour |
| `GA_ID` | (trống) | Mã Google Analytics 4. Trống = không gắn analytics |

## Deploy lên VPS

1. DNS: trỏ `vngrouptourist.com` và `www` (bản ghi A) về IP VPS. **Giữ nguyên bản ghi MX** (email Google Workspace).
2. Trên VPS:
   ```bash
   git clone https://github.com/LeKhacDuy/vngt-ib.git /code/vngt-ib
   cd /code/vngt-ib
   printf 'SITE_URL=https://vngrouptourist.com\n' > .env
   ./deploy/rebuild.sh
   ```
3. nginx: chép `deploy/nginx.conf.example`, lấy chứng chỉ SSL bằng certbot (lệnh ở đầu file).
4. Cron build lại mỗi giờ để tour mới/sửa giá tự cập nhật:
   ```
   0 * * * * /code/vngt-ib/deploy/rebuild.sh >> /var/log/vngt-ib-build.log 2>&1
   ```

Tour thêm sau lần build gần nhất vẫn xem được (qua `tour-details.html?id=`, gọi API trực tiếp);
API phải cho phép tên miền của site (biến `CORS_ALLOW_ORIGINS` trong backend – hiện đã có vngrouptourist.com).
