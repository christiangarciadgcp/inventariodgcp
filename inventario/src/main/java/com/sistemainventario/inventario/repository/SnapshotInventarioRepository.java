package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.SnapshotInventario;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SnapshotInventarioRepository extends JpaRepository<SnapshotInventario, Long> {

    @Modifying
    @Query(value = "INSERT INTO snapshot_inventario (fechasnapshot, cantidadactual, idproducto, idbodega) " +
                   "SELECT CURRENT_TIMESTAMP, i.cantidad_actual, i.idproducto, i.idbodega " +
                   "FROM inventario i " +
                   "WHERE i.cantidad_actual > 0", 
           nativeQuery = true)
    void generarSnapshotDiario();

    @Query("SELECT s FROM SnapshotInventario s " +
           "JOIN FETCH s.producto p " +
           "JOIN FETCH s.bodega b " +
           "LEFT JOIN FETCH p.categoria " +
           "WHERE b.idBodega = :idBodega AND s.fechasnapshot >= :inicio AND s.fechasnapshot <= :fin " +
           "ORDER BY p.nombreproducto ASC")
            List<SnapshotInventario> findSnapshotPorBodegaYFecha(
            @Param("idBodega") Integer idBodega,
            @Param("inicio") java.time.Instant inicio,
            @Param("fin") java.time.Instant fin
    );
}
