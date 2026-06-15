package com.sistemainventario.inventario.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.model.Notificacion;
import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.model.NotificacionLeida;
import com.sistemainventario.inventario.repository.NotificacionLeidaRepository;
import com.sistemainventario.inventario.repository.NotificacionRepository;
import com.sistemainventario.inventario.repository.UsuarioRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final NotificacionLeidaRepository notificacionLeidaRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(NotificacionRepository notificacionRepository,
        NotificacionLeidaRepository notificacionLeidaRepository,
        UsuarioRepository usuarioRepository
    ){
        this.notificacionRepository = notificacionRepository;
        this.notificacionLeidaRepository = notificacionLeidaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public String formatearNombre(String username) {
        if (username == null || username.trim().isEmpty()) return "Usuario";
        
        // Separamos por el punto (se usa "\\." porque el punto es un carácter especial en Regex)
        String[] partes = username.trim().toLowerCase().split("\\.");
        StringBuilder nombreFormateado = new StringBuilder();
        
        for (String parte : partes) {
            if (parte.length() > 0) {
                // Convertimos la primera letra a mayúscula y le pegamos el resto de la palabra
                nombreFormateado.append(Character.toUpperCase(parte.charAt(0)))
                                .append(parte.substring(1))
                                .append(" ");
            }
        }
        
        return nombreFormateado.toString().trim();
    }

    @Transactional
    public void registrar(String nombreCompletoUsuario, String accionMensaje) {
        String nombreFormateado = formatearNombre(nombreCompletoUsuario);
        Notificacion notificacion = new Notificacion();
        
        notificacion.setMensaje(nombreFormateado + " " + accionMensaje); 
        notificacionRepository.save(notificacion);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerNotificacionesUsuario(Integer idUsuario) {
        List<Notificacion> ultimas = notificacionRepository.findTop10ByOrderByFechaDesc();
        List<Long> idsLeidas = notificacionLeidaRepository.findIdsNotificacionesLeidasPorUsuario(idUsuario);
        long noLeidas = notificacionRepository.countNoLeidasPorUsuario(idUsuario);

        // Mapeamos dinámicamente si ESTE usuario ya la leyó o no
        List<Map<String, Object>> notificacionesDTO = ultimas.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("idNotificacion", n.getIdNotificacion());
            map.put("mensaje", n.getMensaje());
            map.put("fecha", n.getFecha());
            map.put("leida", idsLeidas.contains(n.getIdNotificacion()));
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("noLeidas", noLeidas);
        response.put("notificaciones", notificacionesDTO);
        return response;
    }

    @Transactional
    public void marcarComoLeidas(Integer idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        
        List<Notificacion> sinLeer = notificacionRepository.findNotificacionesNoLeidasPorUsuario(idUsuario);
        
        List<NotificacionLeida> nuevasLecturas = new ArrayList<>();
        for (Notificacion n : sinLeer) {
            NotificacionLeida nl = new NotificacionLeida();
            nl.setNotificacion(n);
            nl.setUsuario(usuario);
            nuevasLecturas.add(nl);
        }
        
        notificacionLeidaRepository.saveAll(nuevasLecturas);
    }
}