package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "presupuesto_historial")
public class PresupuestoHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idhistorial")
    private Long idHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpresupuesto", nullable = false)
    @JsonIgnore
    private Presupuesto presupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "fecha", nullable = false)
    private Instant fecha;


    public PresupuestoHistorial() {}

    public PresupuestoHistorial(Presupuesto presupuesto, Usuario usuario, String accion) {
        this.presupuesto = presupuesto;
        this.usuario = usuario;
        this.accion = accion;
        this.fecha = Instant.now();
    }
}