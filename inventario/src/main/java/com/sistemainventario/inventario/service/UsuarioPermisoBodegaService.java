package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
//import java.util.Optional;

@Service
public class UsuarioPermisoBodegaService {

    private final UsuarioPermisoBodegaRepository usuarioPermisoBodegaRepository;
    private final UsuarioRepository usuarioRepository;
    private final BodegaRepository bodegaRepository;

    public UsuarioPermisoBodegaService(UsuarioPermisoBodegaRepository usuarioPermisoBodegaRepository,
                                       UsuarioRepository usuarioRepository,
                                       BodegaRepository bodegaRepository) {
        this.usuarioPermisoBodegaRepository = usuarioPermisoBodegaRepository;
        this.usuarioRepository = usuarioRepository;
        this.bodegaRepository = bodegaRepository;
    }

    //ASIGNAMOS EL PERMISO A CADA USUARIO
    @Transactional
    public void asignarPermisoBodega(Integer idUsuario, Integer idBodega) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Bodega bodega = bodegaRepository.findById(idBodega)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        UsuarioPermisoBodegaId usuarioPermisoBodegaId = new UsuarioPermisoBodegaId();
        usuarioPermisoBodegaId.setIdUsuario(idUsuario);
        usuarioPermisoBodegaId.setIdBodega(idBodega);

        UsuarioPermisoBodega usuarioPermisoBodega = new UsuarioPermisoBodega();
        usuarioPermisoBodega.setId(usuarioPermisoBodegaId);
        usuarioPermisoBodega.setUsuario(usuario);
        usuarioPermisoBodega.setBodega(bodega);

        usuarioPermisoBodegaRepository.save(usuarioPermisoBodega);
    }

    //VER LAS BODEGAS ASIGNADAS AL USUARIO
    public List<UsuarioPermisoBodega> obtenerUsuarioPermisosBodega(Integer idUsuario) {
        return usuarioPermisoBodegaRepository.findByIdIdUsuario(idUsuario);
    }

    //ELIMINAR EL PERMISO A ESE USUARIO
    @Transactional
    public void eliminarPermisoBodega(Integer idUsuario, Integer idBodega) {
        UsuarioPermisoBodegaId usuarioPermisoBodegaId = new UsuarioPermisoBodegaId();
        usuarioPermisoBodegaId.setIdUsuario(idUsuario);
        usuarioPermisoBodegaId.setIdBodega(idBodega);
        usuarioPermisoBodegaRepository.deleteById(usuarioPermisoBodegaId);
    }

}