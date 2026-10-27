package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "solicitud_compra_detalle")
public class SolicitudCompraDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsolicituddetalle")
    private Long idSolicitudDetalle;

    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidad_solicitada;

    @Column(name = "cantidad_recibida", nullable = false)
    private Integer cantidad_recibida = 0;

    // --- Relaciones ---

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idsolicitudcompra", nullable = false)
    private SolicitudCompra solicitudCompra;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto producto;

    public SolicitudCompraDetalle() {
    }

    public Long getIdSolicitudDetalle() {
        return idSolicitudDetalle;
    }

    public void setIdSolicitudDetalle(Long idSolicitudDetalle) {
        this.idSolicitudDetalle = idSolicitudDetalle;
    }

    public Integer getCantidad_solicitada() {
        return cantidad_solicitada;
    }

    public void setCantidad_solicitada(Integer cantidad_solicitada) {
        this.cantidad_solicitada = cantidad_solicitada;
    }

    public Integer getCantidad_recibida() {
        return cantidad_recibida;
    }

    public void setCantidad_recibida(Integer cantidad_recibida) {
        this.cantidad_recibida = cantidad_recibida;
    }

    public SolicitudCompra getSolicitudCompra() {
        return solicitudCompra;
    }

    public void setSolicitudCompra(SolicitudCompra solicitudCompra) {
        this.solicitudCompra = solicitudCompra;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    
}
