package com.sistemainventario.inventario.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Intercepta todas las RuntimeException
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        
        //Se captura el  mensaje del `throw new RuntimeException("...")`
        errorResponse.put("mensaje", ex.getMessage());
        errorResponse.put("tipo", "Error");

        // Devolvemos un 400 BAD REQUEST en lugar de 500
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

}