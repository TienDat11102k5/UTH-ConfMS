# Script test Gemini API Key
# Chạy script này để kiểm tra key có hoạt động không

Write-Host "=== TEST GEMINI API KEY ===" -ForegroundColor Cyan
Write-Host ""

# Đọc key từ file .env
$envFile = ".\backend\.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $keyLine = $content | Where-Object { $_ -match "^GEMINI_API_KEY=" }
    if ($keyLine) {
        $apiKey = $keyLine -replace "^GEMINI_API_KEY=", ""
        Write-Host "✓ Tìm thấy API key trong backend/.env" -ForegroundColor Green
        Write-Host "  Key: $($apiKey.Substring(0, 15))..." -ForegroundColor Gray
    } else {
        Write-Host "✗ Không tìm thấy GEMINI_API_KEY trong .env" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Không tìm thấy file backend/.env" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Đang test key với Gemini API..." -ForegroundColor Yellow

# Test API
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey"
$body = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Say hello in Vietnamese"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✓ API KEY HOẠT ĐỘNG!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response từ Gemini:" -ForegroundColor Cyan
    $text = $response.candidates[0].content.parts[0].text
    Write-Host $text -ForegroundColor White
    Write-Host ""
    Write-Host "=== TEST THÀNH CÔNG ===" -ForegroundColor Green
    Write-Host "Key của bạn đang hoạt động bình thường." -ForegroundColor Green
    Write-Host "Bây giờ hãy restart backend để sử dụng chức năng AI." -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "✗ API KEY KHÔNG HOẠT ĐỘNG!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 400) {
            Write-Host ""
            Write-Host "Nguyên nhân có thể:" -ForegroundColor Yellow
            Write-Host "- API key không đúng định dạng" -ForegroundColor Yellow
            Write-Host "- Request body không hợp lệ" -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host ""
            Write-Host "Nguyên nhân có thể:" -ForegroundColor Yellow
            Write-Host "- API key không có quyền truy cập" -ForegroundColor Yellow
            Write-Host "- Gemini API chưa được bật trong project" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "Nguyên nhân có thể:" -ForegroundColor Yellow
            Write-Host "- API key không tồn tại hoặc đã bị xóa" -ForegroundColor Yellow
            Write-Host "- URL endpoint không đúng" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "=== HƯỚNG DẪN FIX ===" -ForegroundColor Cyan
    Write-Host "1. Tạo API key mới tại: https://aistudio.google.com/app/apikey" -ForegroundColor White
    Write-Host "2. Copy key mới" -ForegroundColor White
    Write-Host "3. Cập nhật vào backend/.env và ai-service/.env" -ForegroundColor White
    Write-Host "4. Chạy lại script này để test" -ForegroundColor White
    
    exit 1
}
