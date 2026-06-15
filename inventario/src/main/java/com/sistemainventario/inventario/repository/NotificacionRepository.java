package com.sistemainventario.inventario.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import com.sistemainventario.inventario.model.Notificacion;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long>{

// Trae las últimas 20 notificaciones globales
List<Notificacion> findTop10ByOrderByFechaDesc();

// Cuenta cuántas NO ha leído un usuario específico
@Query("SELECT COUNT(n) FROM Notificacion n WHERE n.idNotificacion NOT IN " +
       "(SELECT nl.notificacion.idNotificacion FROM NotificacionLeida nl WHERE nl.usuario.idUsuario = :idUsuario)")
long countNoLeidasPorUsuario(@Param("idUsuario") Integer idUsuario);

// Obtiene la lista de notificaciones que un usuario específico NO ha leído
@Query("SELECT n FROM Notificacion n WHERE n.idNotificacion NOT IN " +
       "(SELECT nl.notificacion.idNotificacion FROM NotificacionLeida nl WHERE nl.usuario.idUsuario = :idUsuario)")
List<Notificacion> findNotificacionesNoLeidasPorUsuario(@Param("idUsuario") Integer idUsuario);
}
