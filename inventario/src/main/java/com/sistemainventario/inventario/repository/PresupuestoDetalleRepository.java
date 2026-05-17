package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.Presupuesto;
import com.sistemainventario.inventario.model.PresupuestoDetalle;
import java.util.List;


@Repository
public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long>{
    List<PresupuestoDetalle> findByPresupuesto(Presupuesto presupuesto);
    void deleteByPresupuesto(Presupuesto presupuesto);
}
