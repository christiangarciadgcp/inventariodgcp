package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "movimiento_stock")
public class MovimientoStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmovimientostock")
    private Long idMovimientoStock;

    @Column(name = "fecha", nullable = false)
    private Instant fecha;

    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo; // "ENTRADA", "SALIDA", "AJUSTE"

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "motivo", length = 255)
    private String motivo;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idbodega", nullable = false)
    private Bodega bodega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = Instant.now();
        }
    }

    public MovimientoStock() {
    }

    public Long getIdMovimientoStock() {
        return idMovimientoStock;
    }

    public void setIdMovimientoStock(Long idMovimientoStock) {
        this.idMovimientoStock = idMovimientoStock;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Bodega getBodega() {
        return bodega;
    }

    public void setBodega(Bodega bodega) {
        this.bodega = bodega;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    

}
