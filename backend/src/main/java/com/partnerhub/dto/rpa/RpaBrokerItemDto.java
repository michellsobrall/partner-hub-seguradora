package com.partnerhub.dto.rpa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpaBrokerItemDto {
    private String personType;
    private String name;
    private String tradeName;
    private String documentNumber;
    private String email;
    private String phone;
    private String susepCode;
    private String bankCode;
    private String bankName;
    private String agency;
    private String accountNumber;
    private String pixKeyType;
    private String pixKey;
}

