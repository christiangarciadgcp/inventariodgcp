package com.sistemainventario.inventario.dto;

import lombok.Data;
import java.util.List;

@Data
public class PresupuestoRevisionDTO {
    private Long idDetalle;
    private Long idProducto;
    private String nombreProducto;
    private String unidadMedida;
    private Boolean esGenerico;
    private Integer cantidadSolicitada;
    private Integer cantidadDespachada;
    private Integer cantidadPendiente;
    private Integer cantidadEnBodegaDespacho;
    private Integer totalStockGlobal;
    private List<StockBodegaDTO> desglosePorBodega;

    private List<ProductoFisicoDisponibleDTO> sustitutosDisponibles;

    @Data
    public static class ProductoFisicoDisponibleDTO {
        private Integer idProducto;
        private String nombreProducto;
        private String skuProducto;
        private String marcaProducto;
        private String modeloProducto;
        private String serieProducto;
        private String inventarioProducto;
        private Integer stockEnDespacho;
        private Integer stockGlobal;
        private Boolean esNuevo;
        private List<StockBodegaDTO> desgloseBodegas;
    }
}