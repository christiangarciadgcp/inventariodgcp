package com.sistemainventario.inventario.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sistemainventario.inventario.dto.productoDTO.ProductoSugerenciaRegistroDTO;
import com.sistemainventario.inventario.model.Categoria;
import com.sistemainventario.inventario.model.ProductoSugerencia;
import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.repository.CategoriaRepository;
import com.sistemainventario.inventario.repository.ProductoSugerenciaRepository;
import com.sistemainventario.inventario.repository.UsuarioRepository;

import java.util.List;

@Service
public class ProductoSugerenciaService {

    private final ProductoSugerenciaRepository productoSugerenciaRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public ProductoSugerenciaService(ProductoSugerenciaRepository productoSugerenciaRepository, CategoriaRepository categoriaRepository, UsuarioRepository usuarioRepository, NotificacionService notificacionService){
        this.productoSugerenciaRepository = productoSugerenciaRepository;
        this.categoriaRepository = categoriaRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    public List<ProductoSugerencia> listarProductosSugeridos(){
        return productoSugerenciaRepository.findAllByOrderByFechaSugerenciaDesc();
    }

    public List<ProductoSugerencia> listarProductosSugeridosPorUsuario(Integer idUsuario){
        return productoSugerenciaRepository.findByUsuarioSolicitante_IdUsuarioOrderByFechaSugerenciaDesc(idUsuario);
    }

    @Transactional
    public ProductoSugerencia crearSugerencia(ProductoSugerenciaRegistroDTO dto){
        ProductoSugerencia sugerencia = new ProductoSugerencia();
        sugerencia.setNombreSugerido(dto.getNombreSugerido());
        sugerencia.setJustificacion(dto.getJustificacion());

        if(dto.getIdCategoria() != null){
            Categoria categoria = categoriaRepository.findById(dto.getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));
            sugerencia.setCategoriaSugerida(categoria);
        }

        Usuario usuario = usuarioRepository.findById(dto.getIdUsuarioSolicitante())
                .orElseThrow(() -> new RuntimeException("Usuario Solicitante no encontrado"));
        sugerencia.setUsuarioSolicitante(usuario);

        notificacionService.registrar(usuario.getNombreusuario(), "ha sugerido el producto: " + dto.getNombreSugerido());

        return productoSugerenciaRepository.save(sugerencia);
    }

    @Transactional
    public ProductoSugerencia cambiarEstado(Integer idSugerencia, String nuevoEstado, String comentario){
        ProductoSugerencia sugerencia = productoSugerenciaRepository.findById(idSugerencia)
                .orElseThrow( () -> new RuntimeException("Sugerencia no encontrada"));
        sugerencia.setEstado(nuevoEstado);

        if(comentario != null && !comentario.trim().isEmpty()){
            sugerencia.setComentario(comentario);
        }

        notificacionService.registrar("Se ha " + nuevoEstado, "la sugerencia del producto: " + sugerencia.getNombreSugerido());

        return productoSugerenciaRepository.save(sugerencia);
    }

    @Transactional
    public void eliminarSugerencia(Integer idSugerencia){
        ProductoSugerencia sugerencia = productoSugerenciaRepository.findById(idSugerencia)
                    .orElseThrow( () -> new RuntimeException("Sugerencia no encontrada"));

        if(!"PENDIENTE".equals(sugerencia.getEstado())){
            throw new RuntimeException("Solo se pueden eliminar sugerencias en estado PENDIENTE");
        }

        notificacionService.registrar("Se ha eliminado la sugerencia del producto: " , sugerencia.getNombreSugerido());

        productoSugerenciaRepository.delete(sugerencia);
    }

}
