package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Bodega;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.InventarioRepository;
import com.sistemainventario.inventario.repository.ProductoRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BodegaService {

    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;

    public BodegaService(BodegaRepository bodegaRepository, 
                         ProductoRepository productoRepository, 
                         InventarioRepository inventarioRepository) {
        this.bodegaRepository = bodegaRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
    }

    public List<Bodega> listarBodegas(){
        return bodegaRepository.findAll(Sort.by(Sort.Direction.ASC, "idBodega"));
    }

    public List<Bodega> listarBodegasActivas(){
        return bodegaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "idBodega"));
    }

    public Optional<Bodega> buscarBodegaPorId(Integer id){
        return bodegaRepository.findById(id);
    }

    @Transactional
    public Bodega guardarBodega(Bodega bodega){
        String nombreLimpio = bodega.getNombrebodega() != null ? bodega.getNombrebodega().trim() : "";

        //VALIDACIÓN PREVIA EN CREACIÓN
        if (bodegaRepository.findFirstByNombrebodegaIgnoreCase(nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        boolean nuevaBodega = (bodega.getIdBodega() == null);

        if (nuevaBodega) {
            bodega.setActivo(true);
            bodega.setNombrebodega(nombreLimpio);
        }

        return bodegaRepository.save(bodega);
    }

    @Transactional
    public Bodega actualizarBodega(Integer id, Bodega bodega){
        String nombreLimpio = bodega.getNombrebodega() != null ? bodega.getNombrebodega().trim() : "";

        // VALIDACIÓN PREVIA EN EDICIÓN
        Optional<Bodega> bodegaExistente = bodegaRepository.findFirstByNombrebodegaIgnoreCase(nombreLimpio);
        if (bodegaExistente.isPresent() && !bodegaExistente.get().getIdBodega().equals(id)) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        Bodega bodegaActual = bodegaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        bodegaActual.setNombrebodega(nombreLimpio);
        bodegaActual.setDireccionbodega(bodega.getDireccionbodega());
        bodegaActual.setTelefonobodega(bodega.getTelefonobodega());
        bodegaActual.setBodegaTipo(bodega.getBodegaTipo());

        return bodegaRepository.save(bodegaActual);
    }

    @Transactional
    public void desactivarBodega(Integer id){
        boolean tieneStock = inventarioRepository.existeStockEnBodega(id);

        if (tieneStock) {
            throw new RuntimeException("No se puede desactivar la bodega porque aún cuenta con productos con stock");
        }

        Bodega bodega = bodegaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        bodega.setActivo(false);
        bodegaRepository.save(bodega);
    }

    @Transactional
    public void activarBodega(Integer id){
        Bodega bodega = bodegaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        bodega.setActivo(true);
        bodegaRepository.save(bodega);
    }
}
