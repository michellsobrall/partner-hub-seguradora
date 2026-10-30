package com.partnerhub.security;

import com.partnerhub.domain.entity.AppUser;
import com.partnerhub.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    @Test
    void shouldGenerateAndValidateJwtTokenWithBrokerClaims() {
        JwtTokenProvider provider = new JwtTokenProvider(
                "supersecretpartnerhubtoken2026musthaveatleast256bitskeyhere",
                3600000L
        );

        UUID userId = UUID.randomUUID();
        UUID brokerId = UUID.randomUUID();
        AppUser user = AppUser.builder()
                .id(userId)
                .email("contato@primebeneficios.com.br")
                .fullName("Prime Corretora Ltda")
                .role(UserRole.BROKER)
                .brokerId(brokerId)
                .active(true)
                .build();

        String token = provider.generateToken(user);

        assertNotNull(token);
        assertTrue(provider.validateToken(token));

        Claims claims = provider.getClaims(token);
        assertEquals("contato@primebeneficios.com.br", claims.getSubject());
        assertEquals("BROKER", claims.get("role", String.class));
        assertEquals(brokerId.toString(), claims.get("brokerId", String.class));
    }
}

