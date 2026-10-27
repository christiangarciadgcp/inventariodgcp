package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import java.time.Instant;

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

    public ProductoSugerencia() {
    }

    public Integer getIdSugerencia() {
        return idSugerencia;
    }

    public void setIdSugerencia(Integer idSugerencia) {
        this.idSugerencia = idSugerencia;
    }

    public Categoria getCategoriaSugerida() {
        return categoriaSugerida;
    }

    public void setCategoriaSugerida(Categoria categoriaSugerida) {
        this.categoriaSugerida = categoriaSugerida;
    }

    public Usuario getUsuarioSolicitante() {
        return usuarioSolicitante;
    }

    public void setUsuarioSolicitante(Usuario usuarioSolicitante) {
        this.usuarioSolicitante = usuarioSolicitante;
    }

    public String getNombreSugerido() {
        return nombreSugerido;
    }

    public void setNombreSugerido(String nombreSugerido) {
        this.nombreSugerido = nombreSugerido;
    }

    public String getJustificacion() {
        return justificacion;
    }

    public void setJustificacion(String justificacion) {
        this.justificacion = justificacion;
    }

    public Instant getFechaSugerencia() {
        return fechaSugerencia;
    }

    public void setFechaSugerencia(Instant fechaSugerencia) {
        this.fechaSugerencia = fechaSugerencia;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    

}
