# Cụt Cụt Cafe

Landing page menu tiếng Việt với React 19, TypeScript, Vite, React Three Fiber 9, Drei và GSAP MorphSVG.

## Chạy tại máy

Yêu cầu Node.js 22.12+ hoặc 24+.

```sh
npm ci
npm run dev
```

Mở địa chỉ Local Vite in trong terminal. `npm run check` kiểm tra TypeScript; `npm run build` tạo bản tĩnh tại `dist`; `npm run preview` xem bản build.

## Sửa menu

`src/menu.ts` chứa toàn bộ 19 món, giá VND dạng số nguyên, nhóm trà, màu đồ uống, lớp sữa/kem và tùy chọn biến thể. `src/styles.css` chứa màu và bố cục. Mọi giá hiện là **giá minh họa**; cần thay bằng giá thật và sửa ghi chú trước khi dùng menu chính thức. Chưa tính phụ thu theo loại sữa.

Lựa chọn được lưu trong bộ nhớ trong khi trang đang mở, đặt lại khi tải lại trang. Không có đặt món, giỏ hàng hay backend. Assets được dựng bằng SVG và hình học Three.js; font OFL được đóng gói cục bộ qua Fontsource, không phụ thuộc CDN.

Phần 3D được tải riêng, chỉ một Canvas; tạm ngừng ngoài màn hình hoặc khi tab ẩn. Có nút tạm dừng, nút xem bản tĩnh, hỗ trợ reduced motion và minh họa SVG dự phòng khi WebGL không khả dụng.

## Xuất bản

`.openai/hosting.json` lưu ID Sites và khai báo bản tĩnh `dist`. Giữ nguyên ID khi cập nhật và xuất bản bằng Sites workflow. Mặc định site riêng tư.
