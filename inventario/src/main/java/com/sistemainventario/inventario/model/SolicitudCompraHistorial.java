package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "solicitud_historial")
public class SolicitudCompraHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsolicitudcomprahistorial")
    private Long idSolicitudCompraHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idsolicitudcompra", nullable = false)
    @JsonIgnore
    private SolicitudCompra solicitudCompra;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "fecha", nullable = false)
    private Instant fecha;

    public SolicitudCompraHistorial() {}

    public SolicitudCompraHistorial(SolicitudCompra solicitudCompra, Usuario usuario, String accion){
        this.solicitudCompra = solicitudCompra;
        this.usuario = usuario;
        this.accion = accion;
        this.fecha = Instant.now();
    }

    public Long getIdSolicitudCompraHistorial() {
        return idSolicitudCompraHistorial;
    }

    public void setIdSolicitudCompraHistorial(Long idSolicitudCompraHistorial) {
        this.idSolicitudCompraHistorial = idSolicitudCompraHistorial;
    }

    public SolicitudCompra getSolicitudCompra() {
        return solicitudCompra;
    }

    public void setSolicitudCompra(SolicitudCompra solicitudCompra) {
        this.solicitudCompra = solicitudCompra;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }

    
}
