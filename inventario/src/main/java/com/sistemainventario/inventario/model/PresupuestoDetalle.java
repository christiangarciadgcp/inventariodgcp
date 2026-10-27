package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

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

    public PresupuestoDetalle() {
    }

    public Long getIdPresupuestoDetalle() {
        return idPresupuestoDetalle;
    }

    public Integer getCantidad_solicitada() {
        return cantidad_solicitada;
    }

    public Integer getCantidad_despachada() {
        return cantidad_despachada;
    }

    public Presupuesto getPresupuesto() {
        return presupuesto;
    }

    public Producto getProducto() {
        return producto;
    }

    public Producto getProductoFisico() {
        return productoFisico;
    }

    public void setIdPresupuestoDetalle(Long idPresupuestoDetalle) {
        this.idPresupuestoDetalle = idPresupuestoDetalle;
    }

    public void setCantidad_solicitada(Integer cantidad_solicitada) {
        this.cantidad_solicitada = cantidad_solicitada;
    }

    public void setCantidad_despachada(Integer cantidad_despachada) {
        this.cantidad_despachada = cantidad_despachada;
    }

    public void setPresupuesto(Presupuesto presupuesto) {
        this.presupuesto = presupuesto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setProductoFisico(Producto productoFisico) {
        this.productoFisico = productoFisico;
    }

    
}
