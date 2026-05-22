package com.sistemainventario.inventario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.Marca;
import com.sistemainventario.inventario.model.Modelo;
import com.sistemainventario.inventario.repository.MarcaRepository;
import com.sistemainventario.inventario.repository.ModeloRepository;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;
    private final ModeloRepository modeloRepository;

    //CONSTRUCTOR
    public MarcaService(MarcaRepository marcaRepository,
        ModeloRepository modeloRepository){
        this.marcaRepository = marcaRepository;
        this.modeloRepository = modeloRepository;
    }

    public List<Marca> listarMarcas(){
        return marcaRepository.findAll(Sort.by(Sort.Direction.ASC,"nombremarca"));
    }

    public List<Marca> listarMarcasActivas(){
        return marcaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"nombremarca"));
    }

    public Optional<Marca> obtenerMarcaPorId(Integer id){
        return marcaRepository.findById(id);
    }

    @Transactional
    public Marca guardarMarca(Marca marca){

        boolean esNuevaMarca = (marca.getIdMarca() == null);

        if (esNuevaMarca) {
            marca.setActivo(true);
        }

        Marca marcaGuardada = marcaRepository.save(marca);

        if (esNuevaMarca) {
            Modelo modeloSinEspecificar = new Modelo();
            modeloSinEspecificar.setNombremodelo("SIN ESPECIFICAR");
            modeloSinEspecificar.setMarca(marcaGuardada);
            modeloSinEspecificar.setActivo(true);
            
            modeloRepository.save(modeloSinEspecificar);
        }

        return marcaGuardada;
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
