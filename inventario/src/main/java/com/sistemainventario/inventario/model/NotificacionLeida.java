package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "notificacion_leida")
public class NotificacionLeida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_notificacion", nullable = false)
    private Notificacion notificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;
    
}
