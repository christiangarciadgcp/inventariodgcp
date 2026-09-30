package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "secuencia_acta")
public class SecuenciaActa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "anio", nullable = false, unique = true)
    private Integer anio;

    @Column(name = "numero_inicio", nullable = false)
    private Integer numeroInicio;
    
}
