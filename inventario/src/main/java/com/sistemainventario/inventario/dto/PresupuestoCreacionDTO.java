package com.sistemainventario.inventario.dto;

import lombok.Data;
import java.util.List;

@Data
public class PresupuestoCreacionDTO {
    private String nombrePresupuesto;
    private Integer idUsuario;
    private Integer idUbicacion;
    private String observaciones;
    private List<DetalleItemDTO> items;

    @Data
    public static class DetalleItemDTO {
        private Integer idProducto;
        private Integer cantidad;
    }
}