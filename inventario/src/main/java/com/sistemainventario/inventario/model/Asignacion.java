package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_ubicacion", nullable = false)
    private Ubicacion ubicacion;

    @Column(name = "responsable_destino", length = 255)
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

    public Asignacion() {
    }

    public Long getIdAsignacion() {
        return idAsignacion;
    }

    public void setIdAsignacion(Long idAsignacion) {
        this.idAsignacion = idAsignacion;
    }

    public String getNumeroActa() {
        return numeroActa;
    }

    public void setNumeroActa(String numeroActa) {
        this.numeroActa = numeroActa;
    }

    public Integer getCorrelativo() {
        return correlativo;
    }

    public void setCorrelativo(Integer correlativo) {
        this.correlativo = correlativo;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public AsignacionTipo getTipoAsignacion() {
        return tipoAsignacion;
    }

    public void setTipoAsignacion(AsignacionTipo tipoAsignacion) {
        this.tipoAsignacion = tipoAsignacion;
    }

    public Ubicacion getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(Ubicacion ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getResponsableDestino() {
        return responsableDestino;
    }

    public void setResponsableDestino(String responsableDestino) {
        this.responsableDestino = responsableDestino;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Instant getFechaAsignacion() {
        return fechaAsignacion;
    }

    public void setFechaAsignacion(Instant fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Usuario getUsuarioCreacion() {
        return usuarioCreacion;
    }

    public void setUsuarioCreacion(Usuario usuarioCreacion) {
        this.usuarioCreacion = usuarioCreacion;
    }

    public Usuario getUsuarioAprobacion() {
        return usuarioAprobacion;
    }

    public void setUsuarioAprobacion(Usuario usuarioAprobacion) {
        this.usuarioAprobacion = usuarioAprobacion;
    }

    public Instant getFechaAprobacion() {
        return fechaAprobacion;
    }

    public void setFechaAprobacion(Instant fechaAprobacion) {
        this.fechaAprobacion = fechaAprobacion;
    }

    public List<AsignacionDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<AsignacionDetalle> detalles) {
        this.detalles = detalles;
    }

    public List<AsignacionHistorial> getHistorial() {
        return historial;
    }

    public void setHistorial(List<AsignacionHistorial> historial) {
        this.historial = historial;
    }

    
}