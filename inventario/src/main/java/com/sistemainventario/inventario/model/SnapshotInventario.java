package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Data
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
}
