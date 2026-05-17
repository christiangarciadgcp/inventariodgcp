package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.SolicitudCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SolicitudCompraRepository extends JpaRepository<SolicitudCompra, Long> {

    List<SolicitudCompra> findByEstado(String estado);

    Long countByEstado(String estado);
}
