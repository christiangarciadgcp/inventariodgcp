package com.sistemainventario.inventario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.Modelo;
import com.sistemainventario.inventario.repository.ModeloRepository;

@Service
public class ModeloService {

    private final ModeloRepository modeloRepository;

    public ModeloService(ModeloRepository modeloRepository){
        this.modeloRepository = modeloRepository;
    }

    public List<Modelo> listarModelos(){
        return modeloRepository.findAll(Sort.by(Sort.Direction.ASC,"idModelo"));
    }

    public List<Modelo> listarModelosActivos(){
        return modeloRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"idModelo"));
    }

    public Optional<Modelo> obtenerModeloPorId(Integer id){
        return modeloRepository.findById(id);
    }

    @Transactional
    public Modelo guardarModelo(Modelo modelo){
        return modeloRepository.save(modelo);
    }

    @Transactional
    public Modelo actualizarModelo(Integer id, Modelo modelo){
        Modelo modeloActual = modeloRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        modeloActual.setNombremodelo(modelo.getNombremodelo());

        return modeloRepository.save(modeloActual);
    }

    @Transactional
    public void desactivarModelo(Integer id){
        Modelo modelo = modeloRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        modelo.setActivo(false);
        modeloRepository.save(modelo);

    }

    @Transactional
    public void activarModelo(Integer id){
        Modelo modelo = modeloRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        modelo.setActivo(true);
        modeloRepository.save(modelo);
        
    }

}
