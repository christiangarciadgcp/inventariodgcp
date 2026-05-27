package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Categoria;
import com.sistemainventario.inventario.service.CategoriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/categorias") 
@CrossOrigin(origins = "*") 
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    public List<Categoria> listarCategorias() {
        return categoriaService.listarCategorias();
    }

    @GetMapping("/activas")
    public List<Categoria> listaCategoriasActivas(){
        return categoriaService.listarCategoriasActivas();
    }

    @PostMapping
    public Categoria guardarCategoria(@RequestBody Categoria categoria) {
        // @RequestBody convierte el JSON que se envía a un objeto Java
        return categoriaService.guardarCategoria(categoria);
    }

    @PutMapping("/{id}")
    public Categoria actualizarCategoria(@PathVariable Integer id, @RequestBody Categoria categoria) {
        
        return categoriaService.actualizarCategoria(id, categoria);
    }

    @DeleteMapping("/{id}")
    public void eliminarCategoria(@PathVariable Integer id) {
        categoriaService.eliminarCategoria(id);
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarCategoria(@PathVariable Integer id){
        categoriaService.desactivarCategoria(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarCategoria(@PathVariable Integer id){
        categoriaService.activarCategoria(id);
        return ResponseEntity.ok().build();
    }

}
