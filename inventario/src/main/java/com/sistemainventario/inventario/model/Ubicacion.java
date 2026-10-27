package com.sistemainventario.inventario.model;


import jakarta.persistence.*;

@Entity
@Table(name = "ubicacion")
public class Ubicacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idubicacion")
    private Integer idUbicacion;

    @Column(name = "nombreubicacion", nullable = false, length = 100, unique = true)
    private String nombreubicacion;

    @Column(name = "siglasubicacion", nullable = false, length = 100)
    private String siglasubicacion;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public Ubicacion() {
    }

    public Integer getIdUbicacion() {
        return idUbicacion;
    }

    public void setIdUbicacion(Integer idUbicacion) {
        this.idUbicacion = idUbicacion;
    }

    public String getNombreubicacion() {
        return nombreubicacion;
    }

    public void setNombreubicacion(String nombreubicacion) {
        this.nombreubicacion = nombreubicacion;
    }

    public String getSiglasubicacion() {
        return siglasubicacion;
    }

    public void setSiglasubicacion(String siglasubicacion) {
        this.siglasubicacion = siglasubicacion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    

}
