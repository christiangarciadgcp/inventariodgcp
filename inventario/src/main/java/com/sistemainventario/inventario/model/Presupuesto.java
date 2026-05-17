package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.Instant;

@Data
@Entity
@Table(name = "presupuesto")
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpresupuesto")
    private Long idPresupuesto;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idusuariopresupuesto", nullable = false)
    private Usuario idusuariopresupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idubicacion", nullable = false)
    private Ubicacion ubicacion;

@OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @OrderBy("fecha DESC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<PresupuestoHistorial> historial;

    @Column(name = "nombre_presupuesto", nullable = false, length = 100)
    private String nombre_presupuesto;

    @Column(name = "estado",nullable = false, length = 150)
    private String estado;

    @Column(name = "observaciones", columnDefinition= "TEXT")
    private String observaciones;

    @Column(name = "fecha_creacion", nullable = false)
    private Instant fecha_creacion;

    @Column(name = "fecha_modificacion", nullable = false)
    private Instant fecha_modificacion;

    @PrePersist
    protected void onCreate() {
        if (this.fecha_creacion == null) {
            this.fecha_creacion = Instant.now();
        }
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
    }
    
}
