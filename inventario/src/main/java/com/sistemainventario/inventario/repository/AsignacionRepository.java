package com.sistemainventario.inventario.repository;
import com.sistemainventario.inventario.model.Asignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

    List<Asignacion> findAllByOrderByFechaAsignacionDesc();

    // Obtener el mayor correlativo activo (NO CANCELADO) para el año dado
    @Query("SELECT MAX(a.correlativo) FROM Asignacion a WHERE a.anio = :anio AND a.estado <> 'CANCELADA'")
    Optional<Integer> findMaxCorrelativoNoCancelado(@Param("anio") Integer anio);
}