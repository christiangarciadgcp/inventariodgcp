package com.sistemainventario.inventario.controller;

import com.sistemainventario.inventario.model.Rol;
import com.sistemainventario.inventario.service.RolService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles") 
@CrossOrigin(origins = "*")
public class RolController {

    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping
    public List<Rol> listarRoles() {
        return rolService.listarRoles();
    }

    @PostMapping
    public Rol guardarRol(@RequestBody Rol rol) {
        return rolService.guardarRol(rol);
    }

    @DeleteMapping
    public void eliminarRol(@RequestBody Integer idRol) {
        rolService.eliminarRol(idRol);
    }
}
