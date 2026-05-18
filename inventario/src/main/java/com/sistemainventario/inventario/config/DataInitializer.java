package com.sistemainventario.inventario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.sistemainventario.inventario.model.Bodega;
import com.sistemainventario.inventario.model.Rol;
import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.repository.BodegaRepository;
import com.sistemainventario.inventario.repository.RolRepository;
import com.sistemainventario.inventario.repository.UsuarioRepository;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner{
    
    @Value("${user.admin}")
    private String USER_INIT;

    @Value("${user.password}")
    private String PASSWORD_INIT;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final BodegaRepository bodegaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository,
                            RolRepository rolRepository,
                            BodegaRepository bodegaRepository,
                            PasswordEncoder passwordEncoder){
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.bodegaRepository = bodegaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String...args) throws Exception {

        // INICIALIZAR BODEGA DE DESPACHO
        if (bodegaRepository.findByNombrebodega("Bodega Despacho").isEmpty()) {
            System.out.println("CREANDO BODEGA DE DESPACHO VIRTUAL...");
            Bodega bodegaVirtual = new Bodega();
            bodegaVirtual.setNombrebodega("Bodega Despacho");
            bodegaVirtual.setDireccionbodega("Bodega Virtual para despachar materiales");
            bodegaVirtual.setTelefonobodega("2527-8763");
            bodegaVirtual.setActivo(true);
            
            bodegaRepository.save(bodegaVirtual);
            System.out.println("BODEGA DE DESPACHO CREADA EXITOSAMENTE");
        }


        //INICIALIZAR ROLES SI LA TABLA ESTÁ VACÍA
        if (rolRepository.count() == 0) {
            System.out.println("CREANDO ROLES POR DEFECTO EN LA BASE DE DATOS...");

            Rol rolAdmin = new Rol();
            rolAdmin.setNombrerol("administrador");

            Rol rolJefeUtdi = new Rol();
            rolJefeUtdi.setNombrerol("jefe utdi");

            Rol rolInventario = new Rol();
            rolInventario.setNombrerol("inventario utdi");

            Rol rolTecnico = new Rol();
            rolTecnico.setNombrerol("tecnico utdi");

            rolRepository.saveAll(Arrays.asList(rolAdmin, rolJefeUtdi, rolInventario, rolTecnico));
            System.out.println("ROLES CREADOS EXITOSAMENTE");
        }


        // INICIALIZAR USUARIO ADMINISTRADOR
        if(usuarioRepository.findBynombreusuario(USER_INIT).isEmpty()){
            System.out.println("CREANDO USUARIO ADMINISTRADOR");

            Rol rolAdminBD = rolRepository.findByNombrerol("administrador")
                    .orElseThrow(() -> new RuntimeException("Error crítico: El rol administrador no existe."));

            Usuario user = new Usuario();
            user.setNombreusuario(USER_INIT);
            user.setPasswordusuario(passwordEncoder.encode(PASSWORD_INIT));
            user.setRol(rolAdminBD);

            usuarioRepository.save(user);
            System.out.println("USUARIO ADMINISTRADOR CREADO EXITOSAMENTE");
        }
    }
}