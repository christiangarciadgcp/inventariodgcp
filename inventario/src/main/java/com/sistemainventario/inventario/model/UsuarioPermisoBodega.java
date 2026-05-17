package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;

@Data
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
}
