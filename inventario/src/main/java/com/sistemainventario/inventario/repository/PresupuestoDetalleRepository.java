package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.Presupuesto;
import com.sistemainventario.inventario.model.PresupuestoDetalle;
import java.util.List;

@Repository
public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long> {

    List<PresupuestoDetalle> findByPresupuesto(Presupuesto presupuesto);

    void deleteByPresupuesto(Presupuesto presupuesto);

    // Cuenta cuántas unidades de este equipo físico ya fueron despachadas en presupuestos activos de esta ubicación
    @Query("SELECT COALESCE(SUM(pd.cantidad_despachada), 0) " +
           "FROM PresupuestoDetalle pd " +
           "WHERE pd.productoFisico.idProducto = :idProductoFisico " +
           "AND pd.presupuesto.ubicacion.idUbicacion = :idUbicacion " +
           "AND pd.presupuesto.estado <> 'CANCELADO' " +
           "AND pd.cantidad_despachada > 0 " +
           "AND COALESCE(pd.presupuesto.fechaSalida, pd.presupuesto.fecha_modificacion) >= COALESCE((" +
           "   SELECT MAX(ad.fechaDevolucion) FROM AsignacionDetalle ad " +
           "   WHERE ad.producto.idProducto = :idProductoFisico AND ad.estado = 'DEVUELTO'" +
           "), COALESCE(pd.presupuesto.fechaSalida, pd.presupuesto.fecha_modificacion))")
    int contarEquipoDespachadoEnUbicacion(
            @Param("idProductoFisico") Integer idProductoFisico,
            @Param("idUbicacion") Integer idUbicacion);
}