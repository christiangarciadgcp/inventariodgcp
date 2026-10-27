package com.sistemainventario.inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.sistemainventario.inventario.config.RutaImagenSerializer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "producto_imagen")
public class ProductoImagen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproductoimagen")
    private Integer idProductoImagen;

    @Column(name = "rutaimagen", nullable = false)
    @JsonSerialize(using = RutaImagenSerializer.class)
    private String rutaimagen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto", nullable = false)
    @JsonIgnore
    private Producto producto;

    public ProductoImagen() {
    }

    public Integer getIdProductoImagen() {
        return idProductoImagen;
    }

    public void setIdProductoImagen(Integer idProductoImagen) {
        this.idProductoImagen = idProductoImagen;
    }

    public String getRutaimagen() {
        return rutaimagen;
    }

    public void setRutaimagen(String rutaimagen) {
        this.rutaimagen = rutaimagen;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    
}
