package com.sistemainventario.inventario.repository;

import com.sistemainventario.inventario.model.NotificacionLeida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionLeidaRepository extends JpaRepository<NotificacionLeida, Long> {
    
    @Query("SELECT nl.notificacion.idNotificacion FROM NotificacionLeida nl WHERE nl.usuario.idUsuario = :idUsuario")
    List<Long> findIdsNotificacionesLeidasPorUsuario(@Param("idUsuario") Integer idUsuario);
}