package com.sistemainventario.inventario.model;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;


@Embeddable
public class UsuarioPermisoBodegaId implements Serializable{

    @Column(name = "idusuario")
    private Integer idUsuario;

    @Column(name = "idbodega")
    private Integer idBodega;

    // Se necesitan equals() y hashCode() para IDs compuestos ---
    // (Aunque @Data los provee)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UsuarioPermisoBodegaId that = (UsuarioPermisoBodegaId) o;
        return Objects.equals(idUsuario, that.idUsuario) &&
                Objects.equals(idBodega, that.idBodega);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idUsuario, idBodega);
    }

    public UsuarioPermisoBodegaId() {
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdBodega() {
        return idBodega;
    }

    public void setIdBodega(Integer idBodega) {
        this.idBodega = idBodega;
    }

    
}
