package com.sistemainventario.inventario.model;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "snapshot_inventario")
public class SnapshotInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsnapshot")
    private Long idSnapshot;

    @Column(name = "fechasnapshot", nullable = false)
    private Instant fechasnapshot;

    @Column(name = "cantidadactual", nullable = false)
    private Integer cantidadactual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto")
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idbodega") 
    private Bodega bodega;

    @PrePersist
    protected void onCreate() {
        if (this.fechasnapshot == null) {
            this.fechasnapshot = Instant.now();
        }
    }

    public SnapshotInventario() {
    }

    public Long getIdSnapshot() {
        return idSnapshot;
    }

    public void setIdSnapshot(Long idSnapshot) {
        this.idSnapshot = idSnapshot;
    }

    public Instant getFechasnapshot() {
        return fechasnapshot;
    }

    public void setFechasnapshot(Instant fechasnapshot) {
        this.fechasnapshot = fechasnapshot;
    }

    public Integer getCantidadactual() {
        return cantidadactual;
    }

    public void setCantidadactual(Integer cantidadactual) {
        this.cantidadactual = cantidadactual;
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

    
}
