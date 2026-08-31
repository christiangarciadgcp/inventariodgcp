import {BodegaTipo} from './bodega-tipo';

export interface Bodega {
    idBodega?: number;
    nombrebodega: string;
    direccionbodega: string;
    telefonobodega: string;
    activo : boolean;
    bodegaTipo : BodegaTipo;
}
