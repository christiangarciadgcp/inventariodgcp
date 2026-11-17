package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Asignacion;
import com.sistemainventario.inventario.model.AsignacionDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignacionDetalleRepository extends JpaRepository<AsignacionDetalle, Long> {

    List<AsignacionDetalle> findByAsignacion(Asignacion asignacion);

    // Solo trae asignaciones que fueron aprobadas (ignora REGISTRADA y CANCELADA)
    @Query("SELECT d FROM AsignacionDetalle d " +
           "JOIN FETCH d.asignacion a " +
           "JOIN FETCH a.tipoAsignacion " +
           "JOIN FETCH d.producto p " +
           "LEFT JOIN FETCH p.modelo m " +
           "LEFT JOIN FETCH m.marca " +
           "LEFT JOIN FETCH d.bodegaOrigen " +
           "LEFT JOIN FETCH d.bodegaDevolucion " +
           "WHERE a.estado NOT IN ('REGISTRADA', 'CANCELADA') " +
           "ORDER BY a.fechaAsignacion DESC")
    List<AsignacionDetalle> findAllAsignacionesHistoricas();

    // Línea de tiempo exclusiva de actas aprobadas y movimientos reales del producto
    @Query("SELECT d FROM AsignacionDetalle d " +
           "JOIN FETCH d.asignacion a " +
           "JOIN FETCH a.tipoAsignacion " +
           "JOIN FETCH a.usuarioCreacion " +
           "LEFT JOIN FETCH d.bodegaDevolucion " +
           "LEFT JOIN FETCH d.usuarioDevolucion " +
           "WHERE d.producto.idProducto = :idProducto AND a.estado NOT IN ('REGISTRADA', 'CANCELADA') " +
           "ORDER BY a.fechaAsignacion ASC")
    List<AsignacionDetalle> findHistorialPorProducto(@Param("idProducto") Integer idProducto);

    // Busca si el equipo está reservado (PENDIENTE) o aprobado (ASIGNADO) para la misma ubicación del presupuesto
    @Query("SELECT d FROM AsignacionDetalle d " +
           "JOIN FETCH d.asignacion a " +
           "JOIN FETCH d.bodegaOrigen " +
           "WHERE d.producto.idProducto = :idProductoFisico " +
           "AND a.ubicacion.idUbicacion = :idUbicacion " +
           "AND a.estado IN ('REGISTRADA', 'ASIGNADA', 'DEVOLUCION PARCIAL') " +
           "AND d.estado IN ('PENDIENTE', 'ASIGNADO')")
    List<AsignacionDetalle> buscarAsignacionesActivasEnUbicacion(
            @Param("idProductoFisico") Integer idProductoFisico,
            @Param("idUbicacion") Integer idUbicacion);
}