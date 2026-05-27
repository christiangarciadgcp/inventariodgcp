package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Categoria;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer>{

    List<Categoria> findByActivoTrue(Sort sort);
}
