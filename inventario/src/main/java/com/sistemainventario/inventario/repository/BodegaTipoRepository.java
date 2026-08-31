package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.BodegaTipo;
import org.springframework.data.domain.Sort;
import java.util.Optional;
import java.util.List;


@Repository
public interface BodegaTipoRepository extends JpaRepository<BodegaTipo, Integer>{

    Optional<BodegaTipo> findByTipobodega(String tipobodega);

    List<BodegaTipo> findByActivoTrue(Sort sort);

}