# Admin User Management

Tài liệu này mô tả các API quản trị người dùng (chỉ dành cho ADMIN).

## Quyền truy cập
- Yêu cầu JWT và quyền `ROLE_ADMIN`
- Base path: `/api/admin/users`

## Danh sách người dùng
**GET** `/api/admin/users`

- Trả về danh sách user cho trang quản trị.
- Mỗi phần tử có các trường chính: `id`, `name`, `email`, `role`, `status`.

## Cập nhật vai trò
**PUT** `/api/admin/users/{id}/role`

Body:
```json
{ "role": "AUTHOR" }
```

- `role` có thể là: `AUTHOR`, `REVIEWER`, `CHAIR`, `ADMIN`.
- Backend sẽ tự chuẩn hoá thành `ROLE_*`.

## Cập nhật trạng thái
**PUT** `/api/admin/users/{id}/status`

Body:
```json
{ "enabled": true }
```

- `enabled = true` → `status = Active`
- `enabled = false` → `status = Disabled`

## Cập nhật họ tên
**PUT** `/api/admin/users/{id}/name`

Body:
```json
{ "fullName": "Nguyễn Văn A" }
```

## Xoá người dùng
**DELETE** `/api/admin/users/{id}`

- Trả về `204 No Content` nếu xoá thành công.

## Ghi chú frontend
Trang quản trị sửa user đang dùng các endpoint ở trên để lưu `name`, `role`, `status`.
