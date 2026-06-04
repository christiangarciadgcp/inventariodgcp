package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.solicitudcompraDTO.RecepcionPayloadDTO;
import com.sistemainventario.inventario.dto.solicitudcompraDTO.SolicitudCreacionDTO;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class SolicitudCompraService {

    private final SolicitudCompraRepository solicitudCompraRepository;
    private final SolicitudCompraDetalleRepository solicitudCompraDetalleRepository;
    private final InventarioService inventarioService;
    private final UsuarioRepository usuarioRepository;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final SolicitudCompraHistorialRepository solicitudCompraHistorialRepository;

    public SolicitudCompraService(SolicitudCompraRepository solicitudCompraRepository,
                                  SolicitudCompraDetalleRepository solicitudCompraDetalleRepository,
                                  InventarioService inventarioService,
                                  UsuarioRepository usuarioRepository,
                                  BodegaRepository bodegaRepository,
                                  ProductoRepository productoRepository,
                                  SolicitudCompraHistorialRepository solicitudCompraHistorialRepository){
        this.solicitudCompraRepository = solicitudCompraRepository;
        this.solicitudCompraDetalleRepository = solicitudCompraDetalleRepository;
        this.inventarioService = inventarioService;
        this.usuarioRepository = usuarioRepository;
        this.bodegaRepository = bodegaRepository;
        this.productoRepository = productoRepository;
        this.solicitudCompraHistorialRepository = solicitudCompraHistorialRepository;
    }

    //CREANDO LA SOLICITUD DE COMPRA
    @Transactional
    public SolicitudCompra crearSolicitudCompra(SolicitudCreacionDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Bodega bodega = bodegaRepository.findById(dto.getIdBodegaDestino())
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        // Guardar Cabecera
        SolicitudCompra solicitudCompra = new SolicitudCompra();
        solicitudCompra.setNombresolicitud(dto.getNombreSolicitud());
        solicitudCompra.setIdusuariosolicitante(usuario);
        solicitudCompra.setIdbodegadestino(bodega);
        solicitudCompra.setEstado("PENDIENTE");

        SolicitudCompra solicitudGuardada = solicitudCompraRepository.save(solicitudCompra);

        // Guardar Detalles
        for (SolicitudCreacionDTO.DetalleItemDTO item : dto.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            SolicitudCompraDetalle detalle = new SolicitudCompraDetalle();
            detalle.setSolicitudCompra(solicitudGuardada);
            detalle.setProducto(producto);
            detalle.setCantidad_solicitada(item.getCantidad());
            solicitudCompraDetalleRepository.save(detalle);
        }

        solicitudCompraHistorialRepository.save(new SolicitudCompraHistorial(solicitudCompra,usuario,"CREACION"));

        return solicitudGuardada;
    }

    //ACTUALIZAR LA SOLICITUD DE COMPRA
    @Transactional
    public SolicitudCompra actualizarSolicitudCompra(Long id, SolicitudCreacionDTO dto) {
        SolicitudCompra solicitudCompra = solicitudCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud compra no encontrada"));

        if (!"PENDIENTE".equals(solicitudCompra.getEstado())) {
            throw new RuntimeException("Solo se pueden editar solicitudes en estado PENDIENTE.");
        }

        Usuario usuarioEditor = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Bodega bodega = bodegaRepository.findById(dto.getIdBodegaDestino())
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));

        // A. Actualizar Cabecera
        solicitudCompra.setNombresolicitud(dto.getNombreSolicitud());
        solicitudCompra.setIdbodegadestino(bodega);

        // B. Limpiar detalles anteriores
        solicitudCompraDetalleRepository.deleteBySolicitudCompra(solicitudCompra);

        // C. Insertar nuevos detalles
        for (SolicitudCreacionDTO.DetalleItemDTO item : dto.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            SolicitudCompraDetalle detalle = new SolicitudCompraDetalle();
            detalle.setSolicitudCompra(solicitudCompra);
            detalle.setProducto(producto);
            detalle.setCantidad_solicitada(item.getCantidad());
            solicitudCompraDetalleRepository.save(detalle);
        }

        solicitudCompraHistorialRepository.save(new SolicitudCompraHistorial(solicitudCompra,usuarioEditor,"EDICION"));

        return solicitudCompraRepository.save(solicitudCompra);
    }

    //AGREGAR PRODUCTOS A LA SOLICITUD
    @Transactional
    public void agregarProductosASolicitudCompra(Long idSolicitudCompra, Integer idProducto, Integer cantidad) {
        SolicitudCompra solicitudCompra = solicitudCompraRepository.findById(idSolicitudCompra)
                .orElseThrow(() -> new RuntimeException("Solicitud compra no encontrada"));

        if(!"PENDIENTE".equals(solicitudCompra.getEstado())){
            throw new RuntimeException("No se pueden agregar  productos a esta solicitud");
        }

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        SolicitudCompraDetalle solicitudCompraDetalle = new SolicitudCompraDetalle();
        solicitudCompraDetalle.setSolicitudCompra( solicitudCompra);
        solicitudCompraDetalle.setProducto(producto);
        solicitudCompraDetalle.setCantidad_solicitada(cantidad);

        solicitudCompraDetalleRepository.save(solicitudCompraDetalle);
    }

    //APROBACION DE UNA SOLICITUD DE COMPRA
    @Transactional
    public void aprobarSolicitudCompra(Long idSolicitudCompra, Integer idUsuario){
        SolicitudCompra solicitudCompra = solicitudCompraRepository.findById(idSolicitudCompra)
                .orElseThrow(() -> new RuntimeException("Solicitud compra no encontrada"));

        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        solicitudCompra.setEstado("APROBADA");

        solicitudCompraHistorialRepository.save(new SolicitudCompraHistorial(solicitudCompra,usuario,"APROBACION"));

        solicitudCompraRepository.save(solicitudCompra);
    }

    //RECEPCION DE LA SOLICITUD DE COMPRA ACA PASA A ESTADO RECEPCIONADA Y SE ACTUALIZA EL STOCK
    @Transactional
    public void recepcionarSolicitudCompra(Long idSolicitudCompra, RecepcionPayloadDTO payload) {
        SolicitudCompra solicitud = solicitudCompraRepository.findById(idSolicitudCompra)
                .orElseThrow(() -> new RuntimeException("Solicitud compra no encontrada"));

        Usuario usuario = usuarioRepository.findById(payload.getIdUsuarioComprador())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Validar estado
        if ("PENDIENTE".equals(solicitud.getEstado()) || "RECEPCIONADA".equals(solicitud.getEstado())) {
            throw new RuntimeException("Solo se pueden recepcionar solicitudes APROBADAS o en RECEPCION_PARCIAL");
        }

        // 1. Procesar lo que viene en el camión (el payload)
        for (RecepcionPayloadDTO.ItemRecepcion item : payload.getItems()) {
            
            if (item.getCantidadARecibir() != null && item.getCantidadARecibir() > 0) {
                
                SolicitudCompraDetalle detalle = solicitudCompraDetalleRepository.findById(item.getIdDetalle())
                        .orElseThrow(() -> new RuntimeException("Detalle no encontrado"));

                // Validar que no reciba más de lo que falta
                int cantidadFaltante = detalle.getCantidad_solicitada() - detalle.getCantidad_recibida();
                if (item.getCantidadARecibir() > cantidadFaltante) {
                    throw new RuntimeException("Error en producto " + detalle.getProducto().getNombreproducto() + 
                            ": Intentas recibir " + item.getCantidadARecibir() + " pero solo faltan " + cantidadFaltante);
                }

                // A. Actualizar la cantidad recibida en el detalle
                detalle.setCantidad_recibida(detalle.getCantidad_recibida() + item.getCantidadARecibir());
                solicitudCompraDetalleRepository.save(detalle);

                // B. Ingresar la cantidad al Inventario Físico
                inventarioService.registrarMovimiento(
                        detalle.getProducto().getIdProducto(),
                        solicitud.getIdbodegadestino().getIdBodega(),
                        "ENTRADA",
                        item.getCantidadARecibir(), // Entra solo lo que llegó hoy
                        payload.getIdUsuarioComprador(),
                        "Recepción Parcial/Total Solicitud #" + solicitud.getIdSolicitudCompra()
                );
            }
        }

        // 2. Auditar el estado general de la Solicitud
        List<SolicitudCompraDetalle> todosLosDetalles = solicitudCompraDetalleRepository.findBySolicitudCompra(solicitud);
        
        boolean faltaAlMenosUnProducto = false;
        for (SolicitudCompraDetalle det : todosLosDetalles) {
            if (det.getCantidad_recibida() < det.getCantidad_solicitada()) {
                faltaAlMenosUnProducto = true;
                break; // Si encontramos uno que no está completo, dejamos de buscar
            }
        }

        // 3. Cambiar estado dinámicamente
        if (faltaAlMenosUnProducto) {
            solicitud.setEstado("RECEPCION_PARCIAL");
            solicitudCompraHistorialRepository.save(new SolicitudCompraHistorial(solicitud ,usuario,"RECEPCION PARCIAL"));
        } else {
            solicitud.setEstado("RECEPCIONADA");
            solicitudCompraHistorialRepository.save(new SolicitudCompraHistorial(solicitud ,usuario,"RECEPCION TOTAL"));
        }

        
        solicitudCompraRepository.save(solicitud);
    }

    // Obtener todas las solicitudes (Para el historial completo)
    public List<SolicitudCompra> listarTodas() {
        return solicitudCompraRepository.findAll();
    }

    //Obtener solicitudes por estado (Para pestañas "Pendientes", "Aprobadas")
    public List<SolicitudCompra> listarPorEstado(String estado) {
        return solicitudCompraRepository.findByEstado(estado);
    }
    
    //Obtener una solicitud específica por ID (Para ver el detalle)
    public Optional<SolicitudCompra> obtenerSolicitudPorId(Long id) {
        return solicitudCompraRepository.findById(id);
    }

    //Obtener los productos (detalles) de una solicitud específica
    public List<SolicitudCompraDetalle> listarDetallesDeSolicitud(Long idSolicitud) {
        SolicitudCompra solicitud = solicitudCompraRepository.findById(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));
        
        return solicitudCompraDetalleRepository.findBySolicitudCompra(solicitud);
    }

    @Transactional(readOnly = true)
    public SolicitudCompra obtenerPorId(Long id) {
        return solicitudCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solcitud de Compra no encontrada con ID: " + id));
    }

}
