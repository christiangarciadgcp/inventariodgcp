package com.sistemainventario.inventario.service;

import com.sistemainventario.inventario.dto.asignacionDTO.*;
import com.sistemainventario.inventario.model.*;
import com.sistemainventario.inventario.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;

@Service
public class AsignacionService {

    private final Integer ID_BODEGA_ASIGNACION = 7;

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
    private final UbicacionRepository ubicacionRepository;

    public AsignacionService(AsignacionRepository asignacionRepository,
                             AsignacionDetalleRepository detalleRepository,
                             SecuenciaActaRepository secuenciaRepository,
                             AsignacionTipoRepository tipoAsignacionRepository,
                             ProductoRepository productoRepository,
                             BodegaRepository bodegaRepository,
                             UsuarioRepository usuarioRepository,
                             InventarioRepository inventarioRepository,
                             InventarioService inventarioService,
                             NotificacionService notificacionService,
                             UbicacionRepository ubicacionRepository) {
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
        this.ubicacionRepository = ubicacionRepository;
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

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getIdUbicacion())
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        int anioActual = Year.now().getValue();
        int siguienteCorrelativo = calcularSiguienteCorrelativo(anioActual);
        String numeroActa = siguienteCorrelativo + "-" + anioActual;

        Asignacion asignacion = new Asignacion();
        asignacion.setNumeroActa(numeroActa);
        asignacion.setCorrelativo(siguienteCorrelativo);
        asignacion.setAnio(anioActual);
        asignacion.setTipoAsignacion(tipo);
        asignacion.setUbicacion(ubicacion);
        asignacion.setResponsableDestino(dto.getResponsableDestino() != null ? dto.getResponsableDestino().trim() : "");
        asignacion.setObservaciones(dto.getObservaciones());
        asignacion.setUsuarioCreacion(solicitante);
        asignacion.setFechaAsignacion(Instant.now());
        asignacion.setEstado("REGISTRADA");

        Asignacion guardada = asignacionRepository.save(asignacion);
        String motivoReserva = "Reserva para Asignación - Acta N° " + numeroActa;

        for (AsignacionCreacionDTO.ItemAsignacionDTO itemDto : dto.getItems()) {
            Producto producto = productoRepository.findById(itemDto.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto ID " + itemDto.getIdProducto() + " no encontrado"));
            Bodega bodegaOrigen = bodegaRepository.findById(itemDto.getIdBodegaOrigen())
                    .orElseThrow(() -> new RuntimeException("Bodega ID " + itemDto.getIdBodegaOrigen() + " no encontrada"));

            // 1. Mover de Bodega Física Origen -> Bodega Asignación (ID = 7)
            inventarioService.registrarMovimiento(
                    producto.getIdProducto(),
                    bodegaOrigen.getIdBodega(),
                    "SALIDA",
                    1,
                    solicitante.getIdUsuario(),
                    motivoReserva
            );

            inventarioService.registrarMovimiento(
                    producto.getIdProducto(),
                    ID_BODEGA_ASIGNACION,
                    "ENTRADA",
                    1,
                    solicitante.getIdUsuario(),
                    motivoReserva
            );

            // 2. Guardar detalle conservando su bodega física de origen
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
        String estadoActualActa = asignacion.getEstado();

        // 1. Bloquear edición si el acta está finalizada o cancelada
        if ("DEVOLUCION TOTAL".equals(estadoActualActa) || "CANCELADA".equals(estadoActualActa)) {
            throw new RuntimeException("No se pueden editar asignaciones finalizadas (DEVOLUCION TOTAL) o canceladas.");
        }

        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe agregar al menos un equipo a la asignación.");
        }

        Usuario editor = usuarioRepository.findById(dto.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        AsignacionTipo tipo = tipoAsignacionRepository.findById(dto.getIdAsignacionTipo())
                .orElseThrow(() -> new RuntimeException("Tipo de Asignación no encontrado"));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getIdUbicacion())
                .orElseThrow(() -> new RuntimeException("Ubicacion no encontrada"));

        asignacion.setTipoAsignacion(tipo);
        asignacion.setUbicacion(ubicacion);
        asignacion.setResponsableDestino(dto.getResponsableDestino() != null ? dto.getResponsableDestino().trim() : "");
        asignacion.setObservaciones(dto.getObservaciones());

        boolean actaYaAprobada = "ASIGNADA".equals(estadoActualActa) || "DEVOLUCION PARCIAL".equals(estadoActualActa);

        List<AsignacionDetalle> detallesActuales = detalleRepository.findByAsignacion(asignacion);

        Set<Integer> idsNuevos = dto.getItems().stream()
                .map(AsignacionCreacionDTO.ItemAsignacionDTO::getIdProducto)
                .collect(Collectors.toSet());

        Map<Integer, AsignacionDetalle> mapaAnteriores = detallesActuales.stream()
                .collect(Collectors.toMap(d -> d.getProducto().getIdProducto(), d -> d, (a, b) -> a));

        List<String> resumenCambios = new ArrayList<>();
        List<AsignacionDetalle> detallesAEliminar = new ArrayList<>();

        // 2. PROCESAR ÚNICAMENTE LOS EQUIPOS QUITADOS (sin tocar los que permanecen en el acta)
        for (AsignacionDetalle detAntiguo : detallesActuales) {
            Integer idProdAntiguo = detAntiguo.getProducto().getIdProducto();
            if (!idsNuevos.contains(idProdAntiguo)) {
                String estadoItem = detAntiguo.getEstado() != null ? detAntiguo.getEstado().toUpperCase() : "PENDIENTE";
                String nombreProd = detAntiguo.getProducto().getNombreproducto();
                String nombreBodegaOrigen = detAntiguo.getBodegaOrigen().getNombrebodega();

                if ("PENDIENTE".equals(estadoItem)) {
                    // Equipo en reserva (Bodega Asignación ID 7) -> Regresar a bodega física de origen
                    InventarioId invReservaId = new InventarioId();
                    invReservaId.setIdProducto(idProdAntiguo);
                    invReservaId.setIdBodega(ID_BODEGA_ASIGNACION);

                    boolean estaEnReserva = inventarioRepository.findById(invReservaId)
                            .map(i -> i.getCantidad_actual() > 0)
                            .orElse(false);

                    if (estaEnReserva) {
                        String motivoLiberacion = "Liberación de reserva por edición - Acta N° " + asignacion.getNumeroActa();
                        inventarioService.registrarMovimiento(
                                idProdAntiguo,
                                ID_BODEGA_ASIGNACION,
                                "SALIDA",
                                1,
                                editor.getIdUsuario(),
                                motivoLiberacion
                        );
                        inventarioService.registrarMovimiento(
                                idProdAntiguo,
                                detAntiguo.getBodegaOrigen().getIdBodega(),
                                "ENTRADA",
                                1,
                                editor.getIdUsuario(),
                                motivoLiberacion
                        );
                    }
                    resumenCambios.add("Retirado de reserva: " + nombreProd);
                } else if ("ASIGNADO".equals(estadoItem)) {
                    // Enfoque híbrido: Equipo ya despachado -> Devolver automáticamente a su bodega física de origen
                    String motivoDevolucionAuto = "Devolución automática por edición - Acta N° " + asignacion.getNumeroActa();
                    inventarioService.registrarMovimiento(
                            idProdAntiguo,
                            detAntiguo.getBodegaOrigen().getIdBodega(),
                            "ENTRADA",
                            1,
                            editor.getIdUsuario(),
                            motivoDevolucionAuto
                    );
                    resumenCambios.add("Devuelto a " + nombreBodegaOrigen + " y retirado: " + nombreProd);
                } else if ("DEVUELTO".equals(estadoItem)) {
                    // Ya fue devuelto previamente -> Solo eliminar del acta sin alterar stock
                    resumenCambios.add("Retirado del acta (ya devuelto): " + nombreProd);
                }

                detallesAEliminar.add(detAntiguo);
            }
        }

        if (!detallesAEliminar.isEmpty()) {
            detalleRepository.deleteAll(detallesAEliminar);
            detalleRepository.flush();
        }

        // 3. PROCESAR ÚNICAMENTE LOS EQUIPOS NUEVOS AGREGADOS (los existentes conservan intacto su estado y fechas)
        for (AsignacionCreacionDTO.ItemAsignacionDTO itemDto : dto.getItems()) {
            Integer idProd = itemDto.getIdProducto();

            if (mapaAnteriores.containsKey(idProd)) {
                continue;
            }

            Producto producto = productoRepository.findById(idProd)
                    .orElseThrow(() -> new RuntimeException("Producto ID " + idProd + " no encontrado"));
            Bodega bodegaOrigen = bodegaRepository.findById(itemDto.getIdBodegaOrigen())
                    .orElseThrow(() -> new RuntimeException("Bodega ID " + itemDto.getIdBodegaOrigen() + " no encontrada"));

            AsignacionDetalle nuevoDetalle = new AsignacionDetalle();
            nuevoDetalle.setAsignacion(asignacion);
            nuevoDetalle.setProducto(producto);
            nuevoDetalle.setBodegaOrigen(bodegaOrigen);

            if (actaYaAprobada) {
                // Acta ya aprobada: salida directa de bodega física y estado ASIGNADO
                inventarioService.registrarMovimiento(
                        producto.getIdProducto(),
                        bodegaOrigen.getIdBodega(),
                        "SALIDA",
                        1,
                        editor.getIdUsuario(),
                        "Salida por Asignación (Edición) - Acta N° " + asignacion.getNumeroActa() + " para " + ubicacion.getNombreubicacion()
                );
                nuevoDetalle.setEstado("ASIGNADO");
            } else {
                // Acta aún en REGISTRADA: mover de bodega origen -> Bodega Asignación (ID = 7) en estado PENDIENTE
                String motivoReserva = "Reserva para Asignación (Edición) - Acta N° " + asignacion.getNumeroActa();
                inventarioService.registrarMovimiento(
                        producto.getIdProducto(),
                        bodegaOrigen.getIdBodega(),
                        "SALIDA",
                        1,
                        editor.getIdUsuario(),
                        motivoReserva
                );
                inventarioService.registrarMovimiento(
                        producto.getIdProducto(),
                        ID_BODEGA_ASIGNACION,
                        "ENTRADA",
                        1,
                        editor.getIdUsuario(),
                        motivoReserva
                );
                nuevoDetalle.setEstado("PENDIENTE");
            }

            detalleRepository.save(nuevoDetalle);
            resumenCambios.add("Agregado: " + producto.getNombreproducto());
        }

        detalleRepository.flush();

        // 4. RECALCULAR ESTADO DE CABECERA EN ACTAS YA APROBADAS
        if (actaYaAprobada) {
            List<AsignacionDetalle> detallesFinales = detalleRepository.findByAsignacion(asignacion);
            boolean hayAsignados = detallesFinales.stream().anyMatch(d -> "ASIGNADO".equalsIgnoreCase(d.getEstado()));
            boolean hayDevueltos = detallesFinales.stream().anyMatch(d -> "DEVUELTO".equalsIgnoreCase(d.getEstado()));

            if (hayAsignados && hayDevueltos) {
                asignacion.setEstado("DEVOLUCION PARCIAL");
            } else if (hayAsignados) {
                asignacion.setEstado("ASIGNADA");
            } else if (hayDevueltos) {
                asignacion.setEstado("DEVOLUCION TOTAL");
            }
        }

        String detalleHistorial = resumenCambios.isEmpty()
                ? "Edición de datos generales del acta"
                : "Edición de acta: " + String.join(" | ", resumenCambios);
        if (detalleHistorial.length() > 495) {
            detalleHistorial = detalleHistorial.substring(0, 492) + "...";
        }

        asignacion.getHistorial().add(new AsignacionHistorial(asignacion, editor, "EDICION", detalleHistorial));
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
            Integer idProd = det.getProducto().getIdProducto();

            InventarioId invReservaId = new InventarioId();
            invReservaId.setIdProducto(idProd);
            invReservaId.setIdBodega(ID_BODEGA_ASIGNACION);

            boolean estaEnBodegaAsignacion = inventarioRepository.findById(invReservaId)
                    .map(i -> i.getCantidad_actual() > 0)
                    .orElse(false);

            Integer idBodegaDescargo = estaEnBodegaAsignacion
                    ? ID_BODEGA_ASIGNACION
                    : det.getBodegaOrigen().getIdBodega();

            inventarioService.registrarMovimiento(
                    idProd,
                    idBodegaDescargo,
                    "SALIDA",
                    1,
                    idUsuarioJefe,
                    "Salida por Asignación - Acta N° " + asignacion.getNumeroActa() + " para " + asignacion.getUbicacion().getNombreubicacion()
            );

            det.setEstado("ASIGNADO");
            detalleRepository.save(det);
        }

        asignacion.setEstado("ASIGNADA");
        asignacion.setUsuarioAprobacion(jefe);
        asignacion.setFechaAprobacion(Instant.now());

        asignacion.getHistorial().add(new AsignacionHistorial(asignacion, jefe, "ASIGNACION", "Aprobación y descargo físico de existencias"));
        asignacionRepository.save(asignacion);

        notificacionService.registrar(jefe.getNombreusuario(), "ha despachado Equipos en la Asignación Acta N° " + asignacion.getNumeroActa());
    }

    @Transactional
    public void cancelarAsignacion(Long idAsignacion, Integer idUsuarioJefe) {
        Asignacion asignacion = obtenerPorId(idAsignacion);

        if (!"REGISTRADA".equals(asignacion.getEstado())) {
            throw new RuntimeException("Solo se pueden cancelar asignaciones en estado REGISTRADA.");
        }

        Usuario usuario = usuarioRepository.findById(idUsuarioJefe).orElseThrow();
        String numeroActaAnulado = asignacion.getNumeroActa();

        List<AsignacionDetalle> detalles = detalleRepository.findByAsignacion(asignacion);

        for (AsignacionDetalle det : detalles) {
            Integer idProd = det.getProducto().getIdProducto();

            InventarioId invReservaId = new InventarioId();
            invReservaId.setIdProducto(idProd);
            invReservaId.setIdBodega(ID_BODEGA_ASIGNACION);

            boolean estaEnBodegaAsignacion = inventarioRepository.findById(invReservaId)
                    .map(i -> i.getCantidad_actual() > 0)
                    .orElse(false);

            if (estaEnBodegaAsignacion) {
                String motivoCancelacion = "Reversión de reserva por cancelación - Acta N° " + numeroActaAnulado;
                inventarioService.registrarMovimiento(
                        idProd,
                        ID_BODEGA_ASIGNACION,
                        "SALIDA",
                        1,
                        idUsuarioJefe,
                        motivoCancelacion
                );

                inventarioService.registrarMovimiento(
                        idProd,
                        det.getBodegaOrigen().getIdBodega(),
                        "ENTRADA",
                        1,
                        idUsuarioJefe,
                        motivoCancelacion
                );
            }
        }

        asignacion.setEstado("CANCELADA");
        asignacion.setCorrelativo(null);
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

        for (AsignacionDetalle det : pendientes) {
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

    @Transactional(readOnly = true)
    public List<EquipoTrazabilidadDTO> listarResumenTrazabilidadEquipos() {
        List<AsignacionDetalle> todosDetalles = detalleRepository.findAllAsignacionesHistoricas();

        Map<Integer, List<AsignacionDetalle>> agrupados = todosDetalles.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getProducto().getIdProducto(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<EquipoTrazabilidadDTO> resumenList = new ArrayList<>();

        for (Entry<Integer, List<AsignacionDetalle>> entry : agrupados.entrySet()) {
            List<AsignacionDetalle> historial = entry.getValue();
            AsignacionDetalle ultimo = historial.get(0);
            Producto p = ultimo.getProducto();
            Asignacion asig = ultimo.getAsignacion();

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

            if (asig.getUbicacion() != null) {
                dto.setNombreUbicacion(asig.getUbicacion().getNombreubicacion());
                dto.setSiglasUbicacion(asig.getUbicacion().getSiglasubicacion());
            }

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
            Asignacion asig = d.getAsignacion();
            TrazabilidadItemDTO dto = new TrazabilidadItemDTO();

            dto.setIdAsignacion(d.getAsignacion().getIdAsignacion());
            dto.setNumeroActa(d.getAsignacion().getNumeroActa());
            dto.setTipoAsignacion(d.getAsignacion().getTipoAsignacion().getNombre());

            if (asig.getUbicacion() != null) {
                dto.setNombreUbicacion(asig.getUbicacion().getNombreubicacion());
                dto.setSiglasUbicacion(asig.getUbicacion().getSiglasubicacion());
            }

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
