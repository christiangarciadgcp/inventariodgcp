package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.UnidadMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnidadMedidaRepository extends  JpaRepository<UnidadMedida, Integer>{
}
