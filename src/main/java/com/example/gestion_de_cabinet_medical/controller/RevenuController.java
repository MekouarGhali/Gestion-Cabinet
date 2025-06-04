package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Revenu;
import com.example.gestion_de_cabinet_medical.service.RevenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/revenus")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RevenuController {

    private final RevenuService revenuService;

    // CRUD Operations
    @GetMapping
    public ResponseEntity<List<Revenu>> getAll() {
        return ResponseEntity.ok(revenuService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Revenu> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(revenuService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String statutStr = request.get("statut");
            Revenu.StatutRevenu statut = Revenu.StatutRevenu.valueOf(statutStr.toUpperCase());
            Revenu updated = revenuService.updateStatut(id, statut);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour du statut du revenu", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            revenuService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression du revenu", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Recherche et filtrage
    @GetMapping("/search")
    public ResponseEntity<List<Revenu>> search(@RequestParam String q) {
        return ResponseEntity.ok(revenuService.search(q));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Revenu>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(revenuService.getByPatient(patientId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Revenu>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(revenuService.getByDateRange(dateDebut, dateFin));
    }

    @GetMapping("/mode-paiement/{modePaiement}")
    public ResponseEntity<List<Revenu>> getByModePaiement(@PathVariable String modePaiement) {
        return ResponseEntity.ok(revenuService.getByModePaiement(modePaiement));
    }

    @GetMapping("/mutuelle/{mutuelle}")
    public ResponseEntity<List<Revenu>> getByMutuelle(@PathVariable String mutuelle) {
        return ResponseEntity.ok(revenuService.getByMutuelle(mutuelle));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Revenu>> getByStatut(@PathVariable String statut) {
        try {
            Revenu.StatutRevenu statutEnum = Revenu.StatutRevenu.valueOf(statut.toUpperCase());
            return ResponseEntity.ok(revenuService.getByStatut(statutEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/today")
    public ResponseEntity<List<Revenu>> getTodayRevenus() {
        return ResponseEntity.ok(revenuService.getTodayRevenus());
    }

    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<Revenu>> getByYearAndMonth(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(revenuService.getByYearAndMonth(year, month));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<Revenu>> getByYear(@PathVariable int year) {
        return ResponseEntity.ok(revenuService.getByYear(year));
    }

    // Statistiques
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(revenuService.getStatistics());
    }

    @GetMapping("/stats/monthly/{year}")
    public ResponseEntity<List<Object[]>> getMonthlyRevenueByYear(@PathVariable int year) {
        return ResponseEntity.ok(revenuService.getMonthlyRevenueByYear(year));
    }

    @GetMapping("/stats/yearly")
    public ResponseEntity<List<Object[]>> getYearlyRevenue() {
        return ResponseEntity.ok(revenuService.getYearlyRevenue());
    }

    @GetMapping("/stats/prestations/{year}/{month}")
    public ResponseEntity<List<Object[]>> getRevenueByPrestationType(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(revenuService.getRevenueByPrestationType(year, month));
    }

    @GetMapping("/stats/mode-paiement")
    public ResponseEntity<List<Object[]>> getStatsByModePaiement() {
        return ResponseEntity.ok(revenuService.getStatsByModePaiement());
    }

    // Export (pour plus tard)
    @GetMapping("/export")
    public ResponseEntity<?> exportRevenus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        // TODO: Implémenter l'export en PDF/Excel
        return ResponseEntity.ok(Map.of("message", "Export en cours de développement"));
    }
}