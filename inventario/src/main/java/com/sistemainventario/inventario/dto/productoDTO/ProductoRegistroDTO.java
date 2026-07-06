package com.sistemainventario.inventario.dto.productoDTO;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ProductoRegistroDTO {
        public Integer idProducto;
        public String nombreproducto;
        public String skuproducto;
        public String descripcionproducto;
        public String serieproducto;
        public String inventarioproducto;
        public BigDecimal preciocostoproducto;
        public BigDecimal precioventaproducto;
        public Integer idCategoria; 
        public Integer idProveedor;
        public Integer idUnidadMedida;
        public Integer idModelo;

        public Boolean esNuevo;
        public Boolean esGenerico;
        public Integer idProductoPadre;

}
