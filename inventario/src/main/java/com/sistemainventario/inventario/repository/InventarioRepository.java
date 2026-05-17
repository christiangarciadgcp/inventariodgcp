package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Inventario;
import com.sistemainventario.inventario.model.InventarioId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Sort;
import java.util.List;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, InventarioId> {

    //MUESTRA EL INVENTARIO DE UNA BODEGA EN ESPECIFICO 
    @Query("SELECT i FROM Inventario i JOIN FETCH i.producto p LEFT JOIN FETCH p.categoria WHERE i.bodega.idBodega = :idBodega AND p.activo = true")
    List<Inventario> findByBodega_IdBodega(Integer idBodega, Sort sort);

    @Query("SELECT i FROM Inventario i JOIN FETCH i.bodega WHERE i.id.idProducto = :idProducto AND i.cantidad_actual > 0")
    List<Inventario> findByIdIdProducto(Integer idProducto);

    List<Inventario> findByIdIdBodega(Integer idBodega);

    //VALIDA SI HAY UN PRODUCTO CON STOCK > 0 PARA PODER DESACTIVARLO
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Inventario i WHERE i.producto.idProducto = :idProducto AND i.cantidad_actual > :cantidad")
    boolean verificarStock(
            @Param("idProducto") Integer idProducto, 
            @Param("cantidad") Integer cantidad
    );

    //VALIDA SI HAY UN PRODUCTO CON STOCK > 0 EN ESA BODEGA PARA PODER DESACTIVARLA
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Inventario i WHERE i.bodega.idBodega = :idBodega AND i.cantidad_actual > 0")
    boolean existeStockEnBodega(@Param("idBodega") Integer idBodega);

}
