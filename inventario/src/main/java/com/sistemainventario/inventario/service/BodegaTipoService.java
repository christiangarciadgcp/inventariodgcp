package com.sistemainventario.inventario.service;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.BodegaTipo;
import com.sistemainventario.inventario.repository.BodegaTipoRepository;

import java.util.List;
import java.util.Optional;

@Service
public class BodegaTipoService {

    private final BodegaTipoRepository bodegaTipoRepository;

    public BodegaTipoService(BodegaTipoRepository bodegaTipoRepository){
        this.bodegaTipoRepository = bodegaTipoRepository;
    }

    public List<BodegaTipo> listarBodegasTipoActivas(){
       return bodegaTipoRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"tipobodega"));
    }

    public List<BodegaTipo> listarBodegasTipo(){
        return bodegaTipoRepository.findAll();
    }

    public Optional<BodegaTipo> buscarBodegaTipoPorId( Integer idBodegaTipo){
        return bodegaTipoRepository.findById(idBodegaTipo);
    }

    @Transactional
    public BodegaTipo guardarTipoBodega(BodegaTipo bodegaTipo){
        return bodegaTipoRepository.save(bodegaTipo);
    }

    @Transactional
    public void eliminarTipoBodega(Integer idBodegaTipo){
        bodegaTipoRepository.deleteById(idBodegaTipo);
    }

}
