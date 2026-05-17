package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.security.JwtService;
import com.sistemainventario.inventario.service.UsuarioService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UsuarioService usuarioService;

    public AuthController(AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
            JwtService jwtService, UsuarioService usuarioService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {

        try {
            // 1. Cargamos al usuario usando UserDetailsService para evaluar sus propiedades
            // Esto lanzará UsernameNotFoundException si el usuario no existe.
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getNombreusuario());

            // 2. Evaluamos explícitamente si la cuenta está habilitada (esto viene de tu
            // isEnabled)
            if (!userDetails.isEnabled()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("mensaje", "La cuenta de usuario está desactivada.");
                errorResponse.put("error", "User Disabled");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // 3. Si existe y está activo, procedemos a autenticar (verificar contraseña)
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getNombreusuario(), request.getPasswordusuario()));

            // 4. Obtenemos el usuario completo para los datos extra (Rol, Id)
            Usuario usuarioCompleto = usuarioService.buscarPorNombreDeUsuario(request.getNombreusuario())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado en base de datos"));

            String ipAddress = httpServletRequest.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = httpServletRequest.getRemoteAddr();
            }

            // 5. Registrar la conexión enviando el ID y la IP
            usuarioService.registrarIp(usuarioCompleto.getIdUsuario(), ipAddress);

            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("idUsuario", usuarioCompleto.getIdUsuario());

            if (usuarioCompleto.getRol() != null) {
                extraClaims.put("rol", usuarioCompleto.getRol().getNombrerol());
            }

            // Pasamos userDetails (el objeto de Spring Security) para generar el token
            String token = jwtService.generateToken(extraClaims, userDetails);

            return ResponseEntity.ok(new AuthResponse(token));

        } catch (UsernameNotFoundException e) {
            // Manejamos el caso donde el usuario no existe
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("mensaje", "Usuario o contraseña incorrectos"); // Mensaje genérico por seguridad
            errorResponse.put("error", "Not Found");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);

        } catch (BadCredentialsException e) {
            // Manejamos contraseña incorrecta (o usuario inexistente si authenticate lo
            // lanza)
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("mensaje", "Usuario o contraseña incorrectos");
            errorResponse.put("error", "Bad Credentials");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("mensaje", "Error interno del servidor");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String token) {
        try {
            // 1. Limpiamos el prefijo "Bearer "
            String jwt = token.substring(7);

            // 2. Extraemos el usuario del token
            String nombreUsuario = jwtService.extractUsername(jwt);

            // 3. Cargamos los detalles del usuario para verificar validez
            UserDetails userDetails = userDetailsService.loadUserByUsername(nombreUsuario);

            // 4. Verificamos que el token sea válido (y no haya expirado totalmente aún)
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 5. Obtenemos datos extra (Rol, ID) para meterlos al nuevo token
                Usuario usuarioCompleto = usuarioService.buscarPorNombreDeUsuario(nombreUsuario).get();
                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("idUsuario", usuarioCompleto.getIdUsuario());
                if (usuarioCompleto.getRol() != null) {
                    extraClaims.put("rol", usuarioCompleto.getRol().getNombrerol());
                }

                // 6. Generamos el NUEVO token (por 1 hora más)
                String newToken = jwtService.generateToken(extraClaims, userDetails);

                return ResponseEntity.ok(new AuthResponse(newToken));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error renovando sesión");
        }
    }

    @Data
    public static class LoginRequest {
        private String nombreusuario;
        private String passwordusuario;
    }

    @Data
    public static class AuthResponse {
        private String token;

        public AuthResponse(String token) {
            this.token = token;
        }
    }
}