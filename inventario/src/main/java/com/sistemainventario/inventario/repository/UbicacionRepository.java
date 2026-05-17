package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Ubicacion;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface UbicacionRepository extends JpaRepository<Ubicacion, Integer>{

    List<Ubicacion> findByActivoTrue(Sort sort);

}
