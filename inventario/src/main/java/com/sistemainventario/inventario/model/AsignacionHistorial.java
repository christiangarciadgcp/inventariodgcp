package com.sistemainventario.inventario.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "asignacion_historial")
public class AsignacionHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Long idHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignacion", nullable = false)
    @JsonIgnore
    private Asignacion asignacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "detalle", length = 500)
    private String detalle;

    @Column(name = "fecha", nullable = false)
    private Instant fecha;

    public AsignacionHistorial() {}

    public AsignacionHistorial(Asignacion asignacion, Usuario usuario, String accion, String detalle) {
        this.asignacion = asignacion;
        this.usuario = usuario;
        this.accion = accion;
        this.detalle = detalle;
        this.fecha = Instant.now();
    }

}
