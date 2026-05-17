import { Rol } from './rol';

export interface Usuario {
    idUsuario : number;
    nombreusuario: string;
    passwordusuario?: string;
    rol: Rol;

    estado?: boolean;         
    ultimaConexion?: string; 
    ultimaIp?: string;
}

export interface UsuarioRegistroDTO {
    nombreusuario: string;
    passwordusuario: string;
    idrol: number;
}
