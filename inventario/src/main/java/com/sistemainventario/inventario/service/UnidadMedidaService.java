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
        return unidadMedidaRepository.findAll(Sort.by(Sort.Direction.ASC,"nombreunidadmedida"));
    }

    public List<UnidadMedida> listarUnidadMedidasActivas(){
        return unidadMedidaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"nombreunidadmedida"));
    }

    public Optional<UnidadMedida> obtenerUnidadMedidaPorId(Integer id) {
        return unidadMedidaRepository.findById(id);
    }

    @Transactional
    public UnidadMedida guardarUnidadMedida(UnidadMedida unidad) {
        return unidadMedidaRepository.save(unidad);
    }

    @Transactional
    public UnidadMedida actualizarUnidadMedida(Integer id, UnidadMedida unidadMedida){
        UnidadMedida unidadActual = unidadMedidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unidad de Medida no encontrada"));

        unidadActual.setNombreunidadmedida(unidadMedida.getNombreunidadmedida());
        unidadActual.setAbreviaturaunidadmedida((unidadMedida.getAbreviaturaunidadmedida()));

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
