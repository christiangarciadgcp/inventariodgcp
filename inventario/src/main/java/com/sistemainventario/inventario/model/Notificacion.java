package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import java.time.Instant;

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

    public Notificacion() {
    }

    public Long getIdNotificacion() {
        return idNotificacion;
    }

    public void setIdNotificacion(Long idNotificacion) {
        this.idNotificacion = idNotificacion;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }

    
}
