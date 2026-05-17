package com.sistemainventario.inventario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.sistemainventario.inventario.model.Rol;
import com.sistemainventario.inventario.model.Usuario;
import com.sistemainventario.inventario.repository.RolRepository;
import com.sistemainventario.inventario.repository.UsuarioRepository;

@Component
public class DataInitializer implements CommandLineRunner{
    
    @Value("${user.admin}")
    private String USER_INIT;

    @Value("${user.password}")
    private String PASSWORD_INIT;

    private final UsuarioRepository usuarioRepository;
    //private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository,
                            RolRepository rolRepository,
                            PasswordEncoder passwordEncoder){
        this.usuarioRepository = usuarioRepository;
        //this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String...args) throws Exception{


        if(usuarioRepository.findBynombreusuario(USER_INIT).isEmpty()){

           //Rol rol = rolRepository.findById(1).orElse(null);

            Rol rol = new Rol();
            rol.setIdRol(1);
            System.out.println("ASIGNANDO ROL DE ADMINISTRADOR");


            Usuario user = new Usuario();
            user.setNombreusuario(USER_INIT);
            user.setPasswordusuario(passwordEncoder.encode(PASSWORD_INIT));
            user.setRol(rol);

            usuarioRepository.save(user);
            System.out.println("USUARIO ADMINSTRADOR CREADO");
        }
    }
    
}
