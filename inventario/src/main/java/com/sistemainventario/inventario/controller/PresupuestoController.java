package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.dto.DespachoReporteDTO;
import com.sistemainventario.inventario.dto.PresupuestoCreacionDTO;
import com.sistemainventario.inventario.dto.PresupuestoRevisionDTO;
import com.sistemainventario.inventario.model.Presupuesto;
import com.sistemainventario.inventario.model.PresupuestoDetalle;
import com.sistemainventario.inventario.service.PresupuestoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "*")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    @GetMapping
    public ResponseEntity<List<Presupuesto>> listarTodos() {
        return ResponseEntity.ok(presupuestoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Presupuesto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(presupuestoService.obtenerPorId(id));
    }

    //OBTENER LOS DETALLES DEL PRESUPUESTO
    @GetMapping("/{id}/detalles")
    public ResponseEntity<List<PresupuestoDetalle>> obtenerDetalles(@PathVariable Long id) {
        return ResponseEntity.ok(presupuestoService.listarDetallePresupuesto(id));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Presupuesto>> listarPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(presupuestoService.listarPorEstado(estado));
    }

    //CREAR LA SOLICITUD DE PRESUPUESTO
    @PostMapping("/crear")
    public ResponseEntity<Presupuesto> crearPresupuesto(@RequestBody PresupuestoCreacionDTO dto) {
        return ResponseEntity.ok(presupuestoService.crearPresupuesto(dto));
    }

    // VALIDACION DE INVENTARIO PARA LAS EXISTENCIAS
    @GetMapping("/{id}/revision")
    public ResponseEntity<List<PresupuestoRevisionDTO>> obtenerParaRevision(@PathVariable Long id) {
        return ResponseEntity.ok(presupuestoService.obtenerDetallesConDisponibilidad(id));
    }


    @GetMapping("/{id}/reporte-despacho")
    public ResponseEntity<DespachoReporteDTO> obtenerReporteDespacho(@PathVariable Long id) {
        return ResponseEntity.ok(presupuestoService.generarDatosDespacho(id));
    }

    @PostMapping("/{id}/despachar")
    public ResponseEntity<Void> despacharPresupuesto(@PathVariable Long id, @RequestParam Integer idUsuario) {
        presupuestoService.despacharPresupuesto(id, idUsuario);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/editar")
    public ResponseEntity<Presupuesto> actualizarPresupuesto(@PathVariable Long id, @RequestBody PresupuestoCreacionDTO dto) {
        return ResponseEntity.ok(presupuestoService.actualizarPresupuesto(id, dto));
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<Void> aprobarPresupuesto(@PathVariable Long id, @RequestParam Integer idUsuario) {
        presupuestoService.aprobarPresupuesto(id, idUsuario);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelarPresupuesto(@PathVariable Long id, @RequestParam Integer idUsuario) {
        presupuestoService.cancelarPresupuesto(id, idUsuario);
        return ResponseEntity.ok().build();
    }

    
}