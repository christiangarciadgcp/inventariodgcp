package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.PresupuestoHistorial;

@Repository
public interface PresupuestoHistorialRepository extends JpaRepository<PresupuestoHistorial, Long> {

}
