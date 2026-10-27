package com.sistemainventario.inventario.model;
import jakarta.persistence.*;

@Entity
@Table(name = "bodega_tipo")
public class BodegaTipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbodegatipo")
    private Integer idBodegaTipo;

    @Column(name = "tipobodega", nullable = false, unique = true, length = 50)
    private String tipobodega;

    @Column(name = "activo")
    private Boolean activo = true;

    public BodegaTipo() {
    }

    public Integer getIdBodegaTipo() {
        return idBodegaTipo;
    }

    public void setIdBodegaTipo(Integer idBodegaTipo) {
        this.idBodegaTipo = idBodegaTipo;
    }

    public String getTipobodega() {
        return tipobodega;
    }

    public void setTipobodega(String tipobodega) {
        this.tipobodega = tipobodega;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    

}
