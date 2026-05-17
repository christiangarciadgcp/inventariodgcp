package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.model.Rol;
import com.sistemainventario.inventario.repository.UsuarioRepository;
import com.sistemainventario.inventario.repository.RolRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    @Value("${password.reset}")
    private String PASSWORD_RESET;

    //INICIALIZACION DE VARIABLES
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    //CONSTRUCTOR
    public UsuarioService(UsuarioRepository usuarioRepository,
                          RolRepository rolRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    //METODO PARA LISTAR TODOS LOS USUARIOS
    public List<Usuario> listarUsuarios(){
        return usuarioRepository.findAll(Sort.by(Sort.Direction.ASC, "idUsuario"));
    }

    //METODO PARA BUSCAR UN USUARIO POR SU NOMBRE
    public Optional<Usuario> buscarPorNombreDeUsuario(String nombreusuario){
        return usuarioRepository.findBynombreusuario(nombreusuario);
    }

    //METODO PARA GUARDAR UN USUARIO
    @Transactional
    public Usuario registrarUsuario(Usuario usuario, Integer idRol){
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        usuario.setRol(rol);

        String passwordEncriptada = passwordEncoder.encode(usuario.getPasswordusuario());
        usuario.setPasswordusuario(passwordEncriptada);

        return usuarioRepository.save(usuario);
    }

    //CAMBIAR EL ESTADO DEL USUARIO
    @Transactional
    public void cambiarEstadoUsuario(Integer id, Boolean nuevoEstado){
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Usuario no encontrado"));

        usuario.setActivo(nuevoEstado);
        usuarioRepository.save(usuario);
    }

    //RESETEAR LA PASSWORD DEL USUARIO
    @Transactional
    public void restablecerPassword(Integer id){
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow( () -> new RuntimeException("Usuario no encontrado"));

        String passwordEncriptada = passwordEncoder.encode(PASSWORD_RESET);
        usuario.setPasswordusuario(passwordEncriptada);

        usuarioRepository.save(usuario);

    }

    //REGISTRAR ULTIMA CONEXION Y LA IP A LA CUAL SE CONECTÓ
    @Transactional
    public void registrarIp(Integer id, String ip){
        Usuario usuario = usuarioRepository.findById(id).orElse(null);

        if(usuario != null){
            usuario.setUltimaConexion(Instant.now());
            usuario.setIp(ip);
            usuarioRepository.save(usuario);
        }
    }

    @Transactional
    public Usuario actualizarUsuario(Integer id, Integer idRol, Boolean activo){
        Usuario usuarioActual = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Rol nuevoRol = rolRepository.findById(idRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        usuarioActual.setRol(nuevoRol);
        
        if (activo != null) {
            usuarioActual.setActivo(activo);
        }

        return usuarioRepository.save(usuarioActual);
    }

    @Transactional
    public void cambiarPassword(Integer idUsuario, String passwordActual, String passwordNueva){
        Usuario usuarioActual = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if(!passwordEncoder.matches(passwordActual,usuarioActual.getPasswordusuario())){
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        usuarioActual.setPasswordusuario(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuarioActual);

    }

}
