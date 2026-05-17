package com.sistemainventario.inventario.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.sistemainventario.inventario.model.Marca;
import java.util.List;


@Repository
public interface MarcaRepository extends JpaRepository<Marca, Integer>{

    List<Marca> findByActivoTrue(Sort sort);

}
