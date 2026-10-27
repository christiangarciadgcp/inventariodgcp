package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "unidad_medida")
public class UnidadMedida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idunidadmedida")
    private Integer idUnidadMedida;

    @Column(name = "nombreunidadmedida", nullable = false, unique = true, length = 50)
    private String nombreunidadmedida;

    @Column(name = "abreviaturaunidadmedida", nullable = false, length = 10)
    private String abreviaturaunidadmedida;

    @Column(name = "activo")
    private Boolean activo = true;

    public UnidadMedida() {
    }

    public Integer getIdUnidadMedida() {
        return idUnidadMedida;
    }

    public void setIdUnidadMedida(Integer idUnidadMedida) {
        this.idUnidadMedida = idUnidadMedida;
    }

    public String getNombreunidadmedida() {
        return nombreunidadmedida;
    }

    public void setNombreunidadmedida(String nombreunidadmedida) {
        this.nombreunidadmedida = nombreunidadmedida;
    }

    public String getAbreviaturaunidadmedida() {
        return abreviaturaunidadmedida;
    }

    public void setAbreviaturaunidadmedida(String abreviaturaunidadmedida) {
        this.abreviaturaunidadmedida = abreviaturaunidadmedida;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    
}
