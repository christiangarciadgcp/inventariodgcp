package com.sistemainventario.inventario.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.dto.productoDTO.ProductoSugerenciaRegistroDTO;
import com.sistemainventario.inventario.model.ProductoSugerencia;
import com.sistemainventario.inventario.service.ProductoSugerenciaService;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/sugerencias") 
@CrossOrigin(origins = "*")
public class ProductoSugerenciaController {

    private final ProductoSugerenciaService productoSugerenciaService;

    public ProductoSugerenciaController(ProductoSugerenciaService productoSugerenciaService){
        this.productoSugerenciaService = productoSugerenciaService;
    }

    @GetMapping
    public List<ProductoSugerencia> listarProductosSugeridos() {
        return productoSugerenciaService.listarProductosSugeridos();
    }

    @GetMapping("/usuario/{idUsuario}")
    public List<ProductoSugerencia> listarProductosSugeridosPorUsuario(@PathVariable Integer idUsuario) {
        return productoSugerenciaService.listarProductosSugeridosPorUsuario(idUsuario);
    }

    @PostMapping
    public ProductoSugerencia crearSugerencia(@RequestBody ProductoSugerenciaRegistroDTO dto){
        return productoSugerenciaService.crearSugerencia(dto);
    }

    @PutMapping("/{id}/estado")
    public ProductoSugerencia cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> payload) {

        String nuevoEstado = payload.get("estado");
        String comentario = payload.get("comentario");

        return productoSugerenciaService.cambiarEstado(id, nuevoEstado, comentario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSugerencia(@PathVariable Integer id) {
        productoSugerenciaService.eliminarSugerencia(id);
        return ResponseEntity.noContent().build();
    }

      
    

}
