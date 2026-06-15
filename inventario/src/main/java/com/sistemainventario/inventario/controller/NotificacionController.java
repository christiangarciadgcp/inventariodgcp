package com.sistemainventario.inventario.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.service.NotificacionService;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService){
        this.notificacionService = notificacionService;
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<Map<String, Object>> obtenerNotificaciones(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(notificacionService.obtenerNotificacionesUsuario(idUsuario));
    }

    @PutMapping("/usuario/{idUsuario}/marcar-leidas")
    public ResponseEntity<Void> marcarLeidas(@PathVariable Integer idUsuario) {
        notificacionService.marcarComoLeidas(idUsuario);
        return ResponseEntity.ok().build();
    }

}
