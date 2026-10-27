package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sistemainventario.inventario.model.Presupuesto;
import java.util.List;
import java.util.Optional;


@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long>{

    List<Presupuesto> findByEstado(String estado);

    Long countByEstado(String estado);

    @Query("SELECT MAX(p.correlativo) FROM Presupuesto p WHERE p.anio = :anio AND p.estado <> 'CANCELADO'")
    Optional<Integer> findMaxCorrelativoNoCancelado(@Param("anio") Integer anio);

}
