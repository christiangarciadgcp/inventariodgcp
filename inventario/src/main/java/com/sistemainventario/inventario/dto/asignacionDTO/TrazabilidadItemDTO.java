package com.sistemainventario.inventario.dto.asignacionDTO;

import lombok.Data;
import java.time.Instant;

@Data
public class TrazabilidadItemDTO {
    private Long idAsignacion;
    private String numeroActa;
    private String tipoAsignacion;
    private String responsableDestino;
    private Instant fechaAsignacion;
    private String estadoDetalle;
    private Instant fechaDevolucion;
    private String bodegaDevolucion;
    private String observacionDevolucion;
    private String usuarioAsignador;
    private String usuarioDevolucion;
}