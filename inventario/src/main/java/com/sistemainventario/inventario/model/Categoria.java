package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "categoria")
public class Categoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idcategoria")
    private Integer idCategoria;

    @Column(name = "nombrecategoria", nullable = false, unique = true, length = 100)
    private String nombrecategoria;

}
