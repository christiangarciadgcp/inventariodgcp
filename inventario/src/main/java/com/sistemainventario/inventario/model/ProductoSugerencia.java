package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "producto_sugerencia")
public class ProductoSugerencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsugerencia")
    private Integer idSugerencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idcategoria")
    private Categoria categoriaSugerida;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idusuario")
    private Usuario usuarioSolicitante;

    @Column(name = "nombre_sugerido", nullable = false, length = 255)
    private String nombreSugerido;

    @Column(name = "justificacion", length = 255)
    private String justificacion;

    @Column(name = "fecha_sugerencia", nullable = false)
    private Instant fechaSugerencia;

    @Column(name = "estado", nullable = false, length = 50)
    private String estado;

    @Column(name = "comentario", length = 500)
    private String comentario;

    @PrePersist
    protected void onCreate() {
        if (this.fechaSugerencia == null) {
            this.fechaSugerencia = Instant.now();
        }
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
    }

}
