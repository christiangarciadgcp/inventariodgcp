package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.CategoriaRepository;
import com.sistemainventario.inventario.repository.InventarioRepository;
import com.sistemainventario.inventario.repository.ModeloRepository;
import com.sistemainventario.inventario.repository.ProductoRepository;
import com.sistemainventario.inventario.repository.ProveedorRepository;
import com.sistemainventario.inventario.repository.UnidadMedidaRepository;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Value("${storage.location}")
    private String storageLocation;

    //INICIALIZACION DE LLAMADA A REPOSITORIO
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final InventarioRepository inventarioRepository;

    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final ModeloRepository modeloRepository;

    //CONSTRUCTOR
    public ProductoService(ProductoRepository productoRepository, 
                            BodegaRepository bodegaRepository,
                            InventarioRepository inventarioRepository,
                            CategoriaRepository categoriaRepository,
                            ProveedorRepository proveedorRepository,
                            UnidadMedidaRepository unidadMedidaRepository,
                            ModeloRepository modeloRepository){
        this.productoRepository = productoRepository;
        this.bodegaRepository = bodegaRepository;
        this.inventarioRepository = inventarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
        this.modeloRepository = modeloRepository;
    }

    public List<Producto> listarProductos(){
        return productoRepository.findAll(Sort.by(Sort.Direction.ASC, "idProducto"));
        // return productoRepository.findAll(Sort.by(Sort.Direction.ASC, "categoria.idCategoria"));
        // return productoRepository.findAll();
    }

    public List<Producto> listarProductosActivos(){
        return productoRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "idProducto"));
        // return productoRepository.findByActivoTrue();
    }

    public Optional<Producto> buscarProductoPorId(Integer id){
        return productoRepository.findById(id);
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreproductoContainingIgnoreCase(nombre);
    }

    @Transactional
    public Producto guardarProducto(ProductoRegistroDTO dto, MultipartFile[] imagenes){
        Optional<Producto> existente = productoRepository.findByskuproducto(dto.getSkuproducto());
        if (existente.isPresent()) {
            throw new RuntimeException("Ya existe un producto con el SKU: " + dto.getSkuproducto());
        }

        // Búsqueda de entidades 
        Categoria categoria = categoriaRepository.findById(dto.getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(dto.getIdUnidadMedida())
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));
        Modelo modelo = modeloRepository.findById(dto.getIdModelo())
                .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        Proveedor proveedor = null;
        if (dto.getIdProveedor() != null) {
            proveedor = proveedorRepository.findById(dto.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        Producto producto = new Producto();
        producto.setNombreproducto(dto.getNombreproducto());
        //producto.setSkuproducto(dto.getSkuproducto());
        producto.setDescripcionproducto(dto.getDescripcionproducto());
        producto.setSerieproducto(dto.getSerieproducto());
        producto.setInventarioproducto(dto.getInventarioproducto());
        producto.setPreciocostoproducto(dto.getPreciocostoproducto());
        producto.setPrecioventaproducto(dto.getPrecioventaproducto());
        producto.setActivo(true);

        // Mapeo de relaciones
        producto.setCategoria(categoria);
        producto.setUnidadMedida(unidadMedida);
        producto.setModelo(modelo);
        producto.setProveedor(proveedor);

        producto.setSkuproducto("TMP-" + java.util.UUID.randomUUID().toString().substring(0,8));

        Producto productoGuardado = productoRepository.save(producto);

        String sku = generarSku(productoGuardado);

        productoGuardado.setSkuproducto(sku);

        productoGuardado = productoRepository.save(productoGuardado);

        if (imagenes != null && imagenes.length > 0) {
            guardarImagenesFisicas(productoGuardado, imagenes);
        }

        // Lógica de inventario automático
        List<Bodega> bodegas = bodegaRepository.findAll();
        List<Inventario> inventariosIniciales = new ArrayList<>();

        for (Bodega bodega : bodegas) {
            Inventario inventario = new Inventario();
            InventarioId id = new InventarioId();
            id.setIdProducto(productoGuardado.getIdProducto());
            id.setIdBodega(bodega.getIdBodega());
            inventario.setId(id);

            inventario.setProducto(productoGuardado);
            inventario.setBodega(bodega);
            inventario.setCantidad_actual(0); 

            inventariosIniciales.add(inventario);
        }

        if (!inventariosIniciales.isEmpty()) {
            inventarioRepository.saveAll(inventariosIniciales);
        }

        return productoGuardado;
    }

    @Transactional
    public Producto actualizarProducto(Integer id, ProductoRegistroDTO dto, MultipartFile[] imagenes){
        Producto productoActual = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if(!productoActual.getSkuproducto().equals(dto.getSkuproducto())){
            Optional<Producto> skuExistente = productoRepository.findByskuproducto(dto.getSkuproducto());
            if(skuExistente.isPresent()){
                throw new RuntimeException("Ya existe un producto con el SKU: " + dto.getSkuproducto());
            }
        }

        Categoria categoria = categoriaRepository.findById(dto.getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(dto.getIdUnidadMedida())
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));
        Modelo modelo = modeloRepository.findById(dto.getIdModelo())
                .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));
        

        Proveedor proveedor = null;
        if (dto.getIdProveedor() != null) {
            proveedor = proveedorRepository.findById(dto.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        }

        productoActual.setNombreproducto(dto.getNombreproducto());
        productoActual.setSkuproducto(dto.getSkuproducto());
        productoActual.setDescripcionproducto(dto.getDescripcionproducto());
        productoActual.setSerieproducto(dto.getSerieproducto());
        productoActual.setInventarioproducto(dto.getInventarioproducto());
        productoActual.setPreciocostoproducto(dto.getPreciocostoproducto());
        productoActual.setPrecioventaproducto(dto.getPrecioventaproducto());

        productoActual.setCategoria(categoria);
        productoActual.setUnidadMedida(unidadMedida);
        productoActual.setModelo(modelo);
        productoActual.setProveedor(proveedor);

        if (imagenes != null && imagenes.length > 0) {
            guardarImagenesFisicas(productoActual, imagenes);
        }

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

    public String generarSku(Producto producto){
        String nombreCategoria = producto.getCategoria().getNombrecategoria();
        String nombreMarca = producto.getModelo().getMarca().getNombremarca();

        String prefijoCategoria = generarPrefijoCategoria(nombreCategoria);
        String prefijoMarca = generarPrefijoMarca(nombreMarca);

        return String.format("%s-%s-%05d", prefijoCategoria, prefijoMarca, producto.getIdProducto());
    }

    private String generarPrefijoCategoria(String texto) {
        if (texto == null || texto.isEmpty()) return "XXX";
        String limpio = texto.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (limpio.length() >= 3) {
            return limpio.substring(0, 3);
        } else {
            return String.format("%-3s", limpio).replace(' ', 'X');
        }
    }

    private String generarPrefijoMarca(String texto) {
        if (texto == null || texto.isEmpty()) return "XXX";
        String limpio = texto.toUpperCase().trim();
        
        if (limpio.equals("SIN ESPECIFICAR")) return "SIN"; 
        if (limpio.equals("HP") || limpio.equals("LG")) return limpio; 
        
        limpio = limpio.replaceAll("[^a-zA-Z0-9]", "");
        if (limpio.length() >= 3) {
            return limpio.substring(0, 3);
        } else {
            return String.format("%-3s", limpio).replace(' ', 'X');
        }
    }

    private void guardarImagenesFisicas(Producto producto, MultipartFile[] imagenes) {
        try {
            Path root = Paths.get(this.storageLocation);
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
            String fechaActual = LocalDateTime.now().format(formatter);
            int contador = 1;

            for (MultipartFile archivo : imagenes) {
                if (archivo.isEmpty()) continue;

                String nombreOriginal = archivo.getOriginalFilename();
                String extension = nombreOriginal != null && nombreOriginal.contains(".") ? 
                                   nombreOriginal.substring(nombreOriginal.lastIndexOf(".")) : ".jpg";

                String nombreUnico = fechaActual + "_" + producto.getSkuproducto() + "_" + contador + extension;
                
                // Guardamos el archivo físico binario en disco duro
                Files.copy(archivo.getInputStream(), root.resolve(nombreUnico));

                ProductoImagen prodImg = new ProductoImagen();
                // !!! CAMBIO CLAVE: Guardamos SOLO el nombre único en la Base de Datos
                prodImg.setRutaimagen(nombreUnico); 
                prodImg.setProducto(producto);
                
                producto.getImagenes().add(prodImg);
                contador++;
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al almacenar las imágenes: " + e.getMessage());
        }
    }
}