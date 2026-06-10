package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.SnapshotInventario;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sistemainventario.inventario.repository.SnapshotInventarioRepository;
import java.util.List;
import java.time.*;

@Service
public class SnapshotService {

    private final SnapshotInventarioRepository snapshotInventarioRepository;

    public SnapshotService(SnapshotInventarioRepository snapshotInventarioRepository) {
        this.snapshotInventarioRepository = snapshotInventarioRepository;
    }

    @Scheduled(cron = "0 0 23 * * ?")
    @Transactional
    public void ejecutarSnapshotDiario() {
        System.out.println("**********************************************");
        System.out.println("Iniciando Snapshot de Inventario Diario...");
        
        long startTime = System.currentTimeMillis();
        
        snapshotInventarioRepository.generarSnapshotDiario();
        
        long endTime = System.currentTimeMillis();
        
        System.out.println("Snapshot completado exitosamente en " + (endTime - startTime) + " ms.");
        System.out.println("***********************************************");
    }

    @Transactional(readOnly = true)
    public List<SnapshotInventario> buscarSnapshotPorFiltros(Integer idBodega, Instant inicio, Instant fin) {
        return snapshotInventarioRepository.findSnapshotPorBodegaYFecha(idBodega, inicio, fin);
    }

}
