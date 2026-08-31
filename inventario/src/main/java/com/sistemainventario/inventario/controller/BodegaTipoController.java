package com.sistemainventario.inventario.controller;


import org.springframework.web.bind.annotation.*;

import com.sistemainventario.inventario.model.BodegaTipo;
import com.sistemainventario.inventario.service.BodegaTipoService;

import java.util.List;


@RestController
@RequestMapping("/api/tipobodegas")
@CrossOrigin(origins = "*")
public class BodegaTipoController {

    private final BodegaTipoService bodegaTipoService;

    public BodegaTipoController(BodegaTipoService bodegaTipoService){
        this.bodegaTipoService = bodegaTipoService;
    }

    @GetMapping()   
    public List<BodegaTipo> listarTipoBodegas() {
        return bodegaTipoService.listarBodegasTipo();
    }

    @GetMapping("/activas")
    public List<BodegaTipo> listarTipoBodegasActivas() {
        return bodegaTipoService.listarBodegasTipoActivas();
    }

    @PostMapping
    public BodegaTipo guardarTipoBodega(@RequestBody BodegaTipo bodegaTipo){
        return bodegaTipoService.guardarTipoBodega(bodegaTipo);
    }

    @DeleteMapping
    public void eliminarTipoBodega(@RequestBody Integer idBodegaTipo){
        bodegaTipoService.eliminarTipoBodega(idBodegaTipo);
    }
    

}
