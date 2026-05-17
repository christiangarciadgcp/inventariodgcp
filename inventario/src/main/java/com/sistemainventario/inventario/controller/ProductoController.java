package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.service.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/productos") 
@CrossOrigin(origins = "*")
public class ProductoController {

    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;
    private final UnidadMedidaService unidadMedidaService;
    private final MarcaService marcaService;
    private final ModeloService modeloService;

    public ProductoController(ProductoService productoService,
                              CategoriaService categoriaService,
                              ProveedorService proveedorService,
                              UnidadMedidaService unidadMedidaService,
                              MarcaService marcaService,
                              ModeloService modeloService) {
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.proveedorService = proveedorService;
        this.unidadMedidaService = unidadMedidaService;
        this.marcaService = marcaService;
        this.modeloService = modeloService;
    }

    @GetMapping
    public List<Producto>listarProductos(){
        return productoService.listarProductos();
    }

    @GetMapping("/activos")
    public List<Producto>listarProductosActivos(){
        return productoService.listarProductosActivos();
    }

    @GetMapping("/{id}")
    public Optional<Producto> buscarProductoPorId(@PathVariable Integer id){
        return productoService.buscarProductoPorId(id);
    }

    @GetMapping("/buscar")
    public List<Producto> buscarProductos(@RequestParam String nombre) {
        return productoService.buscarPorNombre(nombre);
    }

    @PostMapping
    public Producto guardarProducto(@RequestBody ProductoRegistroDTO productoDTO){

        Categoria categoria = categoriaService.obtenerCategoriaPorId(productoDTO.idCategoria)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

/*         Proveedor proveedor = proveedorService.obtenerProveedorPorId(productoDTO.idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado")); */

        Proveedor proveedor = null;
        if (productoDTO.getIdProveedor() != null) {
            proveedor = proveedorService.obtenerProveedorPorId(productoDTO.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        UnidadMedida unidadMedida = unidadMedidaService.obtenerUnidadMedidaPorId(productoDTO.idUnidadMedida)
                .orElseThrow(() -> new RuntimeException("Unidad medida no encontrada"));

        Marca marca = marcaService.obtenerMarcaPorId(productoDTO.idMarca)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        Modelo modelo = modeloService.obtenerModeloPorId(productoDTO.idModelo)
                .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        //SE CREA EL OBJETO PRODUCTO
        Producto producto = new Producto();
        producto.setIdProducto(productoDTO.idProducto);
        producto.setNombreproducto(productoDTO.nombreproducto);
        producto.setSkuproducto(productoDTO.skuproducto);
        producto.setDescripcionproducto(productoDTO.descripcionproducto);
        producto.setSerieproducto(productoDTO.serieproducto);
        producto.setInventarioproducto(productoDTO.inventarioproducto);
        producto.setPreciocostoproducto(productoDTO.preciocostoproducto);
        producto.setPrecioventaproducto(productoDTO.precioventaproducto);

        producto.setCategoria(categoria);
        producto.setProveedor(proveedor);
        producto.setUnidadMedida(unidadMedida);
        producto.setMarca(marca);
        producto.setModelo(modelo);

        return productoService.guardarProducto(producto);
    }

    @PutMapping("/{id}")
    public Producto actualizaProducto(@PathVariable Integer id, @RequestBody ProductoRegistroDTO productoDTO) {

        Categoria categoria = categoriaService.obtenerCategoriaPorId(productoDTO.idCategoria)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

/*         Proveedor proveedor = proveedorService.obtenerProveedorPorId(productoDTO.idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado")); */

        Proveedor proveedor = null;
        if (productoDTO.getIdProveedor() != null) {
            proveedor = proveedorService.obtenerProveedorPorId(productoDTO.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        UnidadMedida unidadMedida = unidadMedidaService.obtenerUnidadMedidaPorId(productoDTO.idUnidadMedida)
                .orElseThrow(() -> new RuntimeException("Unidad medida no encontrada"));

        Marca marca = marcaService.obtenerMarcaPorId(productoDTO.idMarca)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        Modelo modelo = modeloService.obtenerModeloPorId(productoDTO.idModelo)
                .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        
        return productoService.actualizarProducto(id, productoDTO, categoria, proveedor, unidadMedida, marca, modelo);
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

}
