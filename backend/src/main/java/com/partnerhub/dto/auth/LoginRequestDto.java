package com.partnerhub.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {

    @NotBlank(message = "O e-mail de acesso é obrigatório.")
    @Email(message = "Informe um endereço de e-mail válido.")
    private String email;

    @NotBlank(message = "A senha é obrigatória.")
    private String password;
}

