package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

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

    // --- RELACIÓN PADRE (Genérico) -> HIJO (Físico) ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto_padre")
    private Producto productoPadre;

    @Fetch(FetchMode.SUBSELECT)
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
    
    @Column(name = "es_generico")
    private Boolean esGenerico = false;

    @Column(name = "esnuevo", columnDefinition = "boolean default false")
    private Boolean esNuevo = true;

    @Column(name = "es_asignable", columnDefinition = "boolean default false", nullable = false)
    private Boolean esAsignable = false;

    public Producto() {
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public UnidadMedida getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(UnidadMedida unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public Modelo getModelo() {
        return modelo;
    }

    public void setModelo(Modelo modelo) {
        this.modelo = modelo;
    }

    public Producto getProductoPadre() {
        return productoPadre;
    }

    public void setProductoPadre(Producto productoPadre) {
        this.productoPadre = productoPadre;
    }

    public List<ProductoImagen> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<ProductoImagen> imagenes) {
        this.imagenes = imagenes;
    }

    public String getNombreproducto() {
        return nombreproducto;
    }

    public void setNombreproducto(String nombreproducto) {
        this.nombreproducto = nombreproducto;
    }

    public String getSkuproducto() {
        return skuproducto;
    }

    public void setSkuproducto(String skuproducto) {
        this.skuproducto = skuproducto;
    }

    public String getDescripcionproducto() {
        return descripcionproducto;
    }

    public void setDescripcionproducto(String descripcionproducto) {
        this.descripcionproducto = descripcionproducto;
    }

    public String getSerieproducto() {
        return serieproducto;
    }

    public void setSerieproducto(String serieproducto) {
        this.serieproducto = serieproducto;
    }

    public String getInventarioproducto() {
        return inventarioproducto;
    }

    public void setInventarioproducto(String inventarioproducto) {
        this.inventarioproducto = inventarioproducto;
    }

    public BigDecimal getPreciocostoproducto() {
        return preciocostoproducto;
    }

    public void setPreciocostoproducto(BigDecimal preciocostoproducto) {
        this.preciocostoproducto = preciocostoproducto;
    }

    public BigDecimal getPrecioventaproducto() {
        return precioventaproducto;
    }

    public void setPrecioventaproducto(BigDecimal precioventaproducto) {
        this.precioventaproducto = precioventaproducto;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Boolean getEsGenerico() {
        return esGenerico;
    }

    public void setEsGenerico(Boolean esGenerico) {
        this.esGenerico = esGenerico;
    }

    public Boolean getEsNuevo() {
        return esNuevo;
    }

    public void setEsNuevo(Boolean esNuevo) {
        this.esNuevo = esNuevo;
    }

    public Boolean getEsAsignable() {
        return esAsignable;
    }

    public void setEsAsignable(Boolean esAsignable) {
        this.esAsignable = esAsignable;
    }

    

}