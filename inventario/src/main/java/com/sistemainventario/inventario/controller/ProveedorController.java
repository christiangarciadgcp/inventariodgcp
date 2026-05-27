package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Proveedor;
import com.sistemainventario.inventario.service.ProveedorService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/api/proveedores") 
@CrossOrigin(origins = "*")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    public List<Proveedor> listarProveedores() {
        return proveedorService.listarProveedores();
    }

    @GetMapping("/activos")
    public List<Proveedor> ListarProveedoresActivos() {
        return proveedorService.listaProveedoresActivos();
    }
    
    @PostMapping
    public Proveedor guardarProveedor(@RequestBody Proveedor proveedor) {
        return  proveedorService.guardarProveedor(proveedor);
    }

    @PutMapping("/{id}")
    public Proveedor actualizaProveedor(@PathVariable Integer id, @RequestBody Proveedor proveedor) {

        return proveedorService.actualizaProveedor(id, proveedor);
    }

    @DeleteMapping("/{id}")
    public void eliminarProveedor(@PathVariable Integer id) {
        proveedorService.eliminarProveedor(id);
    }

    
    @PutMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarProveedor(@PathVariable Integer id){
        proveedorService.desactivarProveedor(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarProveedor(@PathVariable Integer id){
        proveedorService.activarProveedor(id);
        return ResponseEntity.ok().build();
    }

}
