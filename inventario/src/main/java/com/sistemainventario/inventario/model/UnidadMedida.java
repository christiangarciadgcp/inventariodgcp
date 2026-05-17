package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
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

    public Integer getIdUnidadMedida() {
        return this.idUnidadMedida;
    }

    public String getNombreunidadmedida() {
        return this.nombreunidadmedida;
    }

    public String getAbreviaturaunidadmedida() {
        return this.abreviaturaunidadmedida;
    }

    public void setIdUnidadMedida(Integer idUnidadMedida) {
        this.idUnidadMedida = idUnidadMedida;
    }

    public void setNombreunidadmedida(String nombreunidadmedida) {
        this.nombreunidadmedida = nombreunidadmedida;
    }

    public void setAbreviaturaunidadmedida(String abreviaturaunidadmedida) {
        this.abreviaturaunidadmedida = abreviaturaunidadmedida;
    }
}
