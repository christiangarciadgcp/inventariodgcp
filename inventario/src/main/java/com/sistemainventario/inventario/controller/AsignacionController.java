package com.sistemainventario.inventario.controller;
import com.sistemainventario.inventario.dto.asignacionDTO.AsignacionCreacionDTO;
import com.sistemainventario.inventario.dto.asignacionDTO.DevolucionItemDTO;
import com.sistemainventario.inventario.dto.asignacionDTO.EquipoTrazabilidadDTO;
import com.sistemainventario.inventario.dto.asignacionDTO.TrazabilidadItemDTO;
import com.sistemainventario.inventario.model.Asignacion;
import com.sistemainventario.inventario.model.AsignacionDetalle;
import com.sistemainventario.inventario.service.AsignacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asignaciones")
@CrossOrigin(origins = "*")
public class AsignacionController {

    private final AsignacionService asignacionService;

    public AsignacionController(AsignacionService asignacionService) {
        this.asignacionService = asignacionService;
    }

    @GetMapping
    public ResponseEntity<List<Asignacion>> listarTodas() {
        return ResponseEntity.ok(asignacionService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asignacion> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(asignacionService.obtenerPorId(id));
    }

    @GetMapping("/{id}/detalles")
    public ResponseEntity<List<AsignacionDetalle>> listarDetalles(@PathVariable Long id) {
        return ResponseEntity.ok(asignacionService.listarDetallesPorAsignacion(id));
    }

    @PostMapping("/crear")
    public ResponseEntity<Asignacion> crearAsignacion(@RequestBody AsignacionCreacionDTO dto) {
        return ResponseEntity.ok(asignacionService.crearAsignacion(dto));
    }

    @PutMapping("/{id}/editar")
    public ResponseEntity<Asignacion> actualizarAsignacion(@PathVariable Long id, @RequestBody AsignacionCreacionDTO dto) {
        return ResponseEntity.ok(asignacionService.actualizarAsignacion(id, dto));
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<Void> aprobar(@PathVariable Long id, @RequestParam Integer idUsuario) {
        asignacionService.aprobarAsignacion(id, idUsuario);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id, @RequestParam Integer idUsuario) {
        asignacionService.cancelarAsignacion(id, idUsuario);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/devolucion")
    public ResponseEntity<Void> devolverEquipo(@RequestBody DevolucionItemDTO dto) {
        asignacionService.devolverEquipo(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/devolucion-total")
    public ResponseEntity<Void> devolverTodosEquipos(@RequestBody com.sistemainventario.inventario.dto.asignacionDTO.DevolucionTotalDTO dto) {
        asignacionService.devolverTodosEquipos(dto);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/equipos-activos")
    public ResponseEntity<List<EquipoTrazabilidadDTO>> listarEquiposActivos() {
        return ResponseEntity.ok(asignacionService.listarResumenTrazabilidadEquipos());
    }

    @GetMapping("/trazabilidad/producto/{idProducto}")
    public ResponseEntity<List<TrazabilidadItemDTO>> trazabilidad(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(asignacionService.obtenerTrazabilidadProducto(idProducto));
    }
}

