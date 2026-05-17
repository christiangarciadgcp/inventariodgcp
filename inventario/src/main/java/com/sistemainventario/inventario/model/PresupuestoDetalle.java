package com.sistemainventario.inventario.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "presupuesto_detalle")
public class PresupuestoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpresupuestodetalle")
    private Long idPresupuestoDetalle;

    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidad_solicitada;

    @Column(name = "cantidad_despachada", nullable = false)
    private Integer cantidad_despachada = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idpresupuesto", nullable = false)
    private Presupuesto presupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idproductopresupuesto", nullable = false)
    private Producto producto;
}
