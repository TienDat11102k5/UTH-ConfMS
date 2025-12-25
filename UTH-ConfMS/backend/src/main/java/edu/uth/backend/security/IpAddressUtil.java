package edu.uth.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Utility class for extracting IP address from HTTP requests
 * Handles proxied requests and load balancers
 * 
 * @author Security Team
 * @since 1.0.0
 */
@Component
public class IpAddressUtil {

    private static final String[] IP_HEADER_CANDIDATES = {
        "X-Forwarded-For",
        "Proxy-Client-IP",
        "WL-Proxy-Client-IP",
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED",
        "HTTP_X_CLUSTER_CLIENT_IP",
        "HTTP_CLIENT_IP",
        "HTTP_FORWARDED_FOR",
        "HTTP_FORWARDED",
        "HTTP_VIA",
        "REMOTE_ADDR"
    };

    /**
     * Get client IP address from HTTP request
     * Checks various headers commonly used by proxies and load balancers
     * 
     * @param request HTTP servlet request
     * @return Client IP address
     */
    public String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        for (String header : IP_HEADER_CANDIDATES) {
            String ipList = request.getHeader(header);
            if (ipList != null && !ipList.isEmpty() && !"unknown".equalsIgnoreCase(ipList)) {
                // X-Forwarded-For can contain multiple IPs, use the first one
                String ip = ipList.split(",")[0].trim();
                if (isValidIpAddress(ip)) {
                    return ip;
                }
            }
        }

        // Fallback to remote address
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    /**
     * Validate IP address format
     * Supports both IPv4 and IPv6
     * 
     * @param ip IP address string
     * @return true if valid, false otherwise
     */
    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }

        // Basic validation - can be enhanced with regex
        return !ip.equals("unknown") 
            && !ip.equals("0:0:0:0:0:0:0:1") // IPv6 localhost
            && !ip.equals("::1"); // IPv6 localhost short form
    }

    /**
     * Check if IP address is from local network
     * 
     * @param ip IP address
     * @return true if local, false otherwise
     */
    public boolean isLocalAddress(String ip) {
        if (ip == null) {
            return false;
        }

        return ip.equals("127.0.0.1")
            || ip.equals("localhost")
            || ip.equals("0:0:0:0:0:0:0:1")
            || ip.equals("::1")
            || ip.startsWith("192.168.")
            || ip.startsWith("10.")
            || ip.startsWith("172.16.")
            || ip.startsWith("172.17.")
            || ip.startsWith("172.18.")
            || ip.startsWith("172.19.")
            || ip.startsWith("172.20.")
            || ip.startsWith("172.21.")
            || ip.startsWith("172.22.")
            || ip.startsWith("172.23.")
            || ip.startsWith("172.24.")
            || ip.startsWith("172.25.")
            || ip.startsWith("172.26.")
            || ip.startsWith("172.27.")
            || ip.startsWith("172.28.")
            || ip.startsWith("172.29.")
            || ip.startsWith("172.30.")
            || ip.startsWith("172.31.");
    }

    /**
     * Get user agent from request
     * 
     * @param request HTTP servlet request
     * @return User agent string
     */
    public String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "unknown";
    }

    /**
     * Get request origin
     * 
     * @param request HTTP servlet request
     * @return Origin URL
     */
    public String getOrigin(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = request.getHeader("Referer");
        }
        return origin != null ? origin : "unknown";
    }
}
