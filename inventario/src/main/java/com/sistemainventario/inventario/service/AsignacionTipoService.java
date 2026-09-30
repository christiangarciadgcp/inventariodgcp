package com.sistemainventario.inventario.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.AsignacionTipo;
import com.sistemainventario.inventario.repository.AsignacionTipoRepository;

@Service 
public class AsignacionTipoService {

    private final AsignacionTipoRepository asignacionTipoRepository;

    public AsignacionTipoService(AsignacionTipoRepository asignacionTipoRepository){
        this.asignacionTipoRepository = asignacionTipoRepository;
    }

    public List<AsignacionTipo> listarTodos(){
        return asignacionTipoRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre"));
    }

    public List<AsignacionTipo> listarActivos(){
        return asignacionTipoRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "nombre"));
    }

    @Transactional
    public AsignacionTipo guardarAsignacionTipo (AsignacionTipo asignacionTipo){
        return asignacionTipoRepository.save(asignacionTipo);
    }

    @Transactional
    public AsignacionTipo actualizarAsignacionTipo(Integer id, AsignacionTipo asignacionTipo){
        AsignacionTipo actual = asignacionTipoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de Asignación no encontrado"));
        actual.setNombre(asignacionTipo.getNombre());
        actual.setDescripcion(asignacionTipo.getDescripcion());
        return asignacionTipoRepository.save(actual);
    }

    @Transactional
    public void cambiarEstado(Integer id, Boolean activo){
        AsignacionTipo actual = asignacionTipoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo Asignacion no encontrada"));
        actual.setActivo(activo);
        asignacionTipoRepository.save(actual);
    }

}
