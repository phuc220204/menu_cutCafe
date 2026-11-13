# Cụt Cafe — Cinematic Menu

Menu tiếng Việt với React 19, TypeScript, Vite, React Three Fiber 9, Drei và GSAP. Thiết kế kế thừa bản nháp team duyệt: nền tối đổi màu, chữ lớn, menu nổi và chuyển cảnh cắt chéo; kết hợp mô hình đồ uống 3D.

## Chạy tại máy

Yêu cầu Node.js 22.12+ hoặc 24+.

```sh
npm ci
npm run dev
```

Mở địa chỉ Local Vite in trong terminal. `npm run check` kiểm tra TypeScript. `npm run build` tạo bản tĩnh tại `dist`; `npm run preview` xem bản build.

## Menu và giá

`src/menu.ts` chứa đủ 19 món: ID, tên, giá VND dạng số nguyên, mô tả, nền trà, lớp sữa/kem và các biến thể. Mỗi nhóm có `background`, `accent` và `scene` để chỉnh ánh sáng/góc camera.

Mọi giá là **giá minh họa**; thay bằng giá thật và cập nhật ghi chú trước khi dùng chính thức. Chưa tính phụ thu sữa. Không có backend, đặt món hay giỏ hàng. Hai nhóm trà luôn hiển thị cùng nhau. Biến thể được nhớ trong bộ nhớ trang đang mở, đặt lại khi tải lại trang.

## Chuyển động và assets

- Intro 1,55 giây, một lần mỗi phiên (sessionStorage `cut-cafe-intro-seen-v2`); Bỏ qua và Escape mở menu ngay, không chờ 3D.
- `src/useCategoryTransition.ts`: wipe 360ms che + 440ms mở, hủy chuyển cảnh cũ khi có yêu cầu mới. `src/navigation.ts` xử lý revision để callback cũ không đổi lại nội dung.
- `src/DrinkScene.tsx`: một Canvas lazy-load, camera rig độc lập với ly, môi trường studio dựng bằng code, texture Cụt Cafe và mô hình dừa. Không tải HDRI, GLB hoặc ảnh từ CDN.
- `src/styles.css`: bảng màu, kích thước chữ, bố cục, dock và hiệu ứng grain nhẹ.
- Có Bản tĩnh, Tạm dừng, reduced motion, WebGL fallback; ngừng render khi không thấy scene hoặc tab ẩn. DPR mobile tối đa 1,4. Font Bricolage Grotesque và Be Vietnam Pro (OFL) đóng gói cục bộ.

## Kiểm tra

```sh
node --experimental-strip-types --test tests/navigation.test.ts
npm run check
npm run build
```

Các test tập trung vào lựa chọn cuối thắng, bỏ callback cũ, hủy chuyển cảnh, đổi chế độ chuyển động và tính toàn vẹn 19 món/giá. Kiểm tra trình duyệt ở 360, 390, 768 và 1440 px, biến thể, keyboard, intro, dock, bản tĩnh và chuyển nhóm nhanh.

## Xuất bản

Giữ nguyên `.openai/hosting.json` và project ID để cập nhật Site hiện có. Bản tĩnh nằm tại `dist`. Không tự đổi quyền chia sẻ; bảo toàn cấu hình hiện tại trên Sites.
