# 🛵 Sổ Shipper - Ứng Dụng iOS Cho Shipper

Ứng dụng ghi chép đơn hàng, tiền ship và định vị quãng đường dành riêng cho Shipper chạy xe máy trên iOS.

---

## 🛠️ Công Nghệ & Cấu Trúc Dự Án
- **Framework**: React 19 + Tailwind CSS + Lucide Icons.
- **Native iOS Engine**: Capacitor (Xcode workspace tiêu chuẩn tại `ios/App`).
- **CI/CD Tự Động**: GitHub Actions (`.github/workflows/build-ios.yml`) tự động build ra file **`SoShipper.ipa`** (Unsigned) trên máy ảo macOS 14 mà không cần chứng chỉ trả phí của Apple!

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Tải File .IPA

### Bước 1: Khởi tạo và Đẩy code lên GitHub
Nếu máy tính của bạn đã cài Git, mở PowerShell tại thư mục `d:\note` và chạy:
```powershell
git init
git add .
git commit -m "Khoi tao ung dung So Shipper iOS"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/<ten-repo>.git
git push -u origin main
```
*(Nếu chưa cài Git, bạn có thể tải Git for Windows tại https://git-scm.com hoặc dùng GitHub Desktop).*

---

### Bước 2: Tự Động Build Ra File `.ipa` Trên GitHub
1. Ngay khi bạn `git push` lên GitHub, GitHub Actions sẽ tự động kích hoạt workflow **Build iOS IPA (Unsigned)**.
2. Bạn vào tab **Actions** trên repository GitHub của mình.
3. Bấm vào tiến trình đang chạy (mất khoảng 1 - 2 phút để hoàn tất trên máy ảo macOS của GitHub).
4. Khi chạy xong (dấu tích xanh ✅), cuộn xuống mục **Artifacts** ở dưới cùng.
5. Tải file **`SoShipper-iOS-v1.0.zip`** về (bên trong chứa sẵn file **`SoShipper.ipa`**).

---

### Bước 3: Cài Đặt File `.IPA` Lên iPhone

Vì bạn đã có sẵn phương thức sign không cần chứng chỉ của Apple, bạn có thể cài bằng một trong các cách sau:
- **TrollStore** (nếu iPhone hỗ trợ TrollStore): Tải thẳng file `.ipa` về iPhone, chia sẻ vào TrollStore là cài vĩnh viễn không bao giờ bị thu hồi.
- **Sideloadly / AltStore / Scarlet / ESign / GBox**: Ký bằng Apple ID cá nhân hoặc chứng chỉ doanh nghiệp và cài trực tiếp vào máy.

---

## 🛵 Tính Năng Nổi Bật Của App
- **Chạy hoàn toàn Offline**: Không phụ thuộc vào Wi-Fi hay máy chủ, dữ liệu đơn hàng và lịch sử lưu trực tiếp trên iPhone.
- **Check-in đầu ngày**: Mở app bấm Check-in để bắt đầu tính giờ ca làm việc.
- **Nhận & Hoàn thành đơn**:
  - Tự động lấy tọa độ GPS điểm nhận & điểm trả.
  - Tự tính quãng đường (km) của chuyến đi.
  - Chọn nhanh tiền ship 1 chạm: **5k, 10k, 15k, 20k, 25k, 30k** hoặc gõ tùy ý theo đơn vị nghìn đồng.
- **Check-out cuối ngày**: Báo cáo tổng số đơn, tổng tiền, tổng quãng đường đã chạy, xuất báo cáo gửi Zalo và xuất file Excel CSV.
