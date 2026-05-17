package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "bodega")
public class Bodega {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbodega")
    private Integer idBodega;

    @Column(name = "nombrebodega", nullable = false, length = 150)
    private String nombrebodega;

    @Column(name = "direccionbodega", length = 255)
    private String direccionbodega;

    @Column(name = "telefonobodega", length = 20)
    private String telefonobodega;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

}