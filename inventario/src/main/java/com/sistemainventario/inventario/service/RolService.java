package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.model.Rol;
//import com.sistemainventario.inventario.repository.CategoriaRepository;
import com.sistemainventario.inventario.repository.RolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public List<Rol> listarRoles() {
        return rolRepository.findAll();
    }

    public Optional<Rol> buscarRolPorId(Integer idRol) {
        return rolRepository.findById(idRol);
    }

    @Transactional
    public Rol guardarRol(Rol rol){
        return rolRepository.save(rol);
    }

    @Transactional
    public void eliminarRol(Integer idRol){
        rolRepository.deleteById(idRol);
    }
}
