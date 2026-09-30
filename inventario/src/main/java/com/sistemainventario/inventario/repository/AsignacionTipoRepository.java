package com.sistemainventario.inventario.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.AsignacionTipo;
import java.util.List;
import java.util.Optional;


@Repository 
public interface AsignacionTipoRepository extends JpaRepository<AsignacionTipo, Integer>{

    List<AsignacionTipo> findByActivoTrue(Sort sort);

    Optional<AsignacionTipo> findByNombreIgnoreCase(String nombre);

}
