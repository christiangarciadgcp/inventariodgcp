package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Producto;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer>{

    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN FETCH p.categoria " +
           "LEFT JOIN FETCH p.proveedor " +
           "LEFT JOIN FETCH p.unidadMedida " +
           "LEFT JOIN FETCH p.modelo m " +
           "LEFT JOIN FETCH m.marca " +
           "LEFT JOIN FETCH p.productoPadre pad " +
           "LEFT JOIN FETCH pad.categoria " +
           "LEFT JOIN FETCH pad.unidadMedida " +
           "ORDER BY p.idProducto ASC")
    List<Producto> findAllOptimizado(Sort sort);

    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN FETCH p.categoria " +
           "LEFT JOIN FETCH p.proveedor " +
           "LEFT JOIN FETCH p.unidadMedida " +
           "LEFT JOIN FETCH p.modelo m " +
           "LEFT JOIN FETCH m.marca " +
           "LEFT JOIN FETCH p.productoPadre pad " +
           "LEFT JOIN FETCH pad.categoria " +
           "LEFT JOIN FETCH pad.unidadMedida " +
           "WHERE p.activo = true " +
           "ORDER BY p.idProducto ASC")
    List<Producto> findByActivoTrueOptimizado(Sort sort);

    List<Producto> findByNombreproductoContainingIgnoreCase(String nombreproducto);

    Optional<Producto> findFirstByNombreproductoIgnoreCaseAndEsGenericoTrue(String nombreproducto);

    Optional<Producto> findByskuproducto(String skuproducto);

    Iterable<Producto> findByCategoria_IdCategoria(Integer idCategoria);

    //PRODUCTOS SOLAMENTE ACTIVOS
    List<Producto> findByActivoTrue(Sort sort);

    // Llena el selector de padres en el formulario
    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN FETCH p.categoria " +
           "LEFT JOIN FETCH p.unidadMedida " +
           "LEFT JOIN FETCH p.imagenes " +
           "WHERE p.esGenerico = true AND p.activo = true " +
           "ORDER BY p.nombreproducto ASC")
    List<Producto> findByEsGenericoTrueAndActivoTrue();

    // Busca sustitutos físicos cuando se despacha un genérico
    List<Producto> findByProductoPadre_IdProductoAndActivoTrue(Integer idProductoPadre);

    List<Producto> findByEsAsignableTrue(Sort sort);

    Long countByEsGenericoFalse();
        
}