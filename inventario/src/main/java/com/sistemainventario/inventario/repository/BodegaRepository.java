package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Bodega;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface BodegaRepository extends JpaRepository<Bodega, Integer>{

    List<Bodega> findByActivoTrue(Sort sort);

}
