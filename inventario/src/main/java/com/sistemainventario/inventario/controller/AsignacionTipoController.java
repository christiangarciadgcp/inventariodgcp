package com.sistemainventario.inventario.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.sistemainventario.inventario.model.AsignacionTipo;
import com.sistemainventario.inventario.service.AsignacionTipoService;
import java.util.List;

@RestController
@RequestMapping("/api/tipoasignacion")
@CrossOrigin(origins = "*")
public class AsignacionTipoController {

    private final AsignacionTipoService asignacionTipoService;

    public AsignacionTipoController(AsignacionTipoService asignacionTipoService){
        this.asignacionTipoService = asignacionTipoService;
    }

    @GetMapping
    public List<AsignacionTipo> listarTodos(){
        return asignacionTipoService.listarTodos();
    }

    @GetMapping("/activos")
    public List<AsignacionTipo> listarActivos(){
        return asignacionTipoService.listarActivos();
    }

    @PostMapping
    public ResponseEntity<AsignacionTipo> guardarTipoAsignacion(@RequestBody AsignacionTipo asignacionTipo){
        return ResponseEntity.ok(asignacionTipoService.guardarAsignacionTipo(asignacionTipo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AsignacionTipo> actualizarTipoAsignacion(@PathVariable Integer id, @RequestBody AsignacionTipo asignacionTipo){
        return ResponseEntity.ok(asignacionTipoService.actualizarAsignacionTipo(id, asignacionTipo));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(@PathVariable Integer id, @RequestParam Boolean activo){
        asignacionTipoService.cambiarEstado(id, activo);
        return ResponseEntity.ok().build();
    }
        

    
    

}
