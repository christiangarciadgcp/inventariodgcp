package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
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
}
