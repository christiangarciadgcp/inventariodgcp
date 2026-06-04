package com.sistemainventario.inventario.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.SolicitudCompraHistorial;

@Repository
public interface SolicitudCompraHistorialRepository extends JpaRepository<SolicitudCompraHistorial, Long>{

}
