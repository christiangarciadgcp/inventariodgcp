package com.sistemainventario.inventario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.dto.modeloDTO.ModeloDTO;
import com.sistemainventario.inventario.model.Marca;
import com.sistemainventario.inventario.model.Modelo;
import com.sistemainventario.inventario.repository.MarcaRepository;
import com.sistemainventario.inventario.repository.ModeloRepository;

@Service
public class ModeloService {

    private final ModeloRepository modeloRepository;
    private final MarcaRepository marcaRepository;

    public ModeloService(ModeloRepository modeloRepository,
                        MarcaRepository marcaRepository
    ){
        this.modeloRepository = modeloRepository;
        this.marcaRepository = marcaRepository;
    }

    public List<Modelo> listarModelos(){
        return modeloRepository.findAll(Sort.by(Sort.Direction.ASC,"nombremodelo"));
    }

    public List<Modelo> listarModelosActivos(){
        return modeloRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"nombremodelo"));
    }

    public List<Modelo> listarModelosPorMarca(Integer idMarca){
        return modeloRepository.findByMarca_IdMarcaAndActivoTrue(idMarca, Sort.by(Sort.Direction.ASC,"nombremodelo"));
    }

    public Optional<Modelo> obtenerModeloPorId(Integer id){
        return modeloRepository.findById(id);
    }

    @Transactional
    public Modelo guardarModelo(ModeloDTO modeloDTO){
        Marca marca = marcaRepository.findById(modeloDTO.getIdMarca())
                .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        Modelo modelo = new Modelo();
        modelo.setNombremodelo(modeloDTO.getNombremodelo());
        modelo.setMarca(marca);
        modelo.setActivo(true);

        return modeloRepository.save(modelo);
    }

    @Transactional
    public Modelo actualizarModelo(Integer id, ModeloDTO modeloDTO){
        Modelo modeloActual = modeloRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

        Marca marca = marcaRepository.findById(modeloDTO.getIdMarca())
        .orElseThrow(() -> new RuntimeException("Marca no encontrada"));

        modeloActual.setNombremodelo(modeloDTO.getNombremodelo());
        modeloActual.setMarca(marca);

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
