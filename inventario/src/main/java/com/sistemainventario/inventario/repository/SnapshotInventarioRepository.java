package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.SnapshotInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnapshotInventarioRepository extends JpaRepository<SnapshotInventario,Long>{
}
