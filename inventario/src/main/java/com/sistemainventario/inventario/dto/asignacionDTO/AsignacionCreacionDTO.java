package com.sistemainventario.inventario.dto.asignacionDTO;

import lombok.Data;
import java.util.List;

@Data
public class AsignacionCreacionDTO {
    private Integer idAsignacionTipo;
    private String responsableDestino;
    private String observaciones;
    private Integer idUsuario;
    private List<ItemAsignacionDTO> items;

    @Data
    public static class ItemAsignacionDTO {
        private Integer idProducto;
        private Integer idBodegaOrigen;
    }
}