package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "producto")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproducto")
    private Integer idProducto;

    // --- Relación con Categoria ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idcategoria")
    private Categoria categoria;

    // --- Relación con Proveedor ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idproveedor")
    private Proveedor proveedor;

    // --- Relación con Unidad de Medida ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idunidadmedida")
    private UnidadMedida unidadMedida;


    // --- Relación con Modelo ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idmodelo")
    private Modelo modelo;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProductoImagen> imagenes = new ArrayList<>();

    @Column(name = "nombreproducto", nullable = false, length = 255)
    private String nombreproducto;

    @Column(name = "skuproducto", nullable = false, unique = true, length = 100)
    private String skuproducto;

    @Column(name = "descripcionproducto")
    private String descripcionproducto;

    @Column(name = "serieproducto")
    private String serieproducto;

    @Column(name = "inventarioproducto")
    private String inventarioproducto;

    @Column(name = "preciocostoproducto", nullable = false)
    private BigDecimal preciocostoproducto;

    @Column(name = "precioventaproducto", nullable = false)
    private BigDecimal precioventaproducto;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;


    public Producto() {
    }

    public Integer getIdProducto() {
        return this.idProducto;
    }

    public String getNombreproducto() {
        return this.nombreproducto;
    }

    public String getSkuproducto() {
        return this.skuproducto;
    }

    public String getDescripcionproducto() {
        return this.descripcionproducto;
    }

    public String getSerieproducto(){
        return this.serieproducto;
    }

    public String getInventarioproducto(){
        return this.inventarioproducto;
    }

    public BigDecimal getPreciocostoproducto() {
        return this.preciocostoproducto;
    }

    public BigDecimal getPrecioventaproducto() {
        return this.precioventaproducto;
    }

    public Categoria getCategoria() {
        return this.categoria;
    }

    public Proveedor getProveedor() {
        return this.proveedor;
    }

    public UnidadMedida getUnidadMedida() {
        return this.unidadMedida;
    }

    public Modelo getModelo(){
        return this.modelo;
    }

    public List<ProductoImagen> getImagenes() {
        return this.imagenes;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public void setNombreproducto(String nombreproducto) {
        this.nombreproducto = nombreproducto;
    }

    public void setSkuproducto(String skuproducto) {
        this.skuproducto = skuproducto;
    }

    public void setDescripcionproducto(String descripcionproducto) {
        this.descripcionproducto = descripcionproducto;
    }

    public void setSerieproducto(String serieproducto){
        this.serieproducto = serieproducto;
    }

    public void setInventarioproducto(String inventarioproducto){
        this.inventarioproducto = inventarioproducto;
    }

    public void setPreciocostoproducto(BigDecimal preciocostoproducto) {
        this.preciocostoproducto = preciocostoproducto;
    }

    public void setPrecioventaproducto(BigDecimal precioventaproducto) {
        this.precioventaproducto = precioventaproducto;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public void setUnidadMedida(UnidadMedida unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public void setModelo(Modelo modelo){
        this.modelo = modelo;
    }

    public void setImagenes(List<ProductoImagen> imagenes) {
        this.imagenes = imagenes;
    }


    public String toString() {
        return "Producto(idProducto=" + this.getIdProducto() + ", nombreproducto=" + this.getNombreproducto() + ", skuproducto=" + this.getSkuproducto() + ", descripcionproducto=" + this.getDescripcionproducto() + ", preciocostoproducto=" + this.getPreciocostoproducto() + ", precioventaproducto=" + this.getPrecioventaproducto() + ", categoria=" + this.getCategoria() + ", proveedor=" + this.getProveedor() + ", unidadMedida=" + ", modelo=" + this.getModelo() + ")";
    }
}
