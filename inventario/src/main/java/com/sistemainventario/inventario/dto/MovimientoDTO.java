package com.sistemainventario.inventario.dto;

import lombok.Data;

@Data
public class MovimientoDTO {
    private Integer idBodegaOrigen;
    private Integer idBodegaDestino;
    private Integer idProducto;
    private Integer cantidad;
    private Integer idUsuario;
    private String motivo;
}