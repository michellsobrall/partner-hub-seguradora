package com.partnerhub.dto.portal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerAlertDto {
    private String id;
    private String severity; // WARNING, DANGER, SUCCESS, INFO
    private String title;
    private String message;
    private String deadlineLabel;
    private String actionType; // UPLOAD_NFSE, VIEW_STATEMENT, NONE
}

