package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Bodega;
import com.sistemainventario.inventario.model.Inventario;
import com.sistemainventario.inventario.model.InventarioId;
import com.sistemainventario.inventario.model.Producto;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.InventarioRepository;
import com.sistemainventario.inventario.repository.ProductoRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BodegaService {

    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;

    public BodegaService(BodegaRepository bodegaRepository, ProductoRepository productoRepository, InventarioRepository inventarioRepository) {
        this.bodegaRepository = bodegaRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
    }

    public List<Bodega> listarBodegas(){
        return bodegaRepository.findAll(Sort.by(Sort.Direction.ASC, "idBodega"));
    }

    public List<Bodega> listarBodegasActivas(){
        return bodegaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC, "idBodega"));
    }

    public Optional<Bodega> buscarBodegaPorId(Integer id){
        return bodegaRepository.findById(id);
    }

    @Transactional
    public Bodega guardarBodega(Bodega bodega){

        Boolean nuevaBodega = (bodega.getIdBodega() == null);

        if(nuevaBodega){
            bodega.setActivo(true);
        }

        Bodega bodegaGuardada = bodegaRepository.save(bodega);

        if(nuevaBodega){
            List<Producto> productos = productoRepository.findAll();
            List<Inventario> inventarioInicial = new ArrayList<>();

            for (Producto p : productos){
                Inventario inventario = new Inventario();

                InventarioId id = new InventarioId();
                id.setIdBodega(bodegaGuardada.getIdBodega());
                id.setIdProducto(p.getIdProducto());
                inventario.setId(id);

                inventario.setBodega(bodegaGuardada);
                inventario.setProducto(p);
                inventario.setCantidad_actual(0);

                inventarioInicial.add(inventario);
            }

            if(!inventarioInicial.isEmpty()){
                inventarioRepository.saveAll(inventarioInicial);
            }
        }

        return bodegaGuardada;

    }

    @Transactional
    public Bodega actualizarBodega(Integer id,Bodega bodega){
        Bodega bodegaActual = bodegaRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Bodega no encontrada"));

        bodegaActual.setNombrebodega(bodega.getNombrebodega());
        bodegaActual.setDireccionbodega(bodega.getDireccionbodega());
        bodegaActual.setTelefonobodega(bodega.getTelefonobodega());

        return bodegaRepository.save(bodegaActual);
    }

    @Transactional
    public void desactivarBodega(Integer id){
        boolean tieneStock = inventarioRepository.existeStockEnBodega(id);

        if(tieneStock){
            throw new RuntimeException("No se puede desactivar la bodega porque aún cuenta con productos con stock");
        }

        Bodega bodega = bodegaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        bodega.setActivo(false);
        bodegaRepository.save(bodega);
    }

    @Transactional
    public void activarBodega(Integer id){

        Bodega bodega = bodegaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        bodega.setActivo(true);
        bodegaRepository.save(bodega);
    }

}
