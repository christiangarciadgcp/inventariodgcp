package com.sistemainventario.inventario.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.dto.AjusteStockDTO;
import com.sistemainventario.inventario.dto.DescargoDTO;
import com.sistemainventario.inventario.dto.MovimientoDTO;
import com.sistemainventario.inventario.dto.MovimientoStockDTO;
import com.sistemainventario.inventario.model.Bodega;
import com.sistemainventario.inventario.model.Inventario;
import com.sistemainventario.inventario.model.MovimientoStock;
import com.sistemainventario.inventario.model.SnapshotInventario;
import com.sistemainventario.inventario.service.InventarioService;
import com.sistemainventario.inventario.service.SnapshotService;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*")
public class InventarioController {
    private final InventarioService inventarioService;
    private final SnapshotService snapshotService;

    public InventarioController(InventarioService inventarioService,SnapshotService snapshotService) {
        this.inventarioService = inventarioService;
        this.snapshotService = snapshotService;
    }

    @GetMapping("/bodegas")
    public ResponseEntity<List<Bodega>> listarBodegas() {
        return ResponseEntity.ok(inventarioService.listarTodasLasBodegas());
    }

    @GetMapping("/bodega/{idBodega}")
    public ResponseEntity<List<Inventario>> listarProductosPorBodega(@PathVariable Integer idBodega) {
        List<Inventario> stock = inventarioService.listarInventarioPorBodega(idBodega);
        return ResponseEntity.ok(stock);
    }

   /*  Ver el Stock de un producto para realizar un movimiento rapido */
    @GetMapping("producto/{idProducto}")
    public ResponseEntity<List<Inventario>> listarStockPorProducto (@PathVariable Integer idProducto){
        return ResponseEntity.ok(inventarioService.listarStockPorProducto(idProducto));
    }

    /* Reporte de existencias de productos */
    @GetMapping("/consolidado")
    public ResponseEntity<List<Inventario>> listarInventarioConsolidado() {
        return ResponseEntity.ok(inventarioService.listarInventarioConsolidadoExistente());
    }
    
    
    /* Buscar movimientos por rango de fechas y tipo opcional */
    @GetMapping("/movimientos/buscar")
    public ResponseEntity<List<MovimientoStock>> buscarMovimientos(
            @RequestParam String inicio, 
            @RequestParam String fin,
            @RequestParam(required = false) String tipo) {
        
        Instant fechaInicio = Instant.parse(inicio);
        Instant fechaFin = Instant.parse(fin);
        
        return ResponseEntity.ok(inventarioService.filtrarMovimientosHistorial(fechaInicio, fechaFin, tipo));
    }

    @PostMapping("/ajuste")
    public ResponseEntity<Void> realizarAjuste(@RequestBody AjusteStockDTO dto) {
        inventarioService.realizarAjusteManual(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/movimiento")
    public ResponseEntity<Void> realizarMovimientoBodega(@RequestBody MovimientoDTO movimientoDTO){
        inventarioService.realizarMovimiento(movimientoDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/movimientostock")
    public ResponseEntity<Void> realizarMovimientoStockBodega(@RequestBody MovimientoStockDTO movimientoStockDTO) {
        inventarioService.realizarMovimientoStock(movimientoStockDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/descargo")
    public ResponseEntity<Void> realizarDescargo(@RequestBody DescargoDTO descargdoDto) {
        inventarioService.realizarDescargo(descargdoDto);
        
        return ResponseEntity.ok().build();
    }    

    @GetMapping("/snapshots/buscar")
    public ResponseEntity<List<SnapshotInventario>> buscarSnapshot(
            @RequestParam Integer idBodega,
            @RequestParam String inicio,
            @RequestParam String fin) {
        
        Instant fechaInicio = Instant.parse(inicio);
        Instant fechaFin = Instant.parse(fin);
        
        return ResponseEntity.ok(snapshotService.buscarSnapshotPorFiltros(idBodega, fechaInicio, fechaFin));
    }

}
