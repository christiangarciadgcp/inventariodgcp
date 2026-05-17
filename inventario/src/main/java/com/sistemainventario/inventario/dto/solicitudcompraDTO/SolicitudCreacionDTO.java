package com.sistemainventario.inventario.dto.solicitudcompraDTO;

import java.util.List;

import lombok.Data;

@Data
public class SolicitudCreacionDTO {
    private String nombreSolicitud;
    private Integer idUsuario;
    private Integer idBodegaDestino;
    private List<DetalleItemDTO> items;

    @Data
    public static class DetalleItemDTO{
        private Integer idProducto;
        private Integer cantidad;
    }

}
