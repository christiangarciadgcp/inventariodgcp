package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.asignacionDTO.*;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

@Service
public class AsignacionService {

    private final AsignacionRepository asignacionRepository;
    private final AsignacionDetalleRepository detalleRepository;
    private final SecuenciaActaRepository secuenciaRepository;
    private final AsignacionTipoRepository tipoAsignacionRepository;
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final UsuarioRepository usuarioRepository;
    private final InventarioRepository inventarioRepository;
    private final InventarioService inventarioService;
    private final NotificacionService notificacionService;

    public AsignacionService(AsignacionRepository asignacionRepository,
                             AsignacionDetalleRepository detalleRepository,
                             SecuenciaActaRepository secuenciaRepository,
                             AsignacionTipoRepository tipoAsignacionRepository,
                             ProductoRepository productoRepository,
                             BodegaRepository bodegaRepository,
                             UsuarioRepository usuarioRepository,
                             InventarioRepository inventarioRepository,
                             InventarioService inventarioService,
                             NotificacionService notificacionService) {
        this.asignacionRepository = asignacionRepository;
        this.detalleRepository = detalleRepository;
        this.secuenciaRepository = secuenciaRepository;
        this.tipoAsignacionRepository = tipoAsignacionRepository;
        this.productoRepository = productoRepository;
        this.bodegaRepository = bodegaRepository;
        this.usuarioRepository = usuarioRepository;
        this.inventarioRepository = inventarioRepository;
        this.inventarioService = inventarioService;
        this.notificacionService = notificacionService;
    }

    @Transactional(readOnly = true)
    public List<Asignacion> listarTodas() {
        return asignacionRepository.findAllByOrderByFechaAsignacionDesc();
    }

    @Transactional(readOnly = true)
    public Asignacion obtenerPorId(Long id) {
        return asignacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<AsignacionDetalle> listarDetallesPorAsignacion(Long idAsignacion) {
        Asignacion asignacion = obtenerPorId(idAsignacion);
        return detalleRepository.findByAsignacion(asignacion);
    }

    /**
     * Calcula el correlativo vigente omitiendo actas canceladas. Inicia en 1 para el nuevo ciclo.
     */
    @Transactional(readOnly = true)
    public synchronized int calcularSiguienteCorrelativo(int anio) {
        SecuenciaActa config = secuenciaRepository.findByAnio(anio)
                .orElseGet(() -> {
                    SecuenciaActa nueva = new SecuenciaActa();
                    nueva.setAnio(anio);
                    nueva.setNumeroInicio(1);
                    return secuenciaRepository.save(nueva);
                });

        int baseInicio = (config.getNumeroInicio() != null && config.getNumeroInicio() > 0)
                ? config.getNumeroInicio() : 1;

        return asignacionRepository.findMaxCorrelativoNoCancelado(anio)
                .map(max -> max + 1)
                .orElse(baseInicio);
    }

    @Transactional
    public Asignacion crearAsignacion(AsignacionCreacionDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe agregar al menos un equipo a la asignación.");
        }

        Usuario solicitante = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        AsignacionTipo tipo = tipoAsignacionRepository.findById(dto.getIdAsignacionTipo())
                .orElseThrow(() -> new RuntimeException("Tipo de Asignación no encontrado con ID: " + dto.getIdAsignacionTipo()));

        int anioActual = Year.now().getValue();
        int siguienteCorrelativo = calcularSiguienteCorrelativo(anioActual);
        String numeroActa = siguienteCorrelativo + "-" + anioActual;

        Asignacion asignacion = new Asignacion();
        asignacion.setNumeroActa(numeroActa);
        asignacion.setCorrelativo(siguienteCorrelativo);
        asignacion.setAnio(anioActual);
        asignacion.setTipoAsignacion(tipo);
        asignacion.setResponsableDestino(dto.getResponsableDestino());
        asignacion.setObservaciones(dto.getObservaciones());
        asignacion.setUsuarioCreacion(solicitante);
        asignacion.setFechaAsignacion(Instant.now());
        asignacion.setEstado("REGISTRADA");

        Asignacion guardada = asignacionRepository.save(asignacion);

        for (AsignacionCreacionDTO.ItemAsignacionDTO itemDto : dto.getItems()) {
            Producto producto = productoRepository.findById(itemDto.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto ID " + itemDto.getIdProducto() + " no encontrado"));
            Bodega bodegaOrigen = bodegaRepository.findById(itemDto.getIdBodegaOrigen())
                    .orElseThrow(() -> new RuntimeException("Bodega ID " + itemDto.getIdBodegaOrigen() + " no encontrada"));

            InventarioId invId = new InventarioId();
            invId.setIdProducto(producto.getIdProducto());
            invId.setIdBodega(bodegaOrigen.getIdBodega());
            Inventario inv = inventarioRepository.findById(invId)
                    .orElseThrow(() -> new RuntimeException("El producto " + producto.getNombreproducto() + " no existe en " + bodegaOrigen.getNombrebodega()));

            if (inv.getCantidad_actual() < 1) {
                throw new RuntimeException("Sin stock disponible para " + producto.getNombreproducto() + " en " + bodegaOrigen.getNombrebodega());
            }

            AsignacionDetalle detalle = new AsignacionDetalle();
            detalle.setAsignacion(guardada);
            detalle.setProducto(producto);
            detalle.setBodegaOrigen(bodegaOrigen);
            detalle.setEstado("PENDIENTE");
            detalleRepository.save(detalle);
        }

        guardada.getHistorial().add(new AsignacionHistorial(guardada, solicitante, "CREACION", "Registro de asignación con Acta N° " + numeroActa));
        asignacionRepository.save(guardada);

        notificacionService.registrar(solicitante.getNombreusuario(), "ha registrado la Asignación con Acta N° " + numeroActa);
        return guardada;
    }

    @Transactional
    public Asignacion actualizarAsignacion(Long id, AsignacionCreacionDTO dto) {
        Asignacion asignacion = obtenerPorId(id);

        if (!"REGISTRADA".equals(asignacion.getEstado())) {
            throw new RuntimeException("Solo se pueden editar asignaciones en estado REGISTRADA.");
        }

        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe agregar al menos un equipo a la asignación.");
        }

        Usuario editor = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        AsignacionTipo tipo = tipoAsignacionRepository.findById(dto.getIdAsignacionTipo())
                .orElseThrow(() -> new RuntimeException("Tipo de Asignación no encontrado"));

        asignacion.setTipoAsignacion(tipo);
        asignacion.setResponsableDestino(dto.getResponsableDestino());
        asignacion.setObservaciones(dto.getObservaciones());

        // Eliminamos los detalles previos de la asignación
        List<AsignacionDetalle> detallesActuales = detalleRepository.findByAsignacion(asignacion);
        detalleRepository.deleteAll(detallesActuales);
        detalleRepository.flush();

        // Guardamos los nuevos detalles en estado PENDIENTE
        for (AsignacionCreacionDTO.ItemAsignacionDTO itemDto : dto.getItems()) {
            Producto producto = productoRepository.findById(itemDto.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto ID " + itemDto.getIdProducto() + " no encontrado"));
            Bodega bodegaOrigen = bodegaRepository.findById(itemDto.getIdBodegaOrigen())
                    .orElseThrow(() -> new RuntimeException("Bodega ID " + itemDto.getIdBodegaOrigen() + " no encontrada"));

            InventarioId invId = new InventarioId();
            invId.setIdProducto(producto.getIdProducto());
            invId.setIdBodega(bodegaOrigen.getIdBodega());
            Inventario inv = inventarioRepository.findById(invId)
                    .orElseThrow(() -> new RuntimeException("El producto " + producto.getNombreproducto() + " no existe en " + bodegaOrigen.getNombrebodega()));

            if (inv.getCantidad_actual() < 1) {
                throw new RuntimeException("Sin stock disponible para " + producto.getNombreproducto() + " en " + bodegaOrigen.getNombrebodega());
            }

            AsignacionDetalle detalle = new AsignacionDetalle();
            detalle.setAsignacion(asignacion);
            detalle.setProducto(producto);
            detalle.setBodegaOrigen(bodegaOrigen);
            detalle.setEstado("PENDIENTE");
            detalleRepository.save(detalle);
        }

        asignacion.getHistorial().add(new AsignacionHistorial(asignacion, editor, "EDICION", "Edición de información y equipos asignados"));
        asignacionRepository.save(asignacion);

        notificacionService.registrar(editor.getNombreusuario(), "ha editado la Asignación con Acta N° " + asignacion.getNumeroActa());
        return asignacion;
    }

    @Transactional
    public void aprobarAsignacion(Long idAsignacion, Integer idUsuarioJefe) {
        Asignacion asignacion = obtenerPorId(idAsignacion);

        if (!"REGISTRADA".equals(asignacion.getEstado())) {
            throw new RuntimeException("Solo se pueden aprobar asignaciones en estado REGISTRADA.");
        }

        Usuario jefe = usuarioRepository.findById(idUsuarioJefe)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<AsignacionDetalle> detalles = detalleRepository.findByAsignacion(asignacion);

        for (AsignacionDetalle det : detalles) {
            // Salida física de la bodega
            inventarioService.registrarMovimiento(
                    det.getProducto().getIdProducto(),
                    det.getBodegaOrigen().getIdBodega(),
                    "SALIDA",
                    1,
                    idUsuarioJefe,
                    "Salida por Asignación - Acta N° " + asignacion.getNumeroActa() + " para " + asignacion.getResponsableDestino()
            );

            // CAMBIO DE ESTADO DEL EQUIPO: Pasa formalmente a ASIGNADO
            det.setEstado("ASIGNADO");
            detalleRepository.save(det);
        }

        asignacion.setEstado("ASIGNADA");
        asignacion.setUsuarioAprobacion(jefe);
        asignacion.setFechaAprobacion(Instant.now());

        asignacion.getHistorial().add(new AsignacionHistorial(asignacion, jefe, "APROBACION", "Aprobación y descargo físico de existencias"));
        asignacionRepository.save(asignacion);

        notificacionService.registrar(jefe.getNombreusuario(), "ha aprobado la Asignación Acta N° " + asignacion.getNumeroActa());
    }

    @Transactional
    public void cancelarAsignacion(Long idAsignacion, Integer idUsuarioJefe) {
        Asignacion asignacion = obtenerPorId(idAsignacion);

        if (!"REGISTRADA".equals(asignacion.getEstado())) {
            throw new RuntimeException("Solo se pueden cancelar asignaciones en estado REGISTRADA.");
        }

        Usuario usuario = usuarioRepository.findById(idUsuarioJefe).orElseThrow();
        String numeroActaAnulado = asignacion.getNumeroActa();

        asignacion.setEstado("CANCELADA");
        asignacion.setCorrelativo(null); // Libera el número para la siguiente asignación
        asignacion.setNumeroActa(" (" + numeroActaAnulado + ")");

        asignacion.getHistorial().add(new AsignacionHistorial(asignacion, usuario, "CANCELACION", "Cancelación de solicitud. Número " + numeroActaAnulado + " liberado"));
        asignacionRepository.save(asignacion);

        notificacionService.registrar(usuario.getNombreusuario(), "ha cancelado la Asignación con número original " + numeroActaAnulado);
    }

@Transactional
    public void devolverEquipo(DevolucionItemDTO dto) {
        AsignacionDetalle detalle = detalleRepository.findById(dto.getIdAsignacionDetalle())
                .orElseThrow(() -> new RuntimeException("Detalle de asignación no encontrado"));

        if ("DEVUELTO".equals(detalle.getEstado())) {
            throw new RuntimeException("Este equipo ya fue devuelto.");
        }

        Bodega bodegaDestino = bodegaRepository.findById(dto.getIdBodegaDestino())
                .orElseThrow(() -> new RuntimeException("Bodega destino no válida"));

        Usuario usuario = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Asignacion asignacion = detalle.getAsignacion();

        // Reingreso físico de existencias
        inventarioService.registrarMovimiento(
                detalle.getProducto().getIdProducto(),
                bodegaDestino.getIdBodega(),
                "ENTRADA",
                1,
                dto.getIdUsuario(),
                "Devolución de equipo (Acta N° " + asignacion.getNumeroActa() + "): " + dto.getObservacion()
        );

        detalle.setEstado("DEVUELTO");
        detalle.setFechaDevolucion(Instant.now());
        detalle.setBodegaDevolucion(bodegaDestino);
        detalle.setObservacionDevolucion(dto.getObservacion());
        detalle.setUsuarioDevolucion(usuario);
        detalleRepository.save(detalle);

        List<AsignacionDetalle> todos = detalleRepository.findByAsignacion(asignacion);
        boolean quedanAsignados = todos.stream().anyMatch(d -> "ASIGNADO".equals(d.getEstado()));

        // Ambos estados mantienen la estructura "Devuelto equipo: [nombre] a [bodega]"
        String detalleHistorial = "Devuelto equipo: " + detalle.getProducto().getNombreproducto() + " a " + bodegaDestino.getNombrebodega();

        if (quedanAsignados) {
            asignacion.setEstado("DEVOLUCION PARCIAL");
            asignacion.getHistorial().add(new AsignacionHistorial(asignacion, usuario, "DEVOLUCION PARCIAL", detalleHistorial));
        } else {
            asignacion.setEstado("DEVOLUCION TOTAL");
            asignacion.getHistorial().add(new AsignacionHistorial(asignacion, usuario, "DEVOLUCION TOTAL", detalleHistorial));
        }

        asignacionRepository.save(asignacion);
        notificacionService.registrar(usuario.getNombreusuario(), "ha registrado devolución en Acta N° " + asignacion.getNumeroActa());
    }

    @Transactional
    public void devolverTodosEquipos(DevolucionTotalDTO dto) {
        Asignacion asignacion = obtenerPorId(dto.getIdAsignacion());
        Bodega bodegaDestino = bodegaRepository.findById(dto.getIdBodegaDestino())
                .orElseThrow(() -> new RuntimeException("Bodega destino no válida"));
        Usuario usuario = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<AsignacionDetalle> pendientes = detalleRepository.findByAsignacion(asignacion).stream()
                .filter(d -> "ASIGNADO".equals(d.getEstado()))
                .toList();

        if (pendientes.isEmpty()) {
            throw new RuntimeException("No hay equipos asignados pendientes de devolución en esta acta.");
        }

        // Reingresamos cada equipo individualmente
        for (int i = 0; i < pendientes.size(); i++) {
            AsignacionDetalle det = pendientes.get(i);
            
            inventarioService.registrarMovimiento(
                    det.getProducto().getIdProducto(),
                    bodegaDestino.getIdBodega(),
                    "ENTRADA",
                    1,
                    dto.getIdUsuario(),
                    "Devolución de equipo (Acta N° " + asignacion.getNumeroActa() + "): " + dto.getObservacion()
            );

            det.setEstado("DEVUELTO");
            det.setFechaDevolucion(Instant.now());
            det.setBodegaDevolucion(bodegaDestino);
            det.setObservacionDevolucion(dto.getObservacion());
            det.setUsuarioDevolucion(usuario);
            detalleRepository.save(det);

            // Cada equipo queda reflejado en el historial con DEVOLUCION TOTAL
            asignacion.getHistorial().add(new AsignacionHistorial(
                    asignacion,
                    usuario,
                    "DEVOLUCION TOTAL",
                    "Devuelto equipo: " + det.getProducto().getNombreproducto() + " a " + bodegaDestino.getNombrebodega()
            ));
        }

        asignacion.setEstado("DEVOLUCION TOTAL");
        asignacionRepository.save(asignacion);

        notificacionService.registrar(usuario.getNombreusuario(), "ha registrado devolución total en Acta N° " + asignacion.getNumeroActa());
    }

    // @Transactional(readOnly = true)
    // public List<AsignacionDetalle> listarEquiposActualmenteAsignados() {
    //     return detalleRepository.findEquiposActualmenteAsignados();
    // }

@Transactional(readOnly = true)
    public List<EquipoTrazabilidadDTO> listarResumenTrazabilidadEquipos() {
        // Al haber filtrado en el repositorio, todos los detalles son de actas aprobadas (ASIGNADA, DEVOLUCION PARCIAL o TOTAL)
        List<AsignacionDetalle> todosDetalles = detalleRepository.findAllAsignacionesHistoricas();

        java.util.Map<Integer, List<AsignacionDetalle>> agrupados = todosDetalles.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        d -> d.getProducto().getIdProducto(),
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));

        List<EquipoTrazabilidadDTO> resumenList = new ArrayList<>();

        for (java.util.Map.Entry<Integer, List<AsignacionDetalle>> entry : agrupados.entrySet()) {
            List<AsignacionDetalle> historial = entry.getValue();
            AsignacionDetalle ultimo = historial.get(0); // El más reciente
            Producto p = ultimo.getProducto();

            EquipoTrazabilidadDTO dto = new EquipoTrazabilidadDTO();
            
            dto.setIdProducto(p.getIdProducto());
            dto.setNombreProducto(p.getNombreproducto());
            dto.setSkuProducto(p.getSkuproducto());
            dto.setSerieProducto(p.getSerieproducto());
            dto.setInventarioProducto(p.getInventarioproducto());

            if (p.getModelo() != null) {
                dto.setModelo(p.getModelo().getNombremodelo());
                if (p.getModelo().getMarca() != null) {
                    dto.setMarca(p.getModelo().getMarca().getNombremarca());
                }
            }

            // Si el último detalle no ha sido devuelto, está activamente ASIGNADO
            boolean estaAsignado = "ASIGNADO".equals(ultimo.getEstado());

            dto.setEstadoActual(estaAsignado ? "ASIGNADO" : "DEVUELTO");
            dto.setAsignadoA(ultimo.getAsignacion().getResponsableDestino());
            dto.setUltimaActa(ultimo.getAsignacion().getNumeroActa());
            dto.setFechaUltimaAsignacion(ultimo.getAsignacion().getFechaAsignacion());
            dto.setTotalAsignaciones((long) historial.size());

            resumenList.add(dto);
        }

        return resumenList;
    }

    @Transactional(readOnly = true)
    public List<TrazabilidadItemDTO> obtenerTrazabilidadProducto(Integer idProducto) {
        List<AsignacionDetalle> detalles = detalleRepository.findHistorialPorProducto(idProducto);
        List<TrazabilidadItemDTO> timeline = new ArrayList<>();

        for (AsignacionDetalle d : detalles) {
            TrazabilidadItemDTO dto = new TrazabilidadItemDTO();
            dto.setIdAsignacion(d.getAsignacion().getIdAsignacion());
            dto.setNumeroActa(d.getAsignacion().getNumeroActa());
            dto.setTipoAsignacion(d.getAsignacion().getTipoAsignacion().getNombre());
            dto.setResponsableDestino(d.getAsignacion().getResponsableDestino());
            dto.setFechaAsignacion(d.getAsignacion().getFechaAsignacion());
            dto.setEstadoDetalle(d.getEstado());
            dto.setFechaDevolucion(d.getFechaDevolucion());
            dto.setBodegaDevolucion(d.getBodegaDevolucion() != null ? d.getBodegaDevolucion().getNombrebodega() : null);
            dto.setObservacionDevolucion(d.getObservacionDevolucion());
            dto.setUsuarioAsignador(d.getAsignacion().getUsuarioCreacion().getNombreusuario());
            dto.setUsuarioDevolucion(d.getUsuarioDevolucion() != null ? d.getUsuarioDevolucion().getNombreusuario() : null);
            timeline.add(dto);
        }
        return timeline;
    }
}