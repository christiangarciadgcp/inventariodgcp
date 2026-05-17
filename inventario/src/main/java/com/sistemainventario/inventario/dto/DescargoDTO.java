package com.sistemainventario.inventario.dto;

import java.util.List;

import lombok.Data;

@Data
public class DescargoDTO {

    private Integer idBodega;
    private Integer idUsuario;
    private String motivo;
    private List<MovimientoItemDTO> items;  
}
