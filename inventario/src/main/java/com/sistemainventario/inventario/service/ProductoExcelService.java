package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;

@Service
public class ProductoExcelService {

    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final ModeloRepository modeloRepository;
    private final ProductoService productoService;
    private final MarcaRepository marcaRepository;
    private final InventarioService inventarioService;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;

    private final TransactionTemplate transactionTemplate;

    public ProductoExcelService(CategoriaRepository categoriaRepository, ProveedorRepository proveedorRepository,
                                UnidadMedidaRepository unidadMedidaRepository, ModeloRepository modeloRepository,
                                ProductoService productoService,
                                MarcaRepository marcaRepository,
                                InventarioService inventarioService,
                                BodegaRepository bodegaRepository,
                                ProductoRepository productoRepository,
                                PlatformTransactionManager transactionManager) {
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
        this.modeloRepository = modeloRepository;
        this.productoService = productoService;
        this.marcaRepository = marcaRepository;
        this.inventarioService = inventarioService;
        this.bodegaRepository = bodegaRepository;
        this.productoRepository = productoRepository;

        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    private static class FilaProcesada {
        ProductoRegistroDTO dto;
        Bodega bodegaDestino;
        Integer cantidadInicial;

        public FilaProcesada(ProductoRegistroDTO dto, Bodega bodegaDestino, Integer cantidadInicial){
            this.dto = dto;
            this.bodegaDestino = bodegaDestino;
            this.cantidadInicial = cantidadInicial;
        }
    }

    @Transactional
    public List<Producto> procesarCargaMasiva(MultipartFile archivoExcel, Integer idUsuario) {
        List<Producto> productosGuardados = new ArrayList<>();
        List<FilaProcesada> filaProcesadas = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(); 

        try (InputStream is = archivoExcel.getInputStream(); 
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0); 
            
            for (Row row : sheet) {
                String nombreProducto = obtenerValorCelda(row, 0, formatter);
                
                if (row.getRowNum() == 0 && nombreProducto.equalsIgnoreCase("Nombre del Producto")) {
                    continue; // A1 no es el inicio del archivo base para ingresar materiales
                }

                if (nombreProducto.isEmpty()) break; // Termina el ciclo de la carga 

                String nombreCategoria = obtenerValorCelda(row, 1, formatter);
                String nombreMarca = obtenerValorCelda(row, 2, formatter); 
                String nombreModelo = obtenerValorCelda(row, 3, formatter);
                String nombreProveedor = obtenerValorCelda(row, 4, formatter);
                String nombreUnidad = obtenerValorCelda(row, 5, formatter);
                String serie = obtenerValorCelda(row, 6, formatter);
                String inventarioStr = obtenerValorCelda(row, 7, formatter);
                String descripcion = obtenerValorCelda(row, 8, formatter);
                String condicion = obtenerValorCelda(row, 9, formatter);
                String cantidadStr = obtenerValorCelda(row, 10, formatter); // Columna K
                String nombreBodega = obtenerValorCelda(row, 11, formatter); // Columna L
                String nombreProductoPadre = obtenerValorCelda(row, 12, formatter); //Columna M

                // BÚSQUEDAS EN LA BASE DE DATOS
                Categoria categoria = categoriaRepository.findFirstByNombrecategoriaIgnoreCase(nombreCategoria)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Categoría no encontrada: " + nombreCategoria));

                Marca marca = marcaRepository.findFirstByNombremarcaIgnoreCase(nombreMarca)
                        .orElseGet(() -> transactionTemplate.execute(status -> {
                            Marca nuevaMarca = new Marca();
                            nuevaMarca.setNombremarca(nombreMarca);
                            nuevaMarca.setActivo(true);
                            return marcaRepository.save(nuevaMarca);
                        }));

                Modelo modelo = modeloRepository.findFirstByNombremodeloIgnoreCaseAndMarca_NombremarcaIgnoreCase(nombreModelo, nombreMarca)
                        .orElseGet(() -> transactionTemplate.execute(status -> {
                            Modelo nuevoModelo = new Modelo();
                            nuevoModelo.setNombremodelo(nombreModelo);
                            nuevoModelo.setMarca(marca);
                            nuevoModelo.setActivo(true);
                            return modeloRepository.save(nuevoModelo);
                        }));

                UnidadMedida unidad = unidadMedidaRepository.findFirstByNombreunidadmedidaIgnoreCase(nombreUnidad)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Unidad de medida no encontrada: " + nombreUnidad));

                Proveedor proveedor = null;
                if (!nombreProveedor.isEmpty() && !nombreProveedor.equalsIgnoreCase("N/A")) {
                    proveedor = proveedorRepository.findFirstByNombreproveedorIgnoreCase(nombreProveedor)
                            .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Proveedor no encontrado: " + nombreProveedor));
                }

                Producto productoPadre = null;
                if (!nombreProductoPadre.isEmpty() && !nombreProductoPadre.equalsIgnoreCase("N/A")) {
                    productoPadre = productoRepository.findFirstByNombreproductoIgnoreCaseAndEsGenericoTrue(nombreProductoPadre)
                            .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Producto base (padre) no encontrado: " + nombreProductoPadre));
                }

                boolean esNuevo = true;
                if (condicion.equalsIgnoreCase("USADO") || condicion.equalsIgnoreCase("NO")) {
                    esNuevo = false;
                }

                // ARMAR EL DTO en memoria
                ProductoRegistroDTO dto = new ProductoRegistroDTO();
                dto.setNombreproducto(nombreProducto);
                dto.setIdCategoria(categoria.getIdCategoria());
                dto.setIdModelo(modelo.getIdModelo());
                dto.setIdUnidadMedida(unidad.getIdUnidadMedida());
                
                if (proveedor != null) {
                    dto.setIdProveedor(proveedor.getIdProveedor());
                }

                if (productoPadre != null) {
                    dto.setIdProductoPadre(productoPadre.getIdProducto());
                }
                
                dto.setSerieproducto(serie);
                dto.setInventarioproducto(inventarioStr);
                dto.setDescripcionproducto(descripcion);

                dto.setEsNuevo(esNuevo);
                dto.setEsGenerico(false);
                
                // Precios en Cero
                dto.setPreciocostoproducto(BigDecimal.ZERO);
                dto.setPrecioventaproducto(BigDecimal.ZERO);


                Bodega bodegaDestino = null;
                Integer cantidadInicial = null;


                if (!cantidadStr.isEmpty() && !nombreBodega.isEmpty()) {
                    try {
                         cantidadInicial = Integer.parseInt(cantidadStr);
                        if (cantidadInicial > 0) {
                            bodegaDestino = bodegaRepository.findFirstByNombrebodegaIgnoreCase(nombreBodega)
                                    .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Bodega destino no encontrada: " + nombreBodega));
                        }
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("Fila " + (row.getRowNum() + 1) + ": La Cantidad Inicial debe ser un número entero válido.");
                    }
                }

                filaProcesadas.add(new FilaProcesada(dto, bodegaDestino, cantidadInicial));
            }

            for(FilaProcesada fila : filaProcesadas){
                Producto producto = productoService.guardarProducto(fila.dto, null);
                productosGuardados.add(producto);

                if(fila.bodegaDestino != null && fila.cantidadInicial != null && fila.cantidadInicial > 0){
                    inventarioService.registrarMovimiento(
                        producto.getIdProducto(), 
                        fila.bodegaDestino.getIdBodega(), 
                        "ENTRADA", 
                        fila.cantidadInicial, 
                        idUsuario, 
                        "Carga inicial de inventario vía plantilla Excel");
                }
            }

        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        return productosGuardados;
    }

    // =====================================================================
    // MÉTODO AUXILIAR: Evita NullPointerException si la celda está vacía
    // =====================================================================
    private String obtenerValorCelda(Row row, int indiceColumna, DataFormatter formatter) {
        Cell cell = row.getCell(indiceColumna, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
        return formatter.formatCellValue(cell).trim();
    }
}