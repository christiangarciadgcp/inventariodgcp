package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.dto.usuarioDTO.UsuarioRegistroDTO;
import com.sistemainventario.inventario.dto.usuarioDTO.PasswordDTO;
import com.sistemainventario.inventario.dto.usuarioDTO.UsuarioActualizarDTO;
import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.service.UsuarioService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/usuarios") 
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioService.listarUsuarios();
    }

    @PostMapping
    public Usuario guardar(@RequestBody UsuarioRegistroDTO registroDTO) {

        Usuario usuario = new Usuario();
        usuario.setNombreusuario(registroDTO.nombreusuario);
        usuario.setPasswordusuario(registroDTO.passwordusuario); 

        return usuarioService.registrarUsuario(usuario, registroDTO.idrol);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(@PathVariable Integer id, @RequestParam Boolean activo) {
        usuarioService.cambiarEstadoUsuario(id, activo);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetearPassword(@PathVariable Integer id) {
        usuarioService.restablecerPassword(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Integer id, @RequestBody UsuarioActualizarDTO usuarioActualizarDTO) {
        Usuario usuarioActualizado = usuarioService.actualizarUsuario(id, usuarioActualizarDTO.idrol, usuarioActualizarDTO.activo);
        return ResponseEntity.ok(usuarioActualizado);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> cambiarPassword(@PathVariable Integer id, @RequestBody PasswordDTO passwordDTO) {
        try{
            usuarioService.cambiarPassword(id, passwordDTO.passwordActual, passwordDTO.nuevaPassword);
            return ResponseEntity.ok().build();
        }catch (RuntimeException e){
            Map<String,String> errorResponse = new HashMap<>();
            errorResponse.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
