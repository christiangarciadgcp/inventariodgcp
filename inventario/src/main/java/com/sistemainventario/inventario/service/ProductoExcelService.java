package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.productoDTO.ProductoRegistroDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductoExcelService {

    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final ModeloRepository modeloRepository;
    private final ProductoService productoService;

    private final InventarioService inventarioService;
    private final BodegaRepository bodegaRepository;

    public ProductoExcelService(CategoriaRepository categoriaRepository, ProveedorRepository proveedorRepository,
                                UnidadMedidaRepository unidadMedidaRepository, ModeloRepository modeloRepository,
                                ProductoService productoService,
                                InventarioService inventarioService,
                                BodegaRepository bodegaRepository) {
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
        this.modeloRepository = modeloRepository;
        this.productoService = productoService;
        this.inventarioService = inventarioService;
        this.bodegaRepository = bodegaRepository;
    }

    @Transactional
    public List<Producto> procesarCargaMasiva(MultipartFile archivoExcel, Integer idUsuario) {
        List<Producto> productosGuardados = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(); 

        try (InputStream is = archivoExcel.getInputStream(); 
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0); 
            
            for (Row row : sheet) {
                String nombreProducto = obtenerValorCelda(row, 0, formatter);
                
                if (row.getRowNum() == 0 && nombreProducto.equalsIgnoreCase("Nombre del Producto")) {
                    continue;
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

                // BÚSQUEDAS EN LA BASE DE DATOS
                Categoria categoria = categoriaRepository.findFirstByNombrecategoriaIgnoreCase(nombreCategoria)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Categoría no encontrada -> " + nombreCategoria));

                Modelo modelo = modeloRepository.findFirstByNombremodeloIgnoreCaseAndMarca_NombremarcaIgnoreCase(nombreModelo, nombreMarca)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": El modelo '" + nombreModelo + "' no fue encontrado bajo la marca '" + nombreMarca + "'"));

                UnidadMedida unidad = unidadMedidaRepository.findFirstByNombreunidadmedidaIgnoreCase(nombreUnidad)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Unidad de medida no encontrada -> " + nombreUnidad));

                Proveedor proveedor = null;
                if (!nombreProveedor.isEmpty() && !nombreProveedor.equalsIgnoreCase("N/A")) {
                    proveedor = proveedorRepository.findFirstByNombreproveedorIgnoreCase(nombreProveedor)
                            .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Proveedor no encontrado -> " + nombreProveedor));
                }

                boolean esNuevo = true;
                if (condicion.equalsIgnoreCase("USADO") || condicion.equalsIgnoreCase("NO")) {
                    esNuevo = false;
                }

                // 2. ARMAR EL DTO
                ProductoRegistroDTO dto = new ProductoRegistroDTO();
                dto.setNombreproducto(nombreProducto);
                dto.setIdCategoria(categoria.getIdCategoria());
                dto.setIdModelo(modelo.getIdModelo());
                dto.setIdUnidadMedida(unidad.getIdUnidadMedida());
                
                if (proveedor != null) {
                    dto.setIdProveedor(proveedor.getIdProveedor());
                }
                
                dto.setSerieproducto(serie);
                dto.setInventarioproducto(inventarioStr);
                dto.setDescripcionproducto(descripcion);

                dto.setEsNuevo(esNuevo);
                dto.setEsGenerico(false);
                
                // Precios en Cero
                dto.setPreciocostoproducto(java.math.BigDecimal.ZERO);
                dto.setPrecioventaproducto(java.math.BigDecimal.ZERO);

                // 3. GUARDAR
                Producto producto = productoService.guardarProducto(dto, null);
                productosGuardados.add(producto);

                if (!cantidadStr.isEmpty() && !nombreBodega.isEmpty()) {
                    try {
                        int cantidadInicial = Integer.parseInt(cantidadStr);
                        if (cantidadInicial > 0) {
                            Bodega bodegaDestino = bodegaRepository.findFirstByNombrebodegaIgnoreCase(nombreBodega)
                                    .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Bodega destino no encontrada -> " + nombreBodega));

                            inventarioService.registrarMovimiento(
                                    producto.getIdProducto(),
                                    bodegaDestino.getIdBodega(),
                                    "ENTRADA",
                                    cantidadInicial,
                                    idUsuario,
                                    "Carga inicial de inventario vía plantilla Excel"
                            );
                        }
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("Fila " + (row.getRowNum() + 1) + ": La Cantidad Inicial debe ser un número entero válido.");
                    }
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