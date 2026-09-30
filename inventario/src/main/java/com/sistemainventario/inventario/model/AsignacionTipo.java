package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data 
@Entity
@Table(name = "asignaciontipo")
public class AsignacionTipo {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idasignaciontipo")
    private Integer idAsignacionTipo;

    @Column(name = "nombreasignacion", nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(name = "descripcionasignacion", length = 100)
    private String descripcion;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    
}
