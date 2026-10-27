package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.Instant;
import java.util.List;

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
    @OrderBy("fecha ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PresupuestoHistorial> historial;

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

    @Column(name = "numero_acta", length = 50)
    private String numeroActa;

    @Column(name = "correlativo")
    private Integer correlativo;

    @Column(name = "anio")
    private Integer anio;

    @Column(name = "fecha_salida")
    private Instant fechaSalida;

    @PrePersist
    protected void onCreate() {
        if (this.fecha_creacion == null) {
            this.fecha_creacion = Instant.now();
        }
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
    }

    public Presupuesto() {
    }

    public Long getIdPresupuesto() {
        return idPresupuesto;
    }

    public Usuario getIdusuariopresupuesto() {
        return idusuariopresupuesto;
    }

    public Ubicacion getUbicacion() {
        return ubicacion;
    }

    public List<PresupuestoHistorial> getHistorial() {
        return historial;
    }

    public String getNombre_presupuesto() {
        return nombre_presupuesto;
    }

    public String getEstado() {
        return estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public Instant getFecha_creacion() {
        return fecha_creacion;
    }

    public Instant getFecha_modificacion() {
        return fecha_modificacion;
    }

    public String getNumeroActa() {
        return numeroActa;
    }

    public Integer getCorrelativo() {
        return correlativo;
    }

    public Integer getAnio() {
        return anio;
    }

    public Instant getFechaSalida() {
        return fechaSalida;
    }

    public void setIdPresupuesto(Long idPresupuesto) {
        this.idPresupuesto = idPresupuesto;
    }

    public void setIdusuariopresupuesto(Usuario idusuariopresupuesto) {
        this.idusuariopresupuesto = idusuariopresupuesto;
    }

    public void setUbicacion(Ubicacion ubicacion) {
        this.ubicacion = ubicacion;
    }

    public void setHistorial(List<PresupuestoHistorial> historial) {
        this.historial = historial;
    }

    public void setNombre_presupuesto(String nombre_presupuesto) {
        this.nombre_presupuesto = nombre_presupuesto;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public void setFecha_creacion(Instant fecha_creacion) {
        this.fecha_creacion = fecha_creacion;
    }

    public void setFecha_modificacion(Instant fecha_modificacion) {
        this.fecha_modificacion = fecha_modificacion;
    }

    public void setNumeroActa(String numeroActa) {
        this.numeroActa = numeroActa;
    }

    public void setCorrelativo(Integer correlativo) {
        this.correlativo = correlativo;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public void setFechaSalida(Instant fechaSalida) {
        this.fechaSalida = fechaSalida;
    }

    
    
}
