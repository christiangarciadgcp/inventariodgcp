package com.sistemainventario.inventario.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.Modelo;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModeloRepository extends JpaRepository<Modelo, Integer>{

    List<Modelo> findByActivoTrue(Sort sort);

    //BUSQUEDA DE MODELOS ACTIVOS POR ID_MARCA  q
    List<Modelo> findByMarca_IdMarcaAndActivoTrue(Integer idMarca, Sort sort);

    Optional<Modelo> findFirstByNombremodeloIgnoreCase(String nombremodelo);

    // Buscar el modelo verificando también a qué marca pertenece
    Optional<Modelo> findFirstByNombremodeloIgnoreCaseAndMarca_NombremarcaIgnoreCase(String nombremodelo, String nombremarca);

}
