package com.sistemainventario.inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "asignacion_detalle")
public class AsignacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignacion_detalle")
    private Long idAsignacionDetalle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_asignacion", nullable = false)
    @JsonIgnoreProperties({"detalles", "historial"})
    private Asignacion asignacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_bodega_origen", nullable = false)
    private Bodega bodegaOrigen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_bodega_devolucion")
    private Bodega bodegaDevolucion;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "PENDIENTE";

    @Column(name = "fecha_devolucion")
    private Instant fechaDevolucion;

    @Column(name = "observacion_devolucion", columnDefinition = "TEXT")
    private String observacionDevolucion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_devolucion")
    private Usuario usuarioDevolucion;
}