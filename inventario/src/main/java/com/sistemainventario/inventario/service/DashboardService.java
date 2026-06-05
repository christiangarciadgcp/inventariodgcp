package com.sistemainventario.inventario.service;

import java.util.stream.Collectors;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sistemainventario.inventario.dto.DashboardDTO;
import com.sistemainventario.inventario.dto.dashboard.MovimientosDashboardDTO;
import com.sistemainventario.inventario.model.MovimientoStock;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.MovimientoStockRepository;
import com.sistemainventario.inventario.repository.PresupuestoRepository;
import com.sistemainventario.inventario.repository.SolicitudCompraRepository;

@Service
public class DashboardService {

    private final SolicitudCompraRepository solicitudCompraRepository;
    private final BodegaRepository bodegaRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final PresupuestoRepository presupuestoRepository;

    public DashboardService(SolicitudCompraRepository solicitudCompraRepository, BodegaRepository bodegaRepository,MovimientoStockRepository movimientoStockRepository, PresupuestoRepository presupuestoRepository){
        this.solicitudCompraRepository = solicitudCompraRepository;
        this.bodegaRepository = bodegaRepository;
        this.movimientoStockRepository = movimientoStockRepository;
        this.presupuestoRepository = presupuestoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardDTO getDatosDashboard(){
        DashboardDTO dashboardDTO = new DashboardDTO();

        //SOLICITUDES DE COMPRA 
        dashboardDTO.setPendientes(solicitudCompraRepository.countByEstado("PENDIENTE"));
        dashboardDTO.setAprobadas(solicitudCompraRepository.countByEstado("APROBADA"));
        dashboardDTO.setRecepcionadas(solicitudCompraRepository.countByEstado("RECEPCION_PARCIAL"));
        dashboardDTO.setTotalBodegas(bodegaRepository.count());

        //PRESUPUESTOS
        dashboardDTO.setPresupuestoPendientes(presupuestoRepository.countByEstado("PENDIENTE"));
        dashboardDTO.setPresupuestoAprobados(presupuestoRepository.countByEstado("APROBADO"));
        dashboardDTO.setPresupuestoDespachados(presupuestoRepository.countByEstado("DESPACHO PARCIAL"));

        List<MovimientoStock> ultimosMovimientos = movimientoStockRepository.findTop10ByOrderByFechaDesc();
        
        List<MovimientosDashboardDTO> actividad = ultimosMovimientos.stream().map(m -> {
            MovimientosDashboardDTO movDTO = new MovimientosDashboardDTO();
            movDTO.setTipo(m.getTipo());
            movDTO.setMotivo(m.getMotivo());
            movDTO.setNombreProducto(m.getProducto().getNombreproducto());
            movDTO.setNombreBodega(m.getBodega().getNombrebodega());
            movDTO.setCantidad(m.getCantidad());

            if (m.getProducto().getUnidadMedida() != null) {
                movDTO.setUnidadMedida(m.getProducto().getUnidadMedida().getAbreviaturaunidadmedida());
            } else {
                movDTO.setUnidadMedida("");
            }
            
            movDTO.setNombreUsuario(m.getUsuario().getNombreusuario());
            movDTO.setFechaMovimiento(m.getFecha());
            
            return movDTO;
        }).collect(Collectors.toList());

        dashboardDTO.setActividadReciente(actividad);

        return dashboardDTO;
    }
    
}