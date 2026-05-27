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
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public void eliminarCategoria(Integer idCategoria) {
        categoriaRepository.deleteById(idCategoria);
    }

    @Transactional
    public Categoria actualizarCategoria(Integer id, Categoria categoria){

        Categoria categoriaActual = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));

        categoriaActual.setNombrecategoria(categoria.getNombrecategoria());

        return categoriaRepository.save(categoriaActual);

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
