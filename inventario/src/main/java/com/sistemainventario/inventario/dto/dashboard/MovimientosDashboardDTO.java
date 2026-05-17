package com.sistemainventario.inventario.dto.dashboard;

import java.time.Instant;

import lombok.Data;

@Data
public class MovimientosDashboardDTO {
    private String tipo;            
    private String motivo;
    private String nombreProducto;
    private String nombreBodega;
    private Integer cantidad;
    private String nombreUsuario;
    private Instant fechaMovimiento;
}
