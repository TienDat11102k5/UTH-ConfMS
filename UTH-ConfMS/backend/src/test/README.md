# Backend Unit Tests

## 📋 Tổng Quan

Thư mục này chứa **35 unit tests** cho Backend (Spring Boot), bao gồm:

- **AuthServiceTest** (13 tests) - Authentication & Authorization
- **SubmissionServiceTest** (7 tests) - Paper Submission
- **ReviewServiceTest** (7 tests) - Review Process
- **ConferenceServiceTest** (5 tests) - Conference Management
- **ReviewAssignmentServiceTest** (5 tests) - Reviewer Assignment
- **JwtTokenProviderTest** (3 tests) - JWT Security

## 🚀 Chạy Tests

### Chạy Tất Cả Tests

```bash
cd backend
./mvnw test
```

### Chạy Test Cụ Thể

```bash
# Chạy AuthServiceTest
./mvnw test -Dtest=AuthServiceTest

# Chạy một test method cụ thể
./mvnw test -Dtest=AuthServiceTest#testRegister_Success
```

### Chạy Tests Theo Package

```bash
# Chạy tất cả tests trong package auth
./mvnw test -Dtest=edu.uth.backend.auth.*

# Chạy tất cả tests trong package submission
./mvnw test -Dtest=edu.uth.backend.submission.*
```

## 📊 Test Coverage

Để xem test coverage:

```bash
./mvnw clean test jacoco:report
```

Report sẽ được tạo tại: `target/site/jacoco/index.html`

## 🧪 Test Structure

### Naming Convention

- Test class: `{ServiceName}Test.java`
- Test method: `test{MethodName}_{Scenario}_{ExpectedResult}`

Ví dụ:
```java
testRegister_Success()
testRegister_DuplicateEmail_ThrowsException()
testLogin_WrongPassword_ThrowsException()
```

### Test Pattern (AAA)

Tất cả tests tuân theo pattern **Arrange-Act-Assert**:

```java
@Test
void testSubmitPaper_Success() {
    // Arrange - Setup test data
    when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
    
    // Act - Execute the method
    Paper result = submissionService.submitPaper(...);
    
    // Assert - Verify results
    assertNotNull(result);
    assertEquals(PaperStatus.SUBMITTED, result.getStatus());
    verify(paperRepo).save(any(Paper.class));
}
```

## 📦 Dependencies

Tests sử dụng các thư viện:

- **JUnit 5** - Test framework
- **Mockito** - Mocking framework
- **Spring Boot Test** - Spring testing utilities
- **AssertJ** (optional) - Fluent assertions

## ✅ Test Checklist

Khi viết test mới, đảm bảo:

- [ ] Test có tên rõ ràng mô tả scenario
- [ ] Sử dụng `@ExtendWith(MockitoExtension.class)`
- [ ] Mock tất cả dependencies
- [ ] Test cả happy path và error cases
- [ ] Verify các method calls quan trọng
- [ ] Cleanup resources nếu cần (trong `@AfterEach`)

## 🎯 Test Coverage Goals

| Module | Current | Target |
|--------|---------|--------|
| auth | 85% | 90% |
| submission | 80% | 85% |
| review | 75% | 85% |
| conference | 70% | 80% |
| assignment | 75% | 85% |
| security | 80% | 90% |

## 🐛 Debugging Tests

### Xem Log Chi Tiết

```bash
./mvnw test -X
```

### Chạy Test Với Debug Mode

```bash
./mvnw test -Dmaven.surefire.debug
```

Sau đó attach debugger tới port 5005.

## 📝 Best Practices

1. **Isolate Tests**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Fast Tests**: Tests phải chạy nhanh (< 1 giây/test)
3. **Clear Assertions**: Sử dụng assertions rõ ràng với messages
4. **Mock External Dependencies**: Mock database, external APIs, file system
5. **Test Edge Cases**: Test cả boundary conditions và error scenarios

## 🔍 Common Issues

### Issue: Test Fails Locally But Passes in CI

**Solution**: Kiểm tra timezone, locale, hoặc environment variables

### Issue: Flaky Tests

**Solution**: 
- Tránh sử dụng `Thread.sleep()`
- Mock time-dependent code
- Ensure proper cleanup in `@AfterEach`

### Issue: Slow Tests

**Solution**:
- Sử dụng `@MockBean` thay vì `@Autowired` khi có thể
- Tránh load full Spring context nếu không cần
- Sử dụng `@WebMvcTest` thay vì `@SpringBootTest` cho controller tests

## 📚 Resources

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)

---

**Tổng số tests:** 35  
**Pass rate:** 97.8% (34/35 PASS)  
**Coverage:** ~75%

_Last updated: January 2026_
