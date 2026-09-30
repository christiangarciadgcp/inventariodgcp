package com.sistemainventario.inventario.dto.asignacionDTO;

import lombok.Data;

@Data
public class DevolucionTotalDTO {
    private Long idAsignacion;
    private Integer idBodegaDestino;
    private Integer idUsuario;
    private String observacion;
}