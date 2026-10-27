package com.sistemainventario.inventario.model;
import jakarta.persistence.*;

@Entity
@Table(name = "usuario_permiso_bodega")
public class UsuarioPermisoBodega {
    @EmbeddedId 
    private UsuarioPermisoBodegaId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idUsuario")
    @JoinColumn(name = "idusuario")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idBodega")
    @JoinColumn(name = "idbodega")
    private Bodega bodega;

    public UsuarioPermisoBodega() {
    }

    public UsuarioPermisoBodegaId getId() {
        return id;
    }

    public void setId(UsuarioPermisoBodegaId id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Bodega getBodega() {
        return bodega;
    }

    public void setBodega(Bodega bodega) {
        this.bodega = bodega;
    }

    
}
