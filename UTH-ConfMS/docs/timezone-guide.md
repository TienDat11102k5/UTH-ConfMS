# Hướng dẫn xử lý Timezone trong UTH-ConfMS

## Tổng quan

Toàn bộ hệ thống UTH-ConfMS sử dụng timezone **Asia/Ho_Chi_Minh (UTC+7)** để đảm bảo tính đồng nhất.

## Backend (Java/Spring Boot)

### Cấu hình

File `application.properties` đã được cấu hình:

```properties
# Timezone configuration - UTC+7 (Asia/Ho_Chi_Minh)
spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Ho_Chi_Minh
spring.jackson.time-zone=Asia/Ho_Chi_Minh
spring.jackson.date-format=yyyy-MM-dd HH:mm:ss
```

### TimezoneConfig

Class `TimezoneConfig.java` tự động set default timezone cho JVM khi khởi động:

```java
@Configuration
public class TimezoneConfig {
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }
}
```

### DateTimeUtil

Sử dụng `DateTimeUtil` để xử lý date/time:

```java
// Lấy thời gian hiện tại theo timezone Việt Nam
LocalDateTime now = DateTimeUtil.nowVietnam();

// Convert Instant sang LocalDateTime (Vietnam time)
LocalDateTime vietnamTime = DateTimeUtil.toVietnamTime(instant);

// Format để hiển thị
String displayTime = DateTimeUtil.formatDisplay(localDateTime);
// Output: "29/12/2025 15:30:45"
```

### Best Practices

1. **Lưu trong database**: Sử dụng `LocalDateTime` hoặc `Instant`
2. **API Response**: Jackson tự động convert sang timezone đã config
3. **Tạo timestamp mới**: Dùng `DateTimeUtil.nowVietnam()`
4. **Format hiển thị**: Dùng `DateTimeUtil.formatDisplay()`

## Frontend (React)

### dateUtils.js

File `src/utils/dateUtils.js` cung cấp các hàm xử lý date:

```javascript
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from '../utils/dateUtils';

// Format đầy đủ (dd/MM/yyyy HH:mm:ss)
const fullDateTime = formatDateTime(isoString);
// Output: "29/12/2025 15:30:45"

// Chỉ ngày (dd/MM/yyyy)
const dateOnly = formatDate(isoString);
// Output: "29/12/2025"

// Chỉ giờ (HH:mm:ss)
const timeOnly = formatTime(isoString);
// Output: "15:30:45"

// Relative time (vừa xong, 5 phút trước, ...)
const relative = formatRelativeTime(isoString);
// Output: "5 phút trước"
```

### Best Practices

1. **Hiển thị datetime**: Luôn dùng `formatDateTime()` hoặc `formatDate()`
2. **Gửi lên backend**: Dùng `toISOString()` để convert sang ISO format
3. **Parse từ backend**: Dùng `parseDate()` để convert ISO string sang Date object
4. **Validate**: Dùng `isValidDate()` để kiểm tra date hợp lệ

### Ví dụ trong Component

```jsx
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';

function MyComponent({ data }) {
    return (
        <div>
            <p>Ngày tạo: {formatDateTime(data.createdAt)}</p>
            <p>Cập nhật: {formatRelativeTime(data.updatedAt)}</p>
        </div>
    );
}
```

## Migration từ code cũ

### Backend

**Trước:**
```java
LocalDateTime.now() // Có thể là UTC hoặc system timezone
```

**Sau:**
```java
DateTimeUtil.nowVietnam() // Luôn là UTC+7
```

### Frontend

**Trước:**
```javascript
new Date(isoString).toLocaleString() // Phụ thuộc browser locale
```

**Sau:**
```javascript
formatDateTime(isoString) // Luôn hiển thị theo UTC+7
```

## Kiểm tra

### Backend

Khi khởi động, console sẽ hiển thị:
```
✅ Application timezone set to: Asia/Ho_Chi_Minh
```

### Frontend

Test trong browser console:
```javascript
import { formatDateTime } from './utils/dateUtils';
console.log(formatDateTime(new Date()));
// Output: "29/12/2025 15:30:45" (theo giờ Việt Nam)
```

## Lưu ý quan trọng

1. **Database**: PostgreSQL lưu timestamp với timezone, không cần thay đổi schema
2. **API**: Backend tự động convert timezone khi serialize JSON
3. **Browser**: Frontend format theo timezone Việt Nam bất kể timezone của máy user
4. **Testing**: Khi test, đảm bảo mock date/time theo UTC+7

## Troubleshooting

### Vấn đề: Thời gian vẫn hiển thị UTC

**Giải pháp:**
1. Restart backend để áp dụng TimezoneConfig
2. Clear browser cache
3. Kiểm tra có import đúng dateUtils không

### Vấn đề: Thời gian sai 7 giờ

**Nguyên nhân:** Code cũ chưa migrate sang dateUtils

**Giải pháp:** Thay thế tất cả `new Date().toLocaleString()` bằng `formatDateTime()`

## Tài liệu tham khảo

- [Java ZoneId](https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Spring Boot Timezone](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
