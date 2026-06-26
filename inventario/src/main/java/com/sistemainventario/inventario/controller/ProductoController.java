package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.service.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/productos") 
@CrossOrigin(origins = "*")
public class ProductoController {

    private final ProductoService productoService;
    private final ProductoExcelService productoExcelService;

    public ProductoController(ProductoService productoService, ProductoExcelService productoExcelService) {
        this.productoService = productoService;
        this.productoExcelService = productoExcelService;

    }

    @GetMapping
    public List<Producto>listarProductos(){
        return productoService.listarProductos();
    }

    @GetMapping("/activos")
    public List<Producto>listarProductosActivos(){
        return productoService.listarProductosActivos();
    }

    @GetMapping("/genericos")
    public List<Producto>listarProductosGenericos(){
        return productoService.listarProductosGenericos();
    }

    @GetMapping("/{id}")
    public Optional<Producto> buscarProductoPorId(@PathVariable Integer id){
        return productoService.buscarProductoPorId(id);
    }

    @GetMapping("/buscar")
    public List<Producto> buscarProductos(@RequestParam String nombre) {
        return productoService.buscarPorNombre(nombre);
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public Producto guardarProducto(
            @RequestPart("producto") ProductoRegistroDTO productoDTO,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes) {
        return productoService.guardarProducto(productoDTO, imagenes);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public Producto actualizaProducto(
            @PathVariable Integer id, 
            @RequestPart("producto") ProductoRegistroDTO productoDTO,
            @RequestPart(value = "imagenes", required = false) MultipartFile[] imagenes) {
        return productoService.actualizarProducto(id, productoDTO, imagenes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivarProducto(@PathVariable Integer id) {
        productoService.desactivarProducto(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activar")
    public ResponseEntity<Void> activarProducto(@PathVariable Integer id) {
        productoService.activarProducto(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/imagen/{idImagen}")
    public ResponseEntity<Void> eliminarImagenProducto(@PathVariable Integer idImagen) {
        productoService.eliminarImagenPorId(idImagen);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/carga-masiva")
    public ResponseEntity<?> cargaMasiva(@RequestParam("file") MultipartFile file) {
        try {
            List<com.sistemainventario.inventario.model.Producto> guardados = productoExcelService.procesarCargaMasiva(file);
            
            // Retornamos un mapa estructurado con la cantidad real procesada
            return ResponseEntity.ok().body(java.util.Map.of(
                "mensaje", "Carga masiva completada con éxito",
                "cantidad", guardados.size()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "mensaje", e.getMessage()
            ));
        }
    }

}
