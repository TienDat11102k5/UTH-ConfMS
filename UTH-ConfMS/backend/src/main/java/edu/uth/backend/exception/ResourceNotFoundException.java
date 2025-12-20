package edu.uth.backend.exception;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        super(String.format("%s không tồn tại với ID: %d", resourceName, id));
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s không tồn tại với %s: %s", resourceName, fieldName, fieldValue));
    }
}
