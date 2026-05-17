package com.sistemainventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sistemainventario.inventario.model.Presupuesto;
import java.util.List;


@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long>{

    List<Presupuesto> findByEstado(String estado);

    Long countByEstado(String estado);

}
