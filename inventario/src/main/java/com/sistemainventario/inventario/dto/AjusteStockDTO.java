package com.sistemainventario.inventario.dto;

import lombok.Data;

@Data
public class AjusteStockDTO {
    private Integer idProducto;
    private Integer idBodega;
    private Integer cantidad; 
    private String tipoMovimiento;
    private Integer idUsuario;
    private String motivo;
}
