# HotelAI (SeeYAHH!) — Hướng dẫn chạy dự án

Website tìm kiếm, đặt phòng và quản lý khách sạn, có chatbot AI, đăng nhập Email OTP/Google/Facebook, thanh toán thử nghiệm SePay và ZaloPay.

## 1. Công nghệ sử dụng

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Axios, Framer Motion.
- **Backend:** Node.js, Express, Mongoose, JWT.
- **Database:** MongoDB Atlas (`hotel_booking`).
- **Tích hợp:** Gmail SMTP (OTP/email), Google/Facebook Login, OpenAI API, SePay Sandbox, ZaloPay Sandbox, ngrok (webhook local).

## 2. Cấu trúc thư mục

```text
modern-ai-hotel-booking/
├── client/                 # React, giao diện, API client
│   ├── src/pages/          # Các trang website
│   ├── src/components/     # Thành phần giao diện
│   ├── src/api/            # Hàm gọi Backend
│   └── .env                # Cấu hình Frontend
├── server/                 # Node.js/Express
│   ├── src/routes/         # API endpoints
│   ├── src/controllers/    # Xử lý request
│   ├── src/services/       # Nghiệp vụ, AI, thanh toán
│   ├── src/models/         # Mongoose models
│   ├── scripts/            # Seed dữ liệu, embedding
│   └── .env                # Cấu hình bí mật Backend
└── Readme.md
```

## 3. Chuẩn bị

- Cài **Node.js 22 LTS** (hoặc phiên bản đáp ứng Vite đang sử dụng), npm và VS Code.
- Có mạng Internet; được cấp quyền MongoDB Atlas và các thông tin cấu hình nhóm.
- Cài **ngrok** nếu cần thử callback SePay/ZaloPay khi chạy Backend trên máy cá nhân.

## 4. Cài đặt thư viện

Mở terminal tại từng thư mục:

```powershell
cd modern-ai-hotel-booking/server
npm ci
```

```powershell
cd modern-ai-hotel-booking/client
npm ci
```

**Lưu ý:** Bản source đã rà soát có thể thiếu một số dependency trong `server/package.json`. Nếu cài mới mà báo thiếu package, người phụ trách Backend cần bổ sung và commit lại `package.json` / `package-lock.json`:

```powershell
npm install express-rate-limit google-auth-library nodemailer openai sepay-pg-node
```

## 5. Cấu hình `.env`

**`client/.env`:**

```dotenv
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
```

**`server/.env`:**

```dotenv
PORT=5001
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
CLIENT_URL=http://localhost:5173

OPENAI_API_KEY=YOUR_OPENAI_API_KEY
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_GMAIL@gmail.com
SMTP_PASS=YOUR_GOOGLE_APP_PASSWORD

SEPAY_MERCHANT_ID=YOUR_SEPAY_SANDBOX_MERCHANT_ID
SEPAY_SECRET_KEY=YOUR_SEPAY_SECRET_KEY
SEPAY_IPN_SECRET=YOUR_SEPAY_IPN_SECRET
SEPAY_CHECKOUT_URL=https://pay-sandbox.sepay.vn/v1/checkout/init

ZALOPAY_APP_ID=YOUR_ZALOPAY_SANDBOX_APP_ID
ZALOPAY_KEY1=YOUR_ZALOPAY_KEY1
ZALOPAY_KEY2=YOUR_ZALOPAY_KEY2
ZALOPAY_CALLBACK_URL=https://YOUR_NGROK_DOMAIN/api/payments/zalopay/callback
ZALOPAY_CREATE_URL=https://sb-openapi.zalopay.vn/v2/create
```

**Dùng chung hay dùng riêng?**

| Cấu hình                                           | Cách sử dụng trong nhóm                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| MongoDB Atlas                                      | Dùng chung **database dev**, mỗi thành viên nên có DB user riêng.         |
| OpenAI API                                         | Có thể dùng chung **key của nhóm**; chi phí/quota tính chung.             |
| Google Client ID / Facebook App ID                 | Dùng chung app đăng nhập của nhóm, cấu hình tài khoản test/origin đúng.   |
| Gmail SMTP                                         | Có thể dùng chung hộp thư gửi OTP của nhóm.                               |
| SePay / ZaloPay Sandbox                            | Có thể dùng chung cấu hình thử nghiệm; khóa bí mật chỉ ở Server.          |
| `PORT`, `CLIENT_URL`, `VITE_API_URL`, ngrok domain | Cấu hình theo **máy/port** đang chạy.                                     |
| JWT secret                                         | Do người quản lý cấp; mỗi Backend local độc lập có thể dùng secret riêng. |

**Không đưa `.env` lên Git, không gửi API key/mật khẩu trong README. Các khóa đã từng bị lộ cần được thu hồi và tạo mới.**

## 6. Thiết lập dịch vụ ngoài (tóm tắt)

- **MongoDB Atlas:** Tạo/cấp DB user, cho phép IP máy chạy Backend trong Network Access, lấy connection string để điền `MONGODB_URI`.
- **Gmail OTP:** Bật xác minh 2 bước cho Gmail gửi thư, tạo App Password và điền `SMTP_USER`, `SMTP_PASS`.
- **Google Login:** Tạo OAuth Web Client trên Google Cloud, cho phép origin `http://localhost:5173`; điền cùng Client ID ở client và server.
- **Facebook Login:** Tạo app Meta/Facebook Login; điền App ID ở client + server, App Secret chỉ ở server; cấp quyền tài khoản tester khi app ở chế độ Development.
- **OpenAI:** Người quản lý cấp key cho nhóm, điền `OPENAI_API_KEY` ở server.
- **SePay Sandbox:** Lấy Merchant ID và Secret Key, cấu hình IPN secret và URL `https://YOUR_NGROK_DOMAIN/api/payments/sepay/ipn` trên SePay Dashboard.
- **ZaloPay Sandbox:** Dùng App ID/Key1/Key2 sandbox; cập nhật `ZALOPAY_CALLBACK_URL` bằng domain ngrok đang sử dụng.
- **ngrok:** Cài CLI, thêm authtoken của tài khoản, chạy tunnel HTTPS tới port 5001. Không cần ngrok nếu Backend đã có HTTPS công khai.

## 7. Chạy website

**Terminal 1 — Backend:**

```powershell
cd modern-ai-hotel-booking/server
npm run dev
```

**Terminal 2 — Frontend:**

```powershell
cd modern-ai-hotel-booking/client
npm run dev
```

Truy cập **http://localhost:5173** (Backend: **http://localhost:5001**).

**Terminal 3 — ngrok (chỉ khi thử callback thanh toán):**

```powershell
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
ngrok http 5001 --url https://YOUR_NGROK_DOMAIN
```

Giữ Backend và ngrok cùng chạy khi kiểm thử thanh toán. Sau khi sửa `.env`, khởi động lại tiến trình tương ứng.

## 8. Seed dữ liệu (chạy khi cần)

Chạy trong thư mục `server/`:

```powershell
node scripts/seed30Hotels.js       # Thêm 30 khách sạn demo
node scripts/enrichDestinations.js  # Bổ sung ảnh/nội dung điểm đến còn thiếu
node scripts/embedHotels.js        # Cập nhật embedding AI (có thể tốn quota)
npm run db:test                    # Kiểm tra database
```

**Không chạy `npm run seed` hoặc `npm run db:reset` trên database dùng chung:** script seed tổng có thể xóa dữ liệu hiện tại. Chỉ người phụ trách DB được thực hiện reset trên bản sao lưu/demo riêng.
