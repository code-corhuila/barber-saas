package com.barbersaas.barbershop;

import com.barbersaas.barbershop.dto.BarbershopResponse;
import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.enums.BarbershopStatus;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.mapper.BarbershopMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints publicos de barberias, consumidos por clientes antes de
 * iniciar sesion o sin necesidad de rol especifico.
 */
@RestController
@RequestMapping("/api/public/barbershops")
@RequiredArgsConstructor
@Tag(name = "Barberias (Publico)", description = "Busqueda y detalle de barberias para clientes")
public class BarbershopPublicController {

    private final BarbershopRepository barbershopRepository;
    private final BarbershopMapper barbershopMapper;

    /**
     * Barberias visibles publicamente: ACTIVE y TRIAL (una barberia en
     * periodo de prueba debe poder recibir clientes reales, si no la
     * prueba gratis de 60 dias no tiene forma de demostrar valor).
     * Solo SUSPENDED/CANCELLED quedan fuera de la busqueda.
     */
    private static final List<BarbershopStatus> VISIBLE_STATUSES =
            List.of(BarbershopStatus.ACTIVE, BarbershopStatus.TRIAL);

    /**
     * Lista barberias visibles. Si se envian lat/lng, ordena por distancia
     * aproximada (formula de distancia euclidiana simple sobre grados,
     * suficiente para "cercania" dentro de una misma ciudad -- no es
     * precision geodesica real, pero evita depender de una extension
     * espacial de la base de datos (p. ej. PostGIS) para esta fase).
     */
    @GetMapping
    @Operation(summary = "Buscar barberias visibles (activas o en periodo de prueba), opcionalmente ordenadas por cercania")
    public ResponseEntity<List<BarbershopResponse>> search(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String city) {

        List<Barbershop> barbershops;

        if (city != null && !city.isBlank()) {
            barbershops = barbershopRepository.findByCityIgnoreCase(city);
        } else {
            barbershops = barbershopRepository.findByStatusIn(VISIBLE_STATUSES);
        }

        // Filtra solo visibles (por si vino de findByCityIgnoreCase sin filtrar estado)
        barbershops = barbershops.stream()
                .filter(b -> VISIBLE_STATUSES.contains(b.getStatus()))
                .toList();

        if (lat != null && lng != null) {
            barbershops = barbershops.stream()
                    .sorted((a, b) -> Double.compare(
                            distanceSquared(lat, lng, a.getLatitude(), a.getLongitude()),
                            distanceSquared(lat, lng, b.getLatitude(), b.getLongitude())))
                    .toList();
        }

        return ResponseEntity.ok(barbershops.stream().map(barbershopMapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener el detalle publico de una barberia")
    public ResponseEntity<BarbershopResponse> getById(@PathVariable Long id) {
        Barbershop barbershop = barbershopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        return ResponseEntity.ok(barbershopMapper.toResponse(barbershop));
    }

    /**
     * Distancia euclidiana al cuadrado entre dos coordenadas (lat/lng en grados).
     * No es distancia real en km, pero preserva el ORDEN de cercania,
     * que es todo lo que necesitamos para "ordenar por cercania".
     * Si alguna coordenada es null, se considera "muy lejos".
     */
    private double distanceSquared(double lat1, double lng1, Double lat2, Double lng2) {
        if (lat2 == null || lng2 == null) {
            return Double.MAX_VALUE;
        }
        double dLat = lat1 - lat2;
        double dLng = lng1 - lng2;
        return dLat * dLat + dLng * dLng;
    }
}