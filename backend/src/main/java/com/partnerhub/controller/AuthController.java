package com.partnerhub.controller;

import com.partnerhub.dto.auth.AuthResponseDto;
import com.partnerhub.dto.auth.DemoAccountDto;
import com.partnerhub.dto.auth.LoginRequestDto;
import com.partnerhub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponseDto> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Usuário não autenticado.");
        }
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @GetMapping("/demo-accounts")
    public ResponseEntity<List<DemoAccountDto>> getDemoAccounts() {
        return ResponseEntity.ok(authService.getDemoAccounts());
    }
}

