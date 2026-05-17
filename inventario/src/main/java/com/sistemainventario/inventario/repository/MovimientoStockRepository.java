package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.MovimientoStock;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long>{

    // Trae los últimos 10 movimientos con todos sus datos relacionados
    @EntityGraph(attributePaths = {"bodega", "producto", "usuario"})
    List<MovimientoStock> findTop10ByOrderByFechaDesc();

    // Busca movimientos previos (transferencias) hacia la bodega de despacho
    // Excluimos la Bodega 1 (Despacho) para saber de qué bodega física salió.
    @Query("SELECT m FROM MovimientoStock m JOIN FETCH m.bodega JOIN FETCH m.producto WHERE m.motivo LIKE %:referencia% AND m.tipo = 'SALIDA' AND m.bodega.idBodega <> 1")
    List<MovimientoStock> findMovimientosDeOrigen(@Param("referencia") String referencia);


    // Busca el movimiento final de despacho para ver QUÍEN lo hizo
    // Buscamos movimientos en Bodega 1 con el motivo específico de despacho
    @Query("SELECT m FROM MovimientoStock m JOIN FETCH m.usuario WHERE m.motivo LIKE %:referencia% AND m.bodega.idBodega = 1 AND m.tipo = 'DESPACHO'")
    List<MovimientoStock> findMovimientosDeDespacho(@Param("referencia") String referencia);
}

