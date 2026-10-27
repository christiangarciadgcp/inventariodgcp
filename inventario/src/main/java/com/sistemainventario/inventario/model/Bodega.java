package com.sistemainventario.inventario.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bodega")
public class Bodega {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbodega")
    private Integer idBodega;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idbodegatipo")
    private BodegaTipo bodegaTipo;

    @Column(name = "nombrebodega", nullable = false, unique = true, length = 150)
    private String nombrebodega;

    @Column(name = "direccionbodega", length = 255)
    private String direccionbodega;

    @Column(name = "telefonobodega", length = 20)
    private String telefonobodega;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    public Bodega() {
    }

    public Integer getIdBodega() {
        return idBodega;
    }

    public void setIdBodega(Integer idBodega) {
        this.idBodega = idBodega;
    }

    public BodegaTipo getBodegaTipo() {
        return bodegaTipo;
    }

    public void setBodegaTipo(BodegaTipo bodegaTipo) {
        this.bodegaTipo = bodegaTipo;
    }

    public String getNombrebodega() {
        return nombrebodega;
    }

    public void setNombrebodega(String nombrebodega) {
        this.nombrebodega = nombrebodega;
    }

    public String getDireccionbodega() {
        return direccionbodega;
    }

    public void setDireccionbodega(String direccionbodega) {
        this.direccionbodega = direccionbodega;
    }

    public String getTelefonobodega() {
        return telefonobodega;
    }

    public void setTelefonobodega(String telefonobodega) {
        this.telefonobodega = telefonobodega;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    

}