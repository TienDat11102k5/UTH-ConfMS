package edu.uth.backend.admin;

import edu.uth.backend.admin.dto.AdminUserResponse;
import edu.uth.backend.entity.Role;
import edu.uth.backend.entity.User;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.RoleRepository;
import edu.uth.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private PaperRepository paperRepo;

    @Mock
    private RoleRepository roleRepo;

    @InjectMocks
    private AdminService adminService;

    private User user;
    private Role roleUser;
    private Role roleAdmin;

    @BeforeEach
    void setUp() {
        roleUser = new Role();
        roleUser.setName("ROLE_USER");
        
        roleAdmin = new Role();
        roleAdmin.setName("ROLE_ADMIN");

        user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setFullName("User Name");
        user.setEnabled(true);
        Set<Role> roles = new HashSet<>();
        roles.add(roleUser);
        user.setRoles(roles);
    }

    @Test
    void testGetAllUsers() {
        when(userRepo.findAll()).thenReturn(Arrays.asList(user));

        List<AdminUserResponse> result = adminService.getAllUsers();

        assertEquals(1, result.size());
        assertEquals(user.getEmail(), result.get(0).getEmail());
        verify(userRepo).findAll();
    }

    @Test
    void testToggleUserActive_Success() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Initial true -> toggle -> false
        User result = adminService.toggleUserActive(1L);
        assertFalse(result.isEnabled());
        // Toggle again -> true
        result = adminService.toggleUserActive(1L);
        assertTrue(result.isEnabled());
    }

    @Test
    void testUpdateUserStatus() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse result = adminService.updateUserStatus(1L, false);
        
        assertEquals("Disabled", result.getStatus());
        verify(userRepo).save(user);
    }

    @Test
    void testUpdateUserFullName_Success() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse result = adminService.updateUserFullName(1L, "New Name");

        assertEquals("New Name", result.getName());
    }

    @Test
    void testUpdateUserFullName_Empty_ThrowsException() {
        assertThrows(RuntimeException.class, () -> 
            adminService.updateUserFullName(1L, "")
        );
    }

    @Test
    void testUpdateUserRole_Success() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(roleRepo.findByName("ROLE_ADMIN")).thenReturn(Optional.of(roleAdmin));
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse result = adminService.updateUserRole(1L, "ADMIN");

        assertEquals("ADMIN", result.getRole());
    }

    @Test
    void testUpdateUserRole_RoleNotFound() {
        when(roleRepo.findByName("ROLE_UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> 
            adminService.updateUserRole(1L, "UNKNOWN")
        );
    }

    @Test
    void testDeleteUser_Success() {
        when(userRepo.existsById(1L)).thenReturn(true);
        
        adminService.deleteUser(1L);
        
        verify(userRepo).deleteById(1L);
    }

    @Test
    void testDeleteUser_NotFound_ThrowsException() {
        when(userRepo.existsById(1L)).thenReturn(false);
        
        assertThrows(RuntimeException.class, () -> 
            adminService.deleteUser(1L)
        );
    }

    @Test
    void testGetSystemStats() {
        when(userRepo.count()).thenReturn(10L);
        when(paperRepo.count()).thenReturn(5L);

        Map<String, Long> stats = adminService.getSystemStats();

        assertEquals(10L, stats.get("totalUsers"));
        assertEquals(5L, stats.get("totalPapers"));
    }
}
