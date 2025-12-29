package edu.uth.backend.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class để xử lý date/time đồng nhất
 * Tất cả datetime đều sử dụng timezone Asia/Ho_Chi_Minh (UTC+7)
 */
public class DateTimeUtil {

    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    public static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    /**
     * Lấy thời gian hiện tại theo timezone Việt Nam
     */
    public static LocalDateTime nowVietnam() {
        return LocalDateTime.now(VIETNAM_ZONE);
    }

    /**
     * Lấy ZonedDateTime hiện tại theo timezone Việt Nam
     */
    public static ZonedDateTime nowZonedVietnam() {
        return ZonedDateTime.now(VIETNAM_ZONE);
    }

    /**
     * Convert Instant sang LocalDateTime theo timezone Việt Nam
     */
    public static LocalDateTime toVietnamTime(Instant instant) {
        if (instant == null) return null;
        return LocalDateTime.ofInstant(instant, VIETNAM_ZONE);
    }

    /**
     * Convert LocalDateTime sang Instant (giả định input là Vietnam time)
     */
    public static Instant toInstant(LocalDateTime localDateTime) {
        if (localDateTime == null) return null;
        return localDateTime.atZone(VIETNAM_ZONE).toInstant();
    }

    /**
     * Format LocalDateTime thành string hiển thị (dd/MM/yyyy HH:mm:ss)
     */
    public static String formatDisplay(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(DISPLAY_FORMATTER);
    }

    /**
     * Format Instant thành string hiển thị theo timezone Việt Nam
     */
    public static String formatDisplay(Instant instant) {
        if (instant == null) return null;
        return toVietnamTime(instant).format(DISPLAY_FORMATTER);
    }

    /**
     * Format ZonedDateTime thành string hiển thị
     */
    public static String formatDisplay(ZonedDateTime zonedDateTime) {
        if (zonedDateTime == null) return null;
        return zonedDateTime.withZoneSameInstant(VIETNAM_ZONE).format(DISPLAY_FORMATTER);
    }
}
