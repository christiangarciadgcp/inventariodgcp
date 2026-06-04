package com.sistemainventario.inventario.security;

import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService{

    private UsuarioRepository usuarioRepository;

    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findBynombreusuario(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));


        boolean isEnabled = usuario.getActivo() != null ? usuario.getActivo() : false;
        // Conversion de Usuario a un User de Spring Security
        return new User(
            usuario.getNombreusuario(),
            usuario.getPasswordusuario(),
            isEnabled, //  campo 'activo'
            true,      // accountNonExpired (No expirada)
            true,      // credentialsNonExpired (Credenciales no expiradas)
            true,      // accountNonLocked (No bloqueada)
            Collections.singletonList(new SimpleGrantedAuthority(usuario.getRol().getNombrerol()))
    );
    }

}
