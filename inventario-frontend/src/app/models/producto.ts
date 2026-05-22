import { Categoria } from './categoria';
import { Proveedor } from './proveedor';
import { UnidadMedida } from './unidades-medidas';
import {Marca} from './marca';
import {Modelo} from './modelo';

export interface Producto {
    idProducto?: number;
    nombreproducto: string;
    skuproducto: string;
    descripcionproducto: string;
    serieproducto: string;
    inventarioproducto: string;
    preciocostoproducto: number;
    precioventaproducto: number;
    activo: boolean;

    // Objetos llaves foráneas
    categoria?: Categoria;
    proveedor?: Proveedor;
    unidadMedida?: UnidadMedida;
    modelo?: Modelo;
}

// Interfaz para el envío de datos
export interface ProductoRegistroDTO {
    idProducto?: number;
    nombreproducto: string;
    skuproducto: string;
    descripcionproducto: string;
    serieproducto: string;
    inventarioproducto: string;
    preciocostoproducto: number;
    precioventaproducto: number;
    idCategoria: number;
    idProveedor: number;
    idUnidadMedida: number;
    idModelo : number;
}

