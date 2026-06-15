package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Categoria;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;


@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer>{

    List<Categoria> findByActivoTrue(Sort sort);

    Optional<Categoria> findFirstByNombrecategoriaIgnoreCase(String nombrecategoria);
}
