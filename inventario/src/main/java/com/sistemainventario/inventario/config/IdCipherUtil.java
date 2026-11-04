package com.sistemainventario.inventario.config;

import java.nio.ByteBuffer;
import java.util.Base64;

public class IdCipherUtil {

    // Clave secreta y máscara fija (deben coincidir exactamente con Angular)
    private static final String SECRET_KEY = "UTDI_INV_2026_SECRET_KEY";
    private static final int MASK = 0x5A39C7E1;

    public static String encode(int id) {
        int sig = calcularFirma(id);
        int obfuscatedId = id ^ sig ^ MASK;

        byte[] bytes = ByteBuffer.allocate(8)
                .putInt(obfuscatedId)
                .putInt(sig)
                .array();

        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static Integer decode(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        // Si ya es un número directo (ej. pruebas en Swagger o consola), lo acepta
        if (token.matches("^\\d+$")) {
            return Integer.parseInt(token);
        }

        try {
            byte[] bytes = Base64.getUrlDecoder().decode(token.trim());
            if (bytes.length != 8) {
                throw new IllegalArgumentException("Longitud de token inválida");
            }

            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            int obfuscatedId = buffer.getInt();
            int sig = buffer.getInt();

            int id = obfuscatedId ^ sig ^ MASK;
            int expectedSig = calcularFirma(id);

            // Valida que el token no haya sido alterado en la URL
            if (sig != expectedSig || id < 0) {
                throw new IllegalArgumentException("Firma de ID inválida");
            }

            return id;
        } catch (Exception e) {
            throw new IllegalArgumentException("Identificador inválido: " + token);
        }
    }

    private static int calcularFirma(int id) {
        String str = id + ":" + SECRET_KEY;
        int hash = 0x811c9dc5;
        for (int i = 0; i < str.length(); i++) {
            hash ^= str.charAt(i);
            hash *= 0x01000193; // Algoritmo FNV-1a 32-bit
        }
        return hash;
    }
}
