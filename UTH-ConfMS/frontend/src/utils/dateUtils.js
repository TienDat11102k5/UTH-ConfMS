/**
 * Date/Time Utilities
 * Tất cả datetime đều hiển thị theo timezone Việt Nam (UTC+7)
 */

/**
 * Format ISO datetime string sang định dạng hiển thị Việt Nam
 * @param {string|Date} dateInput - ISO string hoặc Date object
 * @param {boolean} includeTime - Có hiển thị giờ không (mặc định: true)
 * @returns {string} - Formatted string (dd/MM/yyyy HH:mm:ss hoặc dd/MM/yyyy)
 */
export const formatDateTime = (dateInput, includeTime = true) => {
    if (!dateInput) return '';
    
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        
        // Kiểm tra date hợp lệ
        if (isNaN(date.getTime())) return '';
        
        // Format theo timezone Việt Nam
        const options = {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            options.hour12 = false;
        }
        
        const formatter = new Intl.DateTimeFormat('vi-VN', options);
        const parts = formatter.formatToParts(date);
        
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const year = parts.find(p => p.type === 'year').value;
        
        if (includeTime) {
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const second = parts.find(p => p.type === 'second').value;
            return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
        }
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

/**
 * Format date only (không có time)
 */
export const formatDate = (dateInput) => {
    return formatDateTime(dateInput, false);
};

/**
 * Format time only (HH:mm:ss)
 */
export const formatTime = (dateInput) => {
    if (!dateInput) return '';
    
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return '';
        
        const options = {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        return new Intl.DateTimeFormat('vi-VN', options).format(date);
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

/**
 * Format relative time (vừa xong, 5 phút trước, ...)
 */
export const formatRelativeTime = (dateInput) => {
    if (!dateInput) return '';
    
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return '';
    }
};

/**
 * Convert date input sang ISO string (để gửi lên backend)
 */
export const toISOString = (dateInput) => {
    if (!dateInput) return null;
    
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
    } catch (error) {
        console.error('Error converting to ISO string:', error);
        return null;
    }
};

/**
 * Parse ISO string sang Date object
 */
export const parseDate = (isoString) => {
    if (!isoString) return null;
    
    try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

/**
 * Kiểm tra date có hợp lệ không
 */
export const isValidDate = (dateInput) => {
    if (!dateInput) return false;
    
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
};

/**
 * So sánh 2 date (trả về -1, 0, 1)
 */
export const compareDates = (date1, date2) => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
};
