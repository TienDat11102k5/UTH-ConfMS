package edu.uth.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Error response structure
     */
    private Map<String, Object> buildErrorResponse(String message, HttpStatus status, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", error);
        response.put("message", message);
        return response;
    }

    /**
     * Handle IllegalArgumentException (business validation errors)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, "Bad Request"));
    }

    /**
     * Handle RuntimeException (general errors)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        logger.error("Runtime error: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse(
                        "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Internal Server Error"
                ));
    }

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("message", "Dữ liệu đầu vào không hợp lệ");
        response.put("validationErrors", errors);

        logger.warn("Validation errors: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle authentication errors
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        logger.warn("Authentication error: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse(
                        "Xác thực thất bại. Vui lòng đăng nhập lại.",
                        HttpStatus.UNAUTHORIZED,
                        "Unauthorized"
                ));
    }

    /**
     * Handle bad credentials
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(BadCredentialsException ex) {
        logger.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse(
                        "Email hoặc mật khẩu không đúng",
                        HttpStatus.UNAUTHORIZED,
                        "Unauthorized"
                ));
    }

    /**
     * Handle access denied errors
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(buildErrorResponse(
                        "Bạn không có quyền truy cập tài nguyên này",
                        HttpStatus.FORBIDDEN,
                        "Forbidden"
                ));
    }

    /**
     * Handle file upload size exceeded
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        logger.warn("File size exceeded: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(buildErrorResponse(
                        "Kích thước file vượt quá giới hạn cho phép (25MB)",
                        HttpStatus.PAYLOAD_TOO_LARGE,
                        "Payload Too Large"
                ));
    }

    /**
     * Handle ResourceNotFoundException (custom exception)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        logger.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, "Not Found"));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse(
                        "Đã xảy ra lỗi không mong muốn. Vui lòng liên hệ quản trị viên.",
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Internal Server Error"
                ));
    }
}
