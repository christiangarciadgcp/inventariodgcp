package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
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
}
