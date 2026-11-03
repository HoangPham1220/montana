# Montana Android

Ứng dụng Android dùng chung mã React và dữ liệu với Montana web qua Capacitor. Android 7.0 trở lên, có Android System WebView được cập nhật.

## Build APK trên Windows

Cần Node.js 22+, Java 21 và Android SDK 36 (cài qua Android Studio).
Đặt `JAVA_HOME` tới JDK và `ANDROID_HOME` tới Android SDK trước khi chạy:

```powershell
npm ci
npm run android:apk
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
Chép APK sang điện thoại, mở file và cho phép cài từ nguồn này khi Android yêu cầu.
Đây là bản debug để cài thử; phát hành Google Play cần ký bản release bằng khóa riêng.

Để mở dự án trong Android Studio:

```powershell
npm run android:sync
npm run android:open
```

Trên macOS/Linux: chạy `npm run android:sync`, rồi `cd android` và `./gradlew assembleDebug`.
Mỗi lần sửa giao diện phải build và sync lại trước khi build Android.

## Dữ liệu

- Dữ liệu lưu riêng trên thiết bị, dùng được offline ngay lần mở đầu tiên. Không có dữ liệu mẫu hay kết nối Sheet được đóng gói sẵn.
- Để chuyển từ web: **Cài đặt → Xuất JSON** trên web, rồi **Nhập JSON** trong app; hoặc nhập URL và token rồi đồng bộ Google Sheet. Backup JSON không bao gồm URL/token.
- Xuất JSON/CSV mở hộp chia sẻ Android; chọn nơi lưu hoặc ứng dụng nhận file. Hủy hộp chia sẻ thì chưa có bản sao lưu bên ngoài app.
- Gỡ app hoặc xóa dữ liệu ứng dụng sẽ mất dữ liệu chưa sao lưu/đồng bộ. Sao lưu tự động Android bị tắt để tránh đưa token kết nối vào cloud backup.
- Nút Back đóng biểu mẫu đang mở, sau đó quay lại lịch sử màn hình; ở màn hình đầu sẽ thu nhỏ app. Đồng bộ tự động tiếp tục khi quay lại app nếu đã bật trong Cài đặt.

## Kiểm tra trên máy ảo/thiết bị

Cài APK bằng `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Chạy `node scripts/test-android.mjs <đường-dẫn-adb> [serial]` với app đang mở để kiểm tra native bridge, xuất backup và nút Back. Dùng thiết bị thử nghiệm riêng.
