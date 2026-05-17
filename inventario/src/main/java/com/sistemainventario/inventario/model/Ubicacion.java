package com.sistemainventario.inventario.model;


import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ubicacion")
public class Ubicacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idubicacion")
    private Integer idUbicacion;

    @Column(name = "nombreubicacion", nullable = false, length = 100)
    private String nombreubicacion;

    @Column(name = "siglasubicacion", nullable = false, length = 100)
    private String siglasubicacion;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

}
