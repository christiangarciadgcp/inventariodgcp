package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Producto;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer>{

    List<Producto> findByNombreproductoContainingIgnoreCase(String nombreproducto);

    Optional<Producto> findByskuproducto(String skuproducto);

    Iterable<Producto> findByCategoria_IdCategoria(Integer idCategoria);

    //PRODUCTOS SOLAMENTE ACTIVOS
    List<Producto> findByActivoTrue(Sort sort);
    // List<Producto> findByActivoTrue();
}
