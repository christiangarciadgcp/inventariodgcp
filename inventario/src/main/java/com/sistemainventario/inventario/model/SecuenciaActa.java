package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

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

    public SecuenciaActa() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Integer getNumeroInicio() {
        return numeroInicio;
    }

    public void setNumeroInicio(Integer numeroInicio) {
        this.numeroInicio = numeroInicio;
    }

    
    
}
