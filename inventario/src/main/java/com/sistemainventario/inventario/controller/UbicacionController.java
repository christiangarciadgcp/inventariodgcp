package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Ubicacion;
import com.sistemainventario.inventario.service.UbicacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ubicaciones")
@CrossOrigin(origins = "*")
public class UbicacionController {

    private final UbicacionService ubicacionService;

    public UbicacionController(UbicacionService ubicacionService) {
        this.ubicacionService = ubicacionService;
    }

    @GetMapping
    public List<Ubicacion> listarUbicaciones() {
        return ubicacionService.listarUbicaciones();
    }

    @GetMapping("/activas")
    public ResponseEntity<List<Ubicacion>> listarUbicacionesActivas() {
        return ResponseEntity.ok(ubicacionService.listarUbicacionesActivas());
    }

    @PostMapping
    public ResponseEntity<Ubicacion> guardarUbicacion(@RequestBody Ubicacion ubicacion) {
        return ResponseEntity.ok(ubicacionService.guardarUbicacion(ubicacion));
    }

    @PutMapping("/{id}")
    public Ubicacion actualizaUbicacion(@PathVariable Integer id, @RequestBody Ubicacion ubicacion) {

        return ubicacionService.actualizarUbicacion(id, ubicacion);
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarUbicacion(@PathVariable Integer id){
        ubicacionService.desactivarUbicacion(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarUbicacion(@PathVariable Integer id){
        ubicacionService.activarUbicacion(id);
        return ResponseEntity.ok().build();
    }

}