package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Bodega;
import com.sistemainventario.inventario.service.BodegaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/bodegas") 
@CrossOrigin(origins = "*")
public class BodegaController {

    private final BodegaService bodegaService;

    public BodegaController(BodegaService bodegaService) {
        this.bodegaService = bodegaService;
    }

    @GetMapping
    public List<Bodega> listarBodegas() {
        return bodegaService.listarBodegas();
    }

    @GetMapping("/activas")
    public List<Bodega> listarBodegasActivas() {
        return bodegaService.listarBodegasActivas();
    }

    @PostMapping
    public Bodega guardarBodega(@RequestBody Bodega bodega){
        return bodegaService.guardarBodega(bodega);
    }

    @PutMapping("/{id}")
    public Bodega actualizarBodega(@PathVariable Integer id, @RequestBody Bodega bodega) {
        
        return bodegaService.actualizarBodega(id, bodega);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivarBodega(@PathVariable Integer id){
        bodegaService.desactivarBodega(id);
        return ResponseEntity.noContent().build();
    }

    // Reactivar
    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarBodega(@PathVariable Integer id){
        bodegaService.activarBodega(id);
        return ResponseEntity.ok().build();
    }
}
