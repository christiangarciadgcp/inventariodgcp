package com.sistemainventario.inventario.dto;

import lombok.Data;
import java.util.List;

@Data
public class PresupuestoRevisionDTO {
    // Datos del Presupuesto/Requerimiento
    private Long idDetalle;
    private Long idProducto;
    private String nombreProducto;
    private Integer cantidadSolicitada;

    private Integer cantidadDespachada;
    private Integer cantidadPendiente;

    private Integer cantidadEnBodegaDespacho;
    private Integer totalStockGlobal; // Suma de todas las bodegas para determinar si se cuenta con existencias
    private List<StockBodegaDTO> desglosePorBodega; // Ubicacion del producto por bodega
}