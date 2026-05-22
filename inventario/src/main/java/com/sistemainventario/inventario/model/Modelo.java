package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "modelo", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"idmarca", "nombremodelo"})
})
public class Modelo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmodelo")
    private Integer idModelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idmarca", nullable = false)
    private Marca marca;

    // Quitamos 'unique = true' de aquí
    @Column(name = "nombremodelo", nullable = false, length = 100)
    private String nombremodelo;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
}