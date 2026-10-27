package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.UnidadMedida;
import com.sistemainventario.inventario.repository.UnidadMedidaRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UnidadMedidaService {

    private final UnidadMedidaRepository unidadMedidaRepository;

    public UnidadMedidaService(UnidadMedidaRepository unidadMedidaRepository) {
        this.unidadMedidaRepository = unidadMedidaRepository;
    }

    public List<UnidadMedida> listarUnidadesMedidas() {
        return unidadMedidaRepository.findAll(Sort.by(Sort.Direction.ASC, "nombreunidadmedida"));
    }

    public List<UnidadMedida> listarUnidadMedidasActivas(){
        return unidadMedidaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "nombreunidadmedida"));
    }

    public Optional<UnidadMedida> obtenerUnidadMedidaPorId(Integer id) {
        return unidadMedidaRepository.findById(id);
    }

    @Transactional
    public UnidadMedida guardarUnidadMedida(UnidadMedida unidad) {
        String nombreLimpio = unidad.getNombreunidadmedida() != null ? unidad.getNombreunidadmedida().trim() : "";

        //VALIDACIÓN PREVIA EN CREACIÓN 
        if (unidadMedidaRepository.findFirstByNombreunidadmedidaIgnoreCase(nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        boolean esNueva = (unidad.getIdUnidadMedida() == null);
        if (esNueva) {
            unidad.setActivo(true);
        }

        unidad.setNombreunidadmedida(nombreLimpio);

        if (unidad.getAbreviaturaunidadmedida() != null) {
            unidad.setAbreviaturaunidadmedida(unidad.getAbreviaturaunidadmedida().trim());
        }

        return unidadMedidaRepository.save(unidad);
    }

    @Transactional
    public UnidadMedida actualizarUnidadMedida(Integer id, UnidadMedida unidadMedida){
        String nombreLimpio = unidadMedida.getNombreunidadmedida() != null ? unidadMedida.getNombreunidadmedida().trim() : "";

        // VALIDACIÓN PREVIA EN EDICIÓN
        Optional<UnidadMedida> unidadExistente = unidadMedidaRepository.findFirstByNombreunidadmedidaIgnoreCase(nombreLimpio);
        if (unidadExistente.isPresent() && !unidadExistente.get().getIdUnidadMedida().equals(id)) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        UnidadMedida unidadActual = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de Medida no encontrada"));

        unidadActual.setNombreunidadmedida(nombreLimpio);

        if (unidadMedida.getAbreviaturaunidadmedida() != null) {
            unidadActual.setAbreviaturaunidadmedida(unidadMedida.getAbreviaturaunidadmedida().trim());
        } else {
            unidadActual.setAbreviaturaunidadmedida(null);
        }

        return unidadMedidaRepository.save(unidadActual);
    }

    @Transactional
    public void eliminarUnidadMedida(Integer id) {
        unidadMedidaRepository.deleteById(id);
    }

    @Transactional
    public void desactivarUnidadMedida(Integer id){
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));

        unidadMedida.setActivo(false);
        unidadMedidaRepository.save(unidadMedida);
    }

    @Transactional
    public void activarUnidadMedida(Integer id){
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de medida no encontrada"));

        unidadMedida.setActivo(true);
        unidadMedidaRepository.save(unidadMedida);
    }
}
