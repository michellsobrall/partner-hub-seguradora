package com.partnerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PartnerHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(PartnerHubApplication.class, args);
    }
}
