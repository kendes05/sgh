package com.unifor.br.screening_service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class ScreeningServiceApplicationTests {

    @Test
    void applicationClassIsInstantiable() {
        assertDoesNotThrow(() -> ScreeningServiceApplication.class.getDeclaredConstructor().newInstance());
    }
}
