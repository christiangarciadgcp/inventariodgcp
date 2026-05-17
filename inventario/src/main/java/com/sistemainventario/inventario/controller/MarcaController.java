package com.sistemainventario.inventario.controller;

import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.model.Marca;
import com.sistemainventario.inventario.service.MarcaService;
import org.springframework.http.ResponseEntity;
import java.util.List;


@RestController
@RequestMapping("/api/marcas") 
@CrossOrigin(origins = "*")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService){
        this.marcaService = marcaService;

    }

    @GetMapping
    public List<Marca> listarMarcas() {
        return marcaService.listarMarcas();
    }

    @GetMapping("/activas")
    public List<Marca> listarMarcasActivas(){
        return marcaService.listarMarcasActivas();
    }

    @PostMapping
    public Marca guardarMarca(@RequestBody Marca marca){
        return marcaService.guardarMarca(marca);
    }

    @PutMapping("/{id}")
    public Marca actualizarMarca(@PathVariable Integer id, @RequestBody Marca marca){
        return marcaService.actualizarMarca(id, marca);
    }

    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarMarca(@PathVariable Integer id){
        marcaService.desactivarMarca(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarMarca(@PathVariable Integer id){
        marcaService.activarMarca(id);
        return ResponseEntity.ok().build();
    }
    

}
