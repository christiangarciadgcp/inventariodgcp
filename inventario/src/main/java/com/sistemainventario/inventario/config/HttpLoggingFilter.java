package com.sistemainventario.inventario.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class HttpLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("HTTP_ACCESS");

    // Colores ANSI para la terminal de macOS
    private static final String RESET = "\u001B[0m";
    private static final String GREEN = "\u001B[32m";
    private static final String YELLOW = "\u001B[33m";
    private static final String RED = "\u001B[31m";
    private static final String CYAN = "\u001B[36m";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Ignorar peticiones preflight CORS de Angular para mantener limpia la consola
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        long inicio = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duracion = System.currentTimeMillis() - inicio;
            int status = response.getStatus();
            String metodo = String.format("%-6s", request.getMethod());
            String uri = request.getRequestURI();
            String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";

            String colorStatus = status >= 500 ? RED : (status >= 400 ? YELLOW : GREEN);

            log.info("{}{}{} {}{} -> {}{}{} ({} ms)",
                    CYAN, metodo, RESET,
                    uri, query,
                    colorStatus, status, RESET,
                    duracion);
        }
    }
}
