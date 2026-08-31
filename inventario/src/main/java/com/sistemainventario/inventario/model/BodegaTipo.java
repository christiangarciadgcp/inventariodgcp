package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "bodegatipo")
public class BodegaTipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbodegatipo")
    private Integer idBodegaTipo;

    @Column(name = "tipobodega", nullable = false, unique = true, length = 50)
    private String tipobodega;

    @Column(name = "activo")
    private Boolean activo = true;

}
