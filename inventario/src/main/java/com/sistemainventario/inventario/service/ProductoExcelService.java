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

    public ProductoExcelService(CategoriaRepository categoriaRepository, ProveedorRepository proveedorRepository,
                                UnidadMedidaRepository unidadMedidaRepository, ModeloRepository modeloRepository,
                                ProductoService productoService) {
        this.categoriaRepository = categoriaRepository;
        this.proveedorRepository = proveedorRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
        this.modeloRepository = modeloRepository;
        this.productoService = productoService;
    }

    @Transactional
    public List<Producto> procesarCargaMasiva(MultipartFile archivoExcel) {
        List<Producto> productosGuardados = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(); 

        try (InputStream is = archivoExcel.getInputStream(); 
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0); 
            
            for (Row row : sheet) {
                // LECTURA SEGURA (Columna A)
                String nombreProducto = obtenerValorCelda(row, 0, formatter);
                
                // SOLUCIÓN 1: Salto inteligente de encabezados
                // Si la fila 0 es un encabezado real, se la salta. Si ya son datos, la procesa.
                if (row.getRowNum() == 0 && nombreProducto.equalsIgnoreCase("Nombre del Producto")) {
                    continue;
                }

                if (nombreProducto.isEmpty()) break; // Fin del archivo

                String nombreCategoria = obtenerValorCelda(row, 1, formatter);
                String nombreMarca = obtenerValorCelda(row, 2, formatter); // <-- SOLUCIÓN 2: Capturamos la Marca
                String nombreModelo = obtenerValorCelda(row, 3, formatter);
                String nombreProveedor = obtenerValorCelda(row, 4, formatter);
                String nombreUnidad = obtenerValorCelda(row, 5, formatter);
                String serie = obtenerValorCelda(row, 6, formatter);
                String inventarioStr = obtenerValorCelda(row, 7, formatter);
                String descripcion = obtenerValorCelda(row, 8, formatter);

                // 1. BÚSQUEDAS EN LA BASE DE DATOS
                Categoria categoria = categoriaRepository.findFirstByNombrecategoriaIgnoreCase(nombreCategoria)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Categoría no encontrada -> " + nombreCategoria));

                // SOLUCIÓN 2: Búsqueda cruzada de Modelo + Marca
                Modelo modelo = modeloRepository.findFirstByNombremodeloIgnoreCaseAndMarca_NombremarcaIgnoreCase(nombreModelo, nombreMarca)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": El modelo '" + nombreModelo + "' no fue encontrado bajo la marca '" + nombreMarca + "'"));

                UnidadMedida unidad = unidadMedidaRepository.findFirstByNombreunidadmedidaIgnoreCase(nombreUnidad)
                        .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Unidad de medida no encontrada -> " + nombreUnidad));

                Proveedor proveedor = null;
                if (!nombreProveedor.isEmpty() && !nombreProveedor.equalsIgnoreCase("N/A")) {
                    proveedor = proveedorRepository.findFirstByNombreproveedorIgnoreCase(nombreProveedor)
                            .orElseThrow(() -> new RuntimeException("Fila " + (row.getRowNum() + 1) + ": Proveedor no encontrado -> " + nombreProveedor));
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
                
                // Precios en Cero
                dto.setPreciocostoproducto(java.math.BigDecimal.ZERO);
                dto.setPrecioventaproducto(java.math.BigDecimal.ZERO);

                // 3. GUARDAR
                Producto producto = productoService.guardarProducto(dto, null);
                productosGuardados.add(producto);
            }

        } catch (Exception e) {
            // El mensaje encapsulado subirá a Angular
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