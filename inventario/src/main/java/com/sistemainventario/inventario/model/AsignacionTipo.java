package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "asignacion_tipo")
public class AsignacionTipo {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idasignaciontipo")
    private Integer idAsignacionTipo;

    @Column(name = "nombreasignacion", nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(name = "descripcionasignacion", length = 100)
    private String descripcion;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public AsignacionTipo() {
    }

    public Integer getIdAsignacionTipo() {
        return idAsignacionTipo;
    }

    public void setIdAsignacionTipo(Integer idAsignacionTipo) {
        this.idAsignacionTipo = idAsignacionTipo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
    
}
