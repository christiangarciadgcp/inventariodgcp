package com.sistemainventario.inventario.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sistemainventario.inventario.model.ProductoSugerencia;

@Repository
public interface ProductoSugerenciaRepository extends JpaRepository<ProductoSugerencia, Integer>{

    //BUSQUEDA DE SUGERENCIAS ORDENADAS POR FECHA DE CREACION 
    List<ProductoSugerencia> findAllByOrderByFechaSugerenciaDesc();

    //BUSQUEDA DE SUGERENCIAS POR USUARIO ORDENADAS POR FECHA DE CREACION
    List<ProductoSugerencia> findByUsuarioSolicitante_IdUsuarioOrderByFechaSugerenciaDesc(Integer idUsuario);

}
