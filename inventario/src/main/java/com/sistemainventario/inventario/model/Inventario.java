package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "inventario")
public class Inventario {
    @EmbeddedId 
    private InventarioId id;

    @Column(name = "cantidad_actual", nullable = false)
    private Integer cantidad_actual;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("idProducto")
    @JoinColumn(name = "idproducto")
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("idBodega")
    @JoinColumn(name = "idbodega")
    private Bodega bodega;

    public Inventario() {
    }

    public InventarioId getId() {
        return id;
    }

    public void setId(InventarioId id) {
        this.id = id;
    }

    public Integer getCantidad_actual() {
        return cantidad_actual;
    }

    public void setCantidad_actual(Integer cantidad_actual) {
        this.cantidad_actual = cantidad_actual;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Bodega getBodega() {
        return bodega;
    }

    public void setBodega(Bodega bodega) {
        this.bodega = bodega;
    }

    
}
