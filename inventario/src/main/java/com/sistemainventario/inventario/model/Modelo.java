package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "modelo", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"idmarca", "nombremodelo"})
})
public class Modelo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmodelo")
    private Integer idModelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idmarca", nullable = false)
    private Marca marca;

    // Quitamos 'unique = true' de aquí
    @Column(name = "nombremodelo", nullable = false, length = 100)
    private String nombremodelo;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public Modelo() {
    }

    public Integer getIdModelo() {
        return idModelo;
    }

    public void setIdModelo(Integer idModelo) {
        this.idModelo = idModelo;
    }

    public Marca getMarca() {
        return marca;
    }

    public void setMarca(Marca marca) {
        this.marca = marca;
    }

    public String getNombremodelo() {
        return nombremodelo;
    }

    public void setNombremodelo(String nombremodelo) {
        this.nombremodelo = nombremodelo;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    


}