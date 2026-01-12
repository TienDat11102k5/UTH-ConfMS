package edu.uth.backend.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import edu.uth.backend.util.DateTimeUtil;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class VietnamLocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }
        
        // Convert to Vietnam timezone if needed
        LocalDateTime vietnamTime;
        try {
            // Assume the LocalDateTime is in system timezone, convert to Vietnam time
            vietnamTime = value.atZone(ZoneId.systemDefault())
                              .withZoneSameInstant(DateTimeUtil.VIETNAM_ZONE)
                              .toLocalDateTime();
        } catch (Exception e) {
            // Fallback: assume it's already Vietnam time
            vietnamTime = value;
        }
        
        // Format as string with timezone indicator
        String formatted = vietnamTime.format(FORMATTER);
        gen.writeString(formatted);
    }
}