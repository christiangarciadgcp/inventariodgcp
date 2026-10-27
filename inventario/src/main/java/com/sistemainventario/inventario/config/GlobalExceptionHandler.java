package com.sistemainventario.inventario.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Captura el valor que ya existe: Key (...)=(VALOR) already exists.
    private static final Pattern DUPLICATE_PATTERN = 
            Pattern.compile("Key \\(.*\\)=\\((.*?)\\) already exists", Pattern.CASE_INSENSITIVE);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        String causa = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String mensajeUsuario = "Ya existe un registro con estos datos en el sistema.";

        Matcher matcher = DUPLICATE_PATTERN.matcher(causa);
        if (matcher.find()) {
            String valor = matcher.group(1).trim();
            mensajeUsuario = String.format("Ya existe un registro con este elemento %s.", valor);
        } else if (causa.toLowerCase().contains("foreign key") || causa.toLowerCase().contains("violates foreign key")) {
            mensajeUsuario = "No se puede eliminar o modificar el registro porque está siendo utilizado en otros módulos.";
        }

        errorResponse.put("mensaje", mensajeUsuario);
        errorResponse.put("tipo", "Advertencia");

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("mensaje", ex.getMessage());
        errorResponse.put("tipo", "Error");

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
