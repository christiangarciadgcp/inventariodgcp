package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "solicitud_compra")
public class SolicitudCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsolicitudcompra")
    private Long idSolicitudCompra;

    @Column(name = "nombresolicitud", nullable = false, length = 150)
    private String nombresolicitud;

    @Column(name = "fechacreacionsolicitud", nullable = false)
    private Instant fechacreacionsolicitud;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    // --- Relaciones ---

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idusuariosolicitante", nullable = false)
    private Usuario idusuariosolicitante;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idbodegadestino", nullable = false)
    private Bodega idbodegadestino;

    // Pre-persist para poner la fecha y estado automáticamente
    
    @PrePersist
    protected void onCreate() {
        if (this.fechacreacionsolicitud == null) {
            this.fechacreacionsolicitud = Instant.now();
        }
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
    }

}
