package com.sistemainventario.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmarca")
    private Integer idMarca;

    @Column(name = "nombremarca", nullable = false, unique = true, length = 100)
    private String nombremarca;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

}
