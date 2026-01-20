package edu.uth.backend.debug;

import edu.uth.backend.util.DateTimeUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

@RestController
@RequestMapping("/api/debug")
public class TimezoneTestController {

    @GetMapping("/timezone")
    public Map<String, Object> getTimezoneInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // JVM timezone
        info.put("jvmDefaultTimezone", TimeZone.getDefault().getID());
        info.put("jvmDefaultOffset", TimeZone.getDefault().getRawOffset() / (1000 * 60 * 60));
        
        // Current times
        LocalDateTime systemNow = LocalDateTime.now();
        LocalDateTime vietnamNow = DateTimeUtil.nowVietnam();
        ZonedDateTime zonedNow = DateTimeUtil.nowZonedVietnam();
        
        info.put("systemLocalDateTime", systemNow.toString());
        info.put("vietnamLocalDateTime", vietnamNow.toString());
        info.put("vietnamZonedDateTime", zonedNow.toString());
        
        // Formatted times
        info.put("systemFormatted", DateTimeUtil.formatDisplay(systemNow));
        info.put("vietnamFormatted", DateTimeUtil.formatDisplay(vietnamNow));
        info.put("zonedFormatted", DateTimeUtil.formatDisplay(zonedNow));
        
        return info;
    }
    
    @GetMapping("/test-submission-time")
    public Map<String, Object> testSubmissionTime() {
        Map<String, Object> result = new HashMap<>();
        
        // Simulate what happens when creating a submission
        LocalDateTime createdAt = DateTimeUtil.nowVietnam();
        LocalDateTime updatedAt = DateTimeUtil.nowVietnam();
        
        result.put("createdAt", createdAt.toString());
        result.put("updatedAt", updatedAt.toString());
        result.put("createdAtFormatted", DateTimeUtil.formatDisplay(createdAt));
        result.put("updatedAtFormatted", DateTimeUtil.formatDisplay(updatedAt));
        
        return result;
    }
}