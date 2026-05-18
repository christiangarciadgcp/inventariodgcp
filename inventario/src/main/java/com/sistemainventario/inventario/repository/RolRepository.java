package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.Rol;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer>{

    Optional<Rol> findByNombrerol(String nombrerol);
}
