package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.InventarioRepository;
import com.sistemainventario.inventario.repository.ProductoRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    //INICIALIZACION DE LLAMADA A REPOSITORIO
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final InventarioRepository inventarioRepository;

    //CONSTRUCTOR
    public ProductoService(ProductoRepository productoRepository, BodegaRepository bodegaRepository,InventarioRepository inventarioRepository){
        this.productoRepository = productoRepository;
        this.bodegaRepository = bodegaRepository;
        this.inventarioRepository = inventarioRepository;
    }

    public List<Producto> listarProductos(){
        return productoRepository.findAll(Sort.by(Sort.Direction.ASC, "idProducto"));
        // return productoRepository.findAll(Sort.by(Sort.Direction.ASC, "categoria.idCategoria"));
        // return productoRepository.findAll();
    }

    public List<Producto> listarProductosActivos(){
        return productoRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "categoria.idCategoria"));
        // return productoRepository.findByActivoTrue();
    }

    public Optional<Producto> buscarProductoPorId(Integer id){
        return productoRepository.findById(id);
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreproductoContainingIgnoreCase(nombre);
    }

    @Transactional
    public Producto guardarProducto(Producto producto){
        boolean nuevoProducto = (producto.getIdProducto() == null);

        // Validaciones
        if (nuevoProducto) {
            Optional<Producto> existente = productoRepository.findByskuproducto(producto.getSkuproducto());
            if (existente.isPresent()) {
                throw new RuntimeException("Ya existe un producto con el SKU " + producto.getSkuproducto());
            }
            // Aseguramos que nazca activo
            producto.setActivo(true);
        }

        Producto productoGuardado = productoRepository.save(producto);

        //LOGICA DE INVENTARIO AUTOMÁTICO
        if (nuevoProducto) {
            List<Bodega> bodegas = bodegaRepository.findAll();
            List<Inventario> inventariosIniciales = new ArrayList<>();

            for (Bodega bodega : bodegas) {
                Inventario inventario = new Inventario();

                // Configurar Clave Compuesta
                InventarioId id = new InventarioId();
                id.setIdProducto(productoGuardado.getIdProducto());
                id.setIdBodega(bodega.getIdBodega());
                inventario.setId(id);

                // Relaciones
                inventario.setProducto(productoGuardado);
                inventario.setBodega(bodega);
                inventario.setCantidad_actual(0); // STOCK INICIAL 0

                inventariosIniciales.add(inventario);
            }

            // Guardamos todos los registros de inventario de golpe
            if (!inventariosIniciales.isEmpty()) {
                inventarioRepository.saveAll(inventariosIniciales);
            }
        }

        return productoGuardado;


    }

    @Transactional
    public Producto actualizarProducto(Integer id, ProductoRegistroDTO productoRegistroDTO, Categoria categoria, Proveedor proveedor, UnidadMedida unidadMedida, Marca marca, Modelo modelo){

        Producto productoActual = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));


        if(!productoActual.getSkuproducto().equals(productoRegistroDTO.skuproducto)){
            Optional<Producto> skuExistente = productoRepository.findByskuproducto(productoRegistroDTO.skuproducto);
            if(skuExistente.isPresent()){
                throw new RuntimeException("Ya existe otro producto con ese SKU " + productoRegistroDTO.skuproducto);
            }
        }

        productoActual.setNombreproducto(productoRegistroDTO.nombreproducto);
        productoActual.setSkuproducto(productoRegistroDTO.skuproducto);
        productoActual.setDescripcionproducto(productoRegistroDTO.descripcionproducto);
        productoActual.setSerieproducto(productoRegistroDTO.serieproducto);
        productoActual.setInventarioproducto(productoRegistroDTO.inventarioproducto);
        productoActual.setPreciocostoproducto(productoRegistroDTO.preciocostoproducto);

        productoActual.setCategoria(categoria);
        productoActual.setProveedor(proveedor);
        productoActual.setUnidadMedida(unidadMedida);
        productoActual.setMarca(marca);
        productoActual.setModelo(modelo);

        return productoRepository.save(productoActual);

    }

    @Transactional
    public void desactivarProducto(Integer id){
        boolean tieneStock = inventarioRepository.verificarStock(id, 0);
        
        if (tieneStock) {
            throw new RuntimeException("No se puede desactivar el producto porque tiene existencias en inventarios.");
        }

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setActivo(false);
        productoRepository.save(producto);
        
    }

    @Transactional
    public void activarProducto(Integer id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setActivo(true);
        productoRepository.save(producto);
    }
}