package com.sistemainventario.inventario.dto.asignacionDTO;

import lombok.Data;

@Data
public class DevolucionItemDTO {
    private Long idAsignacionDetalle;
    private Integer idBodegaDestino;
    private Integer idUsuario;
    private String observacion;
}