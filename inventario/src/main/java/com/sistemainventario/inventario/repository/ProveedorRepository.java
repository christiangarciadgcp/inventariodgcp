package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Proveedor;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor,Integer>{

    List<Proveedor> findByActivoTrue(Sort sort);

}