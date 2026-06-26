package com.sistemainventario.inventario.dto;

import lombok.Data;
import java.util.List;

@Data
public class DespachoPayloadDTO {
    private Integer idUsuario;
    private List<ItemDespachoDTO> items;

    @Data
    public static class ItemDespachoDTO {
        private Long idDetalle; // ID del requerimiento original
        private Integer idProductoFisico; // ID del sustituto despachado
        private Integer cantidadADespachar;
    }
}
