package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
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
}
