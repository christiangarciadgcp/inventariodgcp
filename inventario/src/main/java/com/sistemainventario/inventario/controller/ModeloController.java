package com.sistemainventario.inventario.controller;

import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.dto.modeloDTO.ModeloDTO;
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

    @GetMapping("/por-marca/{idMarca}")
    public List<Modelo> listarModelosPorMarca(@PathVariable Integer idMarca){
        return modeloService.listarModelosPorMarca(idMarca);
    }

    @PostMapping
    public Modelo guardarModelo(@RequestBody ModeloDTO modeloDTO){
        return modeloService.guardarModelo(modeloDTO);
    }

    @PutMapping("/{id}")
    public Modelo actualizarModelo(@PathVariable Integer id, @RequestBody ModeloDTO modeloDTO){
        return modeloService.actualizarModelo(id, modeloDTO);
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
