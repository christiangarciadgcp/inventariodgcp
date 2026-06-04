package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.dto.solicitudcompraDTO.RecepcionPayloadDTO;
import com.sistemainventario.inventario.dto.solicitudcompraDTO.SolicitudCreacionDTO;
import com.sistemainventario.inventario.model.SolicitudCompra;
import com.sistemainventario.inventario.model.SolicitudCompraDetalle;
import com.sistemainventario.inventario.service.SolicitudCompraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes-compra")
@CrossOrigin(origins = "*")
public class SolicitudCompraController {

    private final SolicitudCompraService solicitudCompraService;

    public SolicitudCompraController(SolicitudCompraService solicitudCompraService) {
        this.solicitudCompraService = solicitudCompraService;
    }

    @PostMapping("/crear")
    public ResponseEntity<SolicitudCompra> crearSolicitud(@RequestBody SolicitudCreacionDTO dto) {
        return ResponseEntity.ok(solicitudCompraService.crearSolicitudCompra(dto));
    }

    //AGREGAR UN PRODUCTO A LA SOLICITUD (DETALLE)
    @PostMapping("/{idSolicitud}/productos")
    public ResponseEntity<Void> agregarProducto(@PathVariable Long idSolicitud,@RequestBody DetalleSolicitudDTO detalleDTO) {
        
        solicitudCompraService.agregarProductosASolicitudCompra(
                idSolicitud,
                detalleDTO.idProducto,
                detalleDTO.cantidad
        );
        return ResponseEntity.ok().build();
    }

    //APROBAR LA SOLICITUD
    @PutMapping("/{idSolicitud}/aprobar")
    public ResponseEntity<Void> aprobarSolicitud(@PathVariable Long idSolicitud, @RequestParam Integer idUsuario) {
        solicitudCompraService.aprobarSolicitudCompra(idSolicitud, idUsuario);
        return ResponseEntity.ok().build();
    }

    //RECEPCIONAR LA SOLICITUD (ENTRADA DE STOCK)
    @PutMapping("/{idSolicitud}/recepcionar")
    public ResponseEntity<Void> recepcionarSolicitud(
            @PathVariable Long idSolicitud, 
            @RequestBody RecepcionPayloadDTO payload) {
        
        solicitudCompraService.recepcionarSolicitudCompra(idSolicitud, payload);
        return ResponseEntity.ok().build();
    }

    // LISTADO DE SOLICITUDES POR SU ESTADO
    @GetMapping
    public ResponseEntity<List<SolicitudCompra>> listarPorEstado(@RequestParam(required = false) String estado) {
        if (estado != null) {
            return ResponseEntity.ok(solicitudCompraService.listarPorEstado(estado)); 
        }
        return ResponseEntity.ok(solicitudCompraService.listarTodas()); 
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudCompra> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudCompraService.obtenerPorId(id));
    }

    // DETALLES DE LA SOLICITUD
    @GetMapping("/{id}/detalles")
    public ResponseEntity<List<SolicitudCompraDetalle>> obtenerDetalles(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudCompraService.listarDetallesDeSolicitud(id));
    }

    @PutMapping("/{id}/editar")
    public ResponseEntity<SolicitudCompra> actualizarSolicitud(
            @PathVariable Long id, 
            @RequestBody SolicitudCreacionDTO dto) {
        return ResponseEntity.ok(solicitudCompraService.actualizarSolicitudCompra(id, dto));
    }

    // DTOs
    
    // Para crear la cabecera
    public static class SolicitudDTO {
        public String nombresolicitud;
        public Integer idUsuarioSolicitante;
        public Integer idBodegaDestino;
    }

    // Para agregar productos
    public static class DetalleSolicitudDTO {
        public Integer idProducto;
        public Integer cantidad;
    }

    // Para recepcionar
    public static class RecepcionDTO {
        public Integer idUsuarioComprador;
    }
    
}
