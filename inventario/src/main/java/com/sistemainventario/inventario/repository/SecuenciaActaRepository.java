package com.sistemainventario.inventario.repository;
import com.sistemainventario.inventario.model.SecuenciaActa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository 
public interface SecuenciaActaRepository extends JpaRepository<SecuenciaActa, Integer> {
    Optional<SecuenciaActa> findByAnio(Integer anio);
}