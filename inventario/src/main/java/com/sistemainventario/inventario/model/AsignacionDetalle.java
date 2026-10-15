package com.sistemainventario.inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "asignacion_detalle")
public class AsignacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignacion_detalle")
    private Long idAsignacionDetalle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_asignacion", nullable = false)
    @JsonIgnoreProperties({"detalles", "historial"})
    private Asignacion asignacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_bodega_origen", nullable = false)
    private Bodega bodegaOrigen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_bodega_devolucion")
    private Bodega bodegaDevolucion;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "PENDIENTE";

    @Column(name = "fecha_devolucion")
    private Instant fechaDevolucion;

    @Column(name = "observacion_devolucion", columnDefinition = "TEXT")
    private String observacionDevolucion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_devolucion")
    private Usuario usuarioDevolucion;

    public AsignacionDetalle() {
    }

    public void setIdAsignacionDetalle(Long idAsignacionDetalle) {
        this.idAsignacionDetalle = idAsignacionDetalle;
    }

    public void setAsignacion(Asignacion asignacion) {
        this.asignacion = asignacion;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setBodegaOrigen(Bodega bodegaOrigen) {
        this.bodegaOrigen = bodegaOrigen;
    }

    public void setBodegaDevolucion(Bodega bodegaDevolucion) {
        this.bodegaDevolucion = bodegaDevolucion;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public void setFechaDevolucion(Instant fechaDevolucion) {
        this.fechaDevolucion = fechaDevolucion;
    }

    public void setObservacionDevolucion(String observacionDevolucion) {
        this.observacionDevolucion = observacionDevolucion;
    }

    public void setUsuarioDevolucion(Usuario usuarioDevolucion) {
        this.usuarioDevolucion = usuarioDevolucion;
    }

    public Long getIdAsignacionDetalle() {
        return idAsignacionDetalle;
    }

    public Asignacion getAsignacion() {
        return asignacion;
    }

    public Producto getProducto() {
        return producto;
    }

    public Bodega getBodegaOrigen() {
        return bodegaOrigen;
    }

    public Bodega getBodegaDevolucion() {
        return bodegaDevolucion;
    }

    public String getEstado() {
        return estado;
    }

    public Instant getFechaDevolucion() {
        return fechaDevolucion;
    }

    public String getObservacionDevolucion() {
        return observacionDevolucion;
    }

    public Usuario getUsuarioDevolucion() {
        return usuarioDevolucion;
    }
}