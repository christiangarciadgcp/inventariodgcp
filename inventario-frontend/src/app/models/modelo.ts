import {Marca} from './marca';

export interface Modelo {
  idModelo? : number;
  nombremodelo : string;
  activo : boolean;
  marca?: Marca;
}
