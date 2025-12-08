package edu.uth.backend.entity;

public enum AssignmentStatus {
    PENDING,    // Chờ Reviewer đồng ý
    ACCEPTED,   // Reviewer đã nhận
    DECLINED,   // Reviewer từ chối
    COMPLETED   // Đã chấm xong
}