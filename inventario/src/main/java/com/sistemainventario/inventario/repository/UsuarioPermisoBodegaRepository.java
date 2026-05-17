package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.UsuarioPermisoBodega;
import com.sistemainventario.inventario.model.UsuarioPermisoBodegaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UsuarioPermisoBodegaRepository extends JpaRepository<UsuarioPermisoBodega, UsuarioPermisoBodegaId> {

    List<UsuarioPermisoBodega> findByIdIdUsuario(Integer idUsuario);
}
