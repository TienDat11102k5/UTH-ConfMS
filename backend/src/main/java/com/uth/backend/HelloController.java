package com.uth.backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
// Dòng dưới đây cho phép React (chạy ở cổng 5173) được phép kết nối
@CrossOrigin(origins = "http://localhost:5173") 
public class HelloController {

    @GetMapping("/")
    public String index() {
        return "CHÚC MỪNG! React đã lấy được dữ liệu từ Java Backend!";
    }
}