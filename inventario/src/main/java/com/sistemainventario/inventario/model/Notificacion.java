package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotificacion;

    @Column(nullable = false, length = 500)
    private String mensaje;

    @Column(nullable = false)
    private Instant fecha;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = Instant.now();
        }
    }
}
