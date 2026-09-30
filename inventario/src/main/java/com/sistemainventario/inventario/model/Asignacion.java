package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "asignacion")
public class Asignacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignacion")
    private Long idAsignacion;

    @Column(name = "numero_acta", length = 50)
    private String numeroActa;

    @Column(name = "correlativo")
    private Integer correlativo;

    @Column(name = "anio", nullable = false)
    private Integer anio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idasignaciontipo", nullable = false)
    private AsignacionTipo tipoAsignacion;

    @Column(name = "responsable_destino", nullable = false, length = 255)
    private String responsableDestino;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_asignacion", nullable = false)
    private Instant fechaAsignacion;

    @Column(name = "estado", nullable = false, length = 50)
    private String estado; // REGISTRADA, ASIGNADA, DEVUELTA_PARCIAL, DEVUELTA, CANCELADA

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_creacion", nullable = false)
    private Usuario usuarioCreacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_aprobacion")
    private Usuario usuarioAprobacion;

    @Column(name = "fecha_aprobacion")
    private Instant fechaAprobacion;

    @JsonIgnore
    @OneToMany(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<AsignacionDetalle> detalles = new ArrayList<>();

    @OneToMany(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("fecha ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<AsignacionHistorial> historial = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.fechaAsignacion == null) {
            this.fechaAsignacion = Instant.now();
        }
        if (this.estado == null) {
            this.estado = "REGISTRADA";
        }
    }
}