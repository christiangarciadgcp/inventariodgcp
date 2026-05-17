package com.sistemainventario.inventario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.Marca;
import com.sistemainventario.inventario.repository.MarcaRepository;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;

    //CONSTRUCTOR
    public MarcaService(MarcaRepository marcaRepository){
        this.marcaRepository = marcaRepository;
    }

    public List<Marca> listarMarcas(){
        return marcaRepository.findAll(Sort.by(Sort.Direction.ASC,"idMarca"));
    }

    public List<Marca> listarMarcasActivas(){
        return marcaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"idMarca"));
    }

    public Optional<Marca> obtenerMarcaPorId(Integer id){
        return marcaRepository.findById(id);
    }

    @Transactional
    public Marca guardarMarca(Marca marca){
        return marcaRepository.save(marca);
    }

    @Transactional
    public Marca actualizarMarca(Integer id, Marca marca){
        Marca marcaActual = marcaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        marcaActual.setNombremarca(marca.getNombremarca());

        return marcaRepository.save(marcaActual);
    }

    @Transactional
    public void desactivarMarca(Integer id){
        Marca marca = marcaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        marca.setActivo(false);
        marcaRepository.save(marca);
    }

    @Transactional
    public void activarMarca(Integer id){
        Marca marca = marcaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        marca.setActivo(true);
        marcaRepository.save(marca);
    }

}
