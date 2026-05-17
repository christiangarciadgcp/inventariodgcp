package com.sistemainventario.inventario.dto;

import java.time.Instant;
import java.util.List;

import lombok.Data;

@Data
public class DespachoReporteDTO {
    private Long idPresupuesto;
    private String nombreProyecto;
    private String solicitante;        
    private String usuarioDespachado;
    private Instant fechaAprobacion;
    private String estado;
    private String ubicacionDestino;
    private String observaciones;
    private List<DetalleDespachoItem> items;

    @Data
    public static class DetalleDespachoItem {
        private String sku;
        private String nombreProducto;
        private String unidadMedida;
        private String bodegaOrigen;

        private Integer cantidadSolicitada;
        private Integer cantidadDespachada;
        private String estadoItem;
    }

}
