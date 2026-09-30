package com.sistemainventario.inventario.dto.asignacionDTO;

import lombok.Data;
import java.time.Instant;

@Data
public class EquipoTrazabilidadDTO {
    private Integer idProducto;
    private String nombreProducto;
    private String skuProducto;
    private String serieProducto;
    private String inventarioProducto;
    private String marca;
    private String modelo;
    private String estadoActual; 
    private String asignadoA;
    private String ultimaActa;
    private Instant fechaUltimaAsignacion;
    private Long totalAsignaciones;
}