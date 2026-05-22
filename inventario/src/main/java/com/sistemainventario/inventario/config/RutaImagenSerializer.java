package com.sistemainventario.inventario.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RutaImagenSerializer extends JsonSerializer<String> {

    private static String baseUrl;

    // Inyección del properties a un campo estático para uso de Jackson
    @Value("${storage.base-url}")
    public void setBaseUrl(String baseUrl) {
        RutaImagenSerializer.baseUrl = baseUrl;
    }

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value != null && !value.startsWith("http")) {
            // Si el valor guardado es solo el nombre del archivo, le anexamos el prefijo configurado
            gen.writeString(baseUrl + value);
        } else {
            gen.writeString(value);
        }
    }
}