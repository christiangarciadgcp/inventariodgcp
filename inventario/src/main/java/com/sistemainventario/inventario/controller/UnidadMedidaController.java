package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.UnidadMedida;
import com.sistemainventario.inventario.service.UnidadMedidaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController 
@RequestMapping("/api/unidades") 
public class UnidadMedidaController {

    private final UnidadMedidaService unidadMedidaService;

    public UnidadMedidaController(UnidadMedidaService unidadMedidaService) {
        this.unidadMedidaService = unidadMedidaService;
    }

    @GetMapping
    public List<UnidadMedida> listarUnidadesMedidas() {
        return unidadMedidaService.listarUnidadesMedidas();
    }

    @GetMapping("/activas")
    public List<UnidadMedida> listarUnidadesMedidasActivas(){
        return unidadMedidaService.listarUnidadMedidasActivas();
    }

    @PostMapping
    public UnidadMedida guardarUnidadMedida(@RequestBody UnidadMedida unidadMedida) {
        return unidadMedidaService.guardarUnidadMedida(unidadMedida);
    }

    @PutMapping("/{id}")
    public UnidadMedida actualizarUnidadMedida(@PathVariable Integer id, @RequestBody UnidadMedida unidadMedida) {  
        return unidadMedidaService.actualizarUnidadMedida(id, unidadMedida);
    }

    @DeleteMapping("/{id}")
    public void eliminarUnidadMedida(@PathVariable Integer id) {
        unidadMedidaService.eliminarUnidadMedida(id);
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarUnidadMedida(@PathVariable Integer id){
        unidadMedidaService.desactivarUnidadMedida(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarUnidadMedida(@PathVariable Integer id){
        unidadMedidaService.activarUnidadMedida(id);
        return ResponseEntity.ok().build();
    }
}