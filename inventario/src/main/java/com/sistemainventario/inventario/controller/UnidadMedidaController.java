package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.UnidadMedida;
import com.sistemainventario.inventario.service.UnidadMedidaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


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
}