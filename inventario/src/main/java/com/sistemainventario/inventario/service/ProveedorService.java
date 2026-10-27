package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Proveedor;
import com.sistemainventario.inventario.repository.ProveedorRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<Proveedor> listarProveedores(){
        return proveedorRepository.findAll(Sort.by(Sort.Direction.ASC,"idProveedor"));
    }

    public List<Proveedor> listaProveedoresActivos(){
        return proveedorRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"idProveedor"));
    }

    public Optional<Proveedor> obtenerProveedorPorId(Integer id) {
        return proveedorRepository.findById(id);
    }

    @Transactional
    public Proveedor guardarProveedor(Proveedor proveedor){
        String nombreLimpio = proveedor.getNombreproveedor() != null ? proveedor.getNombreproveedor().trim() : "";

        // 1. Evita quemar la secuencia de IDs si ya existe
        if (proveedorRepository.findFirstByNombreproveedorIgnoreCase(nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        boolean esNuevo = (proveedor.getIdProveedor() == null);
        if (esNuevo) {
            proveedor.setActivo(true);
        }
        proveedor.setNombreproveedor(nombreLimpio);

        return proveedorRepository.save(proveedor);
    }

    @Transactional
    public Proveedor actualizaProveedor(Integer id, Proveedor proveedor){
        String nombreLimpio = proveedor.getNombreproveedor() != null ? proveedor.getNombreproveedor().trim() : "";

        // 2. Valida duplicados contra otros proveedores distintos al actual
        Optional<Proveedor> proveedorExistente = proveedorRepository.findFirstByNombreproveedorIgnoreCase(nombreLimpio);
        if (proveedorExistente.isPresent() && !proveedorExistente.get().getIdProveedor().equals(id)) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        Proveedor proveedorActual = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        proveedorActual.setNombreproveedor(nombreLimpio);
        proveedorActual.setTelefonoproveedor(proveedor.getTelefonoproveedor());

        return proveedorRepository.save(proveedorActual);
    }


    @Transactional
    public void eliminarProveedor(Integer idProveedor){
        proveedorRepository.deleteById(idProveedor);
    }

    @Transactional
    public void desactivarProveedor(Integer id){
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Proveedor no encontrado"));

        proveedor.setActivo(false);
        proveedorRepository.save(proveedor);
    }

    @Transactional
    public void activarProveedor(Integer id){
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Proveedor no encontrado"));

        proveedor.setActivo(true);
        proveedorRepository.save(proveedor);
    }

}
