package com.sistemainventario.inventario.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.Modelo;
import java.util.List;

@Repository
public interface ModeloRepository extends JpaRepository<Modelo, Integer>{

    List<Modelo> findByActivoTrue(Sort sort);

    //BUSQUEDA DE MODELOS ACTIVOS POR ID_MARCA  q
    List<Modelo> findByMarca_IdMarcaAndActivoTrue(Integer idMarca, Sort sort);

}
