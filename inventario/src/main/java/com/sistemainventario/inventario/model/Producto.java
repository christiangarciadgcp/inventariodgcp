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
    
    @Column(name = "es_generico")
    private Boolean esGenerico = false;

    // --- RELACIÓN PADRE (Genérico) -> HIJO (Físico) ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto_padre")
    private Producto productoPadre;

}