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

    // GUARDAR NUEVA UBICACION
    @Transactional
    public Ubicacion guardarUbicacion(Ubicacion ubicacion) {
        return ubicacionRepository.save(ubicacion);
    }

    @Transactional
    public Ubicacion actualizarUbicacion(Integer id, Ubicacion ubicacion){
        Ubicacion ubicacionActual = ubicacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        ubicacionActual.setNombreubicacion(ubicacion.getNombreubicacion());
        ubicacionActual.setSiglasubicacion(ubicacion.getSiglasubicacion());

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

