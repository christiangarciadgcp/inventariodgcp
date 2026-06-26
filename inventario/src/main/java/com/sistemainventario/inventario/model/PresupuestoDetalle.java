package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "presupuesto_detalle")
public class PresupuestoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpresupuestodetalle")
    private Long idPresupuestoDetalle;

    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidad_solicitada;

    @Column(name = "cantidad_despachada", nullable = false)
    private Integer cantidad_despachada = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idpresupuesto", nullable = false)
    private Presupuesto presupuesto;

    // LO QUE PIDIÓ EL TÉCNICO (Puede ser genérico)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idproductopresupuesto", nullable = false)
    private Producto producto;

    // LO QUE REALMENTE SALIÓ FÍSICAMENTE DE BODEGA
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto_fisico")
    private Producto productoFisico;
}
