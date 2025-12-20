"""
Module Ghi nhật ký Sử dụng (Tương thích Ngược)
Xuất lại từ audit_logger để tương thích với mã hiện tại.
"""
from core.governance.audit_logger import (
    log_ai_usage,
    get_audit_logger,
    AuditLogger
)

__all__ = ['log_ai_usage', 'get_audit_logger', 'AuditLogger']




