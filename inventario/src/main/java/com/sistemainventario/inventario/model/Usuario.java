package com.sistemainventario.inventario.model;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idusuario")
    private Integer idUsuario;

    @Column(name = "nombreusuario", nullable = false, unique = true, length = 100)
    private String nombreusuario;

    @Column(name = "passwordusuario", nullable = false, length = 255)
    @JsonIgnore
    private String passwordusuario;

    @Column(name = "iniciales", length = 5)
    private String iniciales;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "last_login")
    private Instant ultimaConexion;

    @Column(name = "ip", length = 50)
    private String ip;

    @ManyToOne(fetch = FetchType.EAGER) // 'EAGER' carga el ROL siempre
    @JoinColumn(name = "idrol", nullable = false)
    private Rol rol;

    public Usuario() {
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getNombreusuario() {
        return nombreusuario;
    }

    public String getPasswordusuario() {
        return passwordusuario;
    }

    public String getIniciales() {
        return iniciales;
    }

    public Boolean getActivo() {
        return activo;
    }

    public Instant getUltimaConexion() {
        return ultimaConexion;
    }

    public String getIp() {
        return ip;
    }

    public Rol getRol() {
        return rol;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public void setNombreusuario(String nombreusuario) {
        this.nombreusuario = nombreusuario;
    }

    public void setPasswordusuario(String passwordusuario) {
        this.passwordusuario = passwordusuario;
    }

    public void setIniciales(String iniciales) {
        this.iniciales = iniciales;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public void setUltimaConexion(Instant ultimaConexion) {
        this.ultimaConexion = ultimaConexion;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

}