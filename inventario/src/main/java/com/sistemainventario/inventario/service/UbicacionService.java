package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Ubicacion;
import com.sistemainventario.inventario.repository.UbicacionRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;

    public UbicacionService(UbicacionRepository ubicacionRepository) {
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional(readOnly = true)
    public List<Ubicacion> listarUbicaciones(){
        return ubicacionRepository.findAll(Sort.by(Sort.Direction.ASC,"nombreubicacion"));
    }

    // LISTAR TODAS LAS UBICACIONES 
    @Transactional(readOnly = true)
    public List<Ubicacion> listarUbicacionesActivas() {
        return ubicacionRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"nombreubicacion"));
    }

    @Transactional
    public Optional<Ubicacion> obtenerUbicacionPorId(Integer id) {
        return ubicacionRepository.findById(id);
    }

@Transactional
    public Ubicacion guardarUbicacion(Ubicacion ubicacion) {
        String nombreLimpio = ubicacion.getNombreubicacion() != null ? ubicacion.getNombreubicacion().trim() : "";


        if (ubicacionRepository.findFirstByNombreubicacionIgnoreCase(nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        boolean esNueva = (ubicacion.getIdUbicacion() == null);
        if (esNueva) {
            ubicacion.setActivo(true);
        }

        ubicacion.setNombreubicacion(nombreLimpio);

        if (ubicacion.getSiglasubicacion() != null) {
            ubicacion.setSiglasubicacion(ubicacion.getSiglasubicacion().trim().toUpperCase());
        }

        return ubicacionRepository.save(ubicacion);
    }

    @Transactional
    public Ubicacion actualizarUbicacion(Integer id, Ubicacion ubicacion) {
        String nombreLimpio = ubicacion.getNombreubicacion() != null ? ubicacion.getNombreubicacion().trim() : "";

        Optional<Ubicacion> ubicacionExistente = ubicacionRepository.findFirstByNombreubicacionIgnoreCase(nombreLimpio);
        if (ubicacionExistente.isPresent() && !ubicacionExistente.get().getIdUbicacion().equals(id)) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        Ubicacion ubicacionActual = ubicacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        ubicacionActual.setNombreubicacion(nombreLimpio);

        if (ubicacion.getSiglasubicacion() != null) {
            ubicacionActual.setSiglasubicacion(ubicacion.getSiglasubicacion().trim().toUpperCase());
        }

        return ubicacionRepository.save(ubicacionActual);
    }



    @Transactional
    public void desactivarUbicacion(Integer id){
        Ubicacion ubicacion = ubicacionRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Ubicacion no encontrada"));

        ubicacion.setActivo(false);
        ubicacionRepository.save(ubicacion);
    }

    @Transactional
    public void activarUbicacion(Integer id){
        Ubicacion ubicacion = ubicacionRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Ubicacion no encontrada"));

        ubicacion.setActivo(true);
        ubicacionRepository.save(ubicacion);
    }

}

