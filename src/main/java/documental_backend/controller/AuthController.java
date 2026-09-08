package documental_backend.controller;

import documental_backend.dto.*;
import documental_backend.security.SecurityUtils;
import documental_backend.security.UserPrincipal;
import documental_backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Signup, login, and current user profile")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "Create a new user account")
    public ResponseEntity<ApiResponse<AuthResponseDto>> signup(@Valid @RequestBody SignupRequestDto request) {
        AuthResponseDto data = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<AuthResponseDto>builder()
                        .success(true)
                        .message("Account created successfully")
                        .data(data)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive a JWT")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto data = authService.login(request);
        return ResponseEntity.ok(
                ApiResponse.<AuthResponseDto>builder()
                        .success(true)
                        .message("Login successful")
                        .data(data)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponseDto>> me() {
        UserPrincipal principal = SecurityUtils.currentUser();
        UserResponseDto data = authService.me(principal);
        return ResponseEntity.ok(
                ApiResponse.<UserResponseDto>builder()
                        .success(true)
                        .message(null)
                        .data(data)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
