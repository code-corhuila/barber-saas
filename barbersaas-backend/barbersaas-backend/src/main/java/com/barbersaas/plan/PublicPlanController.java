package com.barbersaas.plan;

import com.barbersaas.plan.dto.PlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/plans")
@RequiredArgsConstructor
@Tag(name = "Planes (Publico)", description = "Planes de suscripcion visibles para auto-registro de nuevas barberias")
public class PublicPlanController {

    private final SubscriptionPlanService planService;

    @GetMapping
    @Operation(summary = "Listar planes activos disponibles para nuevas barberias")
    public ResponseEntity<List<PlanResponse>> getActivePlans() {
        return ResponseEntity.ok(planService.getAll().stream()
                .filter(PlanResponse::getIsActive)
                .toList());
    }
}