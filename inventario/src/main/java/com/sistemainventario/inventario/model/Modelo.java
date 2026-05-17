package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Modelo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmodelo")
    private Integer idModelo;

    @Column(name = "nombremodelo", nullable = false, unique = true, length = 100)
    private String nombremodelo;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

}
