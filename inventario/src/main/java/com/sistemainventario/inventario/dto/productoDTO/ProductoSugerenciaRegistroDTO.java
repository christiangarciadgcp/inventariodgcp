package com.sistemainventario.inventario.dto.productoDTO;

import lombok.Data;

@Data
public class ProductoSugerenciaRegistroDTO {
    private String nombreSugerido;
    private String justificacion;
    private Integer idCategoria;
    private Integer idUsuarioSolicitante;

}
