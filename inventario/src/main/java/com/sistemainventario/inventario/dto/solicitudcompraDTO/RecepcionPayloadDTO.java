package com.sistemainventario.inventario.dto.solicitudcompraDTO;

import java.util.List;

import lombok.Data;

@Data
public class RecepcionPayloadDTO {
    private Integer idUsuarioComprador;
    private List<ItemRecepcion> items;

    @Data
    public static class ItemRecepcion {
        private Long idDetalle;
        private Integer cantidadARecibir;
    }
}
