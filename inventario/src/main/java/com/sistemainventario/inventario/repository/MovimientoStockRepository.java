package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.MovimientoStock;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long>{

    // Trae los últimos 10 movimientos con todos sus datos relacionados
    @EntityGraph(attributePaths = {"bodega", "producto", "producto.unidadMedida", "usuario"})
    List<MovimientoStock> findTop10ByOrderByFechaDesc();

    // Busca movimientos previos (transferencias) hacia la bodega de despacho
    // Excluimos la Bodega 1 (Despacho) para saber de qué bodega física salió.
    @Query("SELECT m FROM MovimientoStock m JOIN FETCH m.bodega JOIN FETCH m.producto WHERE m.motivo LIKE %:referencia% AND m.tipo = 'SALIDA' AND m.bodega.idBodega <> 1")
    List<MovimientoStock> findMovimientosDeOrigen(@Param("referencia") String referencia);


    // Busca el movimiento final de despacho para ver QUÍEN lo hizo
    // Buscamos movimientos en Bodega 1 con el motivo específico de despacho
    @Query("SELECT m FROM MovimientoStock m JOIN FETCH m.usuario WHERE m.motivo LIKE %:referencia% AND m.bodega.idBodega = 1 AND m.tipo = 'DESPACHO'")
    List<MovimientoStock> findMovimientosDeDespacho(@Param("referencia") String referencia);
/* 
    //Busqueda de TODOS los tipos de Movimientos por rango de fechas
    @EntityGraph(attributePaths = {"bodega", "producto", "usuario"})
    @Query("SELECT m FROM MovimientoStock m WHERE m.fecha >= :inicio AND m.fecha <= :fin ORDER BY m.fecha DESC")
    List<MovimientoStock> findMovimientosPorRangoDeFechas(
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin
    );

    //Busqueda de TODOS los tipos de Movimientos por rango de fechas y filtro de TIPO
    @EntityGraph(attributePaths = {"bodega", "producto", "usuario"})
    @Query("SELECT m FROM MovimientoStock m WHERE m.fecha >= :inicio AND m.fecha <= :fin AND tipo = :tipo ORDER BY m.fecha DESC")
    List<MovimientoStock> findMovimientosPorRangoYTipo(
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin,
        @Param("tipo") String tipo
    ); */

    @Query("SELECT m FROM MovimientoStock m " +
           "JOIN FETCH m.bodega " +
           "JOIN FETCH m.usuario " +
           "JOIN FETCH m.producto p " +
           "LEFT JOIN FETCH p.categoria " +
           "WHERE m.fecha >= :inicio AND m.fecha <= :fin ORDER BY m.fecha ASC")
    List<MovimientoStock> findMovimientosPorRangoDeFechas(
    @Param("inicio") Instant inicio,
    @Param("fin") Instant fin
    );

    @Query("SELECT m FROM MovimientoStock m " +
    "JOIN FETCH m.bodega " +
    "JOIN FETCH m.usuario " +
    "JOIN FETCH m.producto p " +
    "LEFT JOIN FETCH p.categoria " +
    "WHERE m.fecha >= :inicio AND m.fecha <= :fin AND m.tipo = :tipo ORDER BY m.fecha ASC")
    List<MovimientoStock> findMovimientosPorRangoYTipo(
        @Param("inicio") Instant inicio,
        @Param("fin") Instant fin,
        @Param("tipo") String tipo
    );

}

