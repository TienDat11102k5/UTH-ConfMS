package edu.uth.backend.auth.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String email;
    private String password;
    private String fullName;
    private String affiliation;
    private String phone;
}