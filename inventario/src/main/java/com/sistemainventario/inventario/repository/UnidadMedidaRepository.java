package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.UnidadMedida;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UnidadMedidaRepository extends  JpaRepository<UnidadMedida, Integer>{

    List<UnidadMedida> findByActivoTrue(Sort sort);
}
