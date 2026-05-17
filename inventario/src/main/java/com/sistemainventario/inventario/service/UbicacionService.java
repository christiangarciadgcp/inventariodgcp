package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Ubicacion;
import com.sistemainventario.inventario.repository.UbicacionRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;

    public UbicacionService(UbicacionRepository ubicacionRepository) {
        this.ubicacionRepository = ubicacionRepository;
    }

    // LISTAR TODAS LAS UBICACIONES 
    @Transactional(readOnly = true)
    public List<Ubicacion> listarTodas() {
        return ubicacionRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"idUbicacion"));
    }

    // GUARDAR NUEVA UBICACION
    @Transactional
    public Ubicacion guardarUbicacion(Ubicacion ubicacion) {
        return ubicacionRepository.save(ubicacion);
    }
}

