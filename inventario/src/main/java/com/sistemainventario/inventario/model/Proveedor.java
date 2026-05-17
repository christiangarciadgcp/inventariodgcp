package com.sistemainventario.inventario.model;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "proveedor")
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproveedor")
    private Integer idProveedor;

    @Column(name = "nombreproveedor", nullable = false, length = 150)
    private String nombreproveedor;

    @Column(name = "telefonoproveedor", length = 20)
    private String telefonoproveedor;
}
