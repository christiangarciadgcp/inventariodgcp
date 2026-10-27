package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Categoria;
import com.sistemainventario.inventario.repository.CategoriaRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll(Sort.by(Sort.Direction.ASC,"idCategoria"));
    }

    public List<Categoria> listarCategoriasActivas(){
        return categoriaRepository.findByActivoTrue(Sort.by(Sort.Direction.ASC,"idCategoria"));
    }

    public Optional<Categoria> obtenerCategoriaPorId(Integer id) {
        return categoriaRepository.findById(id);
    }

    @Transactional
    public Categoria guardarCategoria(Categoria categoria) {
        String nombreLimpio = categoria.getNombrecategoria() != null ? categoria.getNombrecategoria().trim() : "";

        if (categoriaRepository.findFirstByNombrecategoriaIgnoreCase(nombreLimpio).isPresent()) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        boolean esNueva = (categoria.getIdCategoria() == null);
        if (esNueva) {
            categoria.setActivo(true);
        }
        categoria.setNombrecategoria(nombreLimpio);

        return categoriaRepository.save(categoria);
    }

    @Transactional
    public Categoria actualizarCategoria(Integer id, Categoria categoria) {
        String nombreLimpio = categoria.getNombrecategoria() != null ? categoria.getNombrecategoria().trim() : "";

        Optional<Categoria> categoriaExistente = categoriaRepository.findFirstByNombrecategoriaIgnoreCase(nombreLimpio);
        if (categoriaExistente.isPresent() && !categoriaExistente.get().getIdCategoria().equals(id)) {
            throw new RuntimeException("Ya existe un registro con este elemento " + nombreLimpio );
        }

        Categoria categoriaActual = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

        categoriaActual.setNombrecategoria(nombreLimpio);

        return categoriaRepository.save(categoriaActual);
    }

    @Transactional
    public void eliminarCategoria(Integer idCategoria) {
        categoriaRepository.deleteById(idCategoria);
    }

    @Transactional
    public void desactivarCategoria( Integer id){
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }

    @Transactional
    public void activarCategoria(Integer id){
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

        categoria.setActivo(true);
        categoriaRepository.save(categoria);
    }

}
