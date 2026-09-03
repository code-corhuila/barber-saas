package com.barbersaas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BarberSaasApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarberSaasApplication.class, args);
    }
}