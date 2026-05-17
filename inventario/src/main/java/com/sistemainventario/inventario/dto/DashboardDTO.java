package com.sistemainventario.inventario.dto;

import java.util.List;

import com.sistemainventario.inventario.dto.dashboard.MovimientosDashboardDTO;

import lombok.Data;

@Data
public class DashboardDTO {

    //SOLICITUDES DE COMPRA 
    private long pendientes;
    private long aprobadas;
    private long recepcionadas;
    private long totalBodegas;

    // PRESUPUESTOS
    private long presupuestoPendientes;
    private long presupuestoAprobados;
    private long presupuestoDespachados;

    private List<MovimientosDashboardDTO> actividadReciente;
    
}
