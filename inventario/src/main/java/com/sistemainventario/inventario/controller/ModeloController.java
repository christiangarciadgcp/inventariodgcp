package com.sistemainventario.inventario.controller;

import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.model.Modelo;
import com.sistemainventario.inventario.service.ModeloService;

import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/modelos") 
@CrossOrigin(origins = "*")
public class ModeloController {

    private final ModeloService modeloService;

    public ModeloController(ModeloService modeloService){
        this.modeloService = modeloService;
    }

    @GetMapping
    public List<Modelo> listarModelos(){
        return modeloService.listarModelos();
    }

    @GetMapping("/activas")
    public List<Modelo> listarModelosActivos(){
        return modeloService.listarModelosActivos();
    }

    @PostMapping
    public Modelo guardarModelo(@RequestBody Modelo modelo){
        return modeloService.guardarModelo(modelo);
    }

    @PutMapping("/{id}")
    public Modelo actualizarModelo(@PathVariable Integer id, @RequestBody Modelo modelo){
        return modeloService.actualizarModelo(id, modelo);
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarModelo(@PathVariable Integer id){
        modeloService.desactivarModelo(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarModelo(@PathVariable Integer id){
        modeloService.activarModelo(id);
        return ResponseEntity.ok().build();
    }




}
