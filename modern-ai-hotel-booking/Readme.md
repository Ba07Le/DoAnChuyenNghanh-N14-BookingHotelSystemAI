## 🚀 Setup Project

Clone project về máy và cài dependencies:

```bash
git clone https://github.com/Ba07Le/DoAnChuyenNghanh-N14-BookingHotelSystemAI.git
cd modern-ai-hotel-booking

cd server
npm install

cd  client
npm install
```

### Cấu hình MongoDB Atlas

Trong thư mục `server`, tạo file `.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Mỗi thành viên tự tạo `.env` và sử dụng MongoDB Atlas được cấp quyền. **Không commit `.env`, password MongoDB hoặc API keys lên GitHub.**

Đảm bảo `.gitignore` có:

```gitignore
node_modules/
.env
.env.local
!.env.example
dist/
build/
.DS_Store
.vscode/
```

### Chạy Backend

Terminal 1:

```bash
cd server
npm run dev
```

Backend chạy tại:

```text
http://localhost:5000
```

### Chạy Frontend

Mở terminal 2:

```bash
cd client
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

### Quy trình Git

Trước khi code:

```bash
git pull
```

Tạo branch riêng:

```bash
git checkout -b feature/ten-chuc-nang
```

Sau khi hoàn thành:

```bash
git add .
git commit -m "feat: ten-chuc-nang"
git push origin feature/ten-chuc-nang
```

Sau đó tạo Pull Request trên GitHub. Không push trực tiếp code chưa kiểm tra lên `main`.
