import {Categoria} from './categoria';
import {Usuario} from './usuario';

export interface ProductoSugerencia{
  idSugerencia : number;
  nombreSugerido : string;
  justificacion: string;
  categoriaSugerida?: Categoria;
  usuarioSolicitante? : Usuario;
  fechaSugerencia : string;
  estado : string;
  comentario : string;
}

export interface ProductoSugerenciaRegistroDTO {
  nombreSugerido : string;
  justificacion: string;
  idCategoria : number | null;
  idUsuarioSolicitante : number;
}
