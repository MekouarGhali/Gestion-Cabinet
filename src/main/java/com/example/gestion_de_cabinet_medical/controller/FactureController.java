package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Facture;
import com.example.gestion_de_cabinet_medical.service.FactureService;
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
@RequestMapping("/api/factures")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FactureController {

    private final FactureService factureService;

    // CRUD Operations
    @GetMapping
    public ResponseEntity<List<Facture>> getAll() {
        return ResponseEntity.ok(factureService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Facture> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(factureService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<Facture> getByNumero(@PathVariable String numero) {
        try {
            return ResponseEntity.ok(factureService.getByNumero(numero));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Facture facture) {
        try {
            Facture created = factureService.create(facture);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la facture", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Facture facture) {
        try {
            Facture updated = factureService.update(id, facture);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la modification de la facture", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            factureService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de la facture", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Recherche et filtrage
    @GetMapping("/search")
    public ResponseEntity<List<Facture>> search(@RequestParam String q) {
        return ResponseEntity.ok(factureService.search(q));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Facture>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(factureService.getByPatient(patientId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Facture>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(factureService.getByDateRange(dateDebut, dateFin));
    }

    @GetMapping("/mode-paiement/{modePaiement}")
    public ResponseEntity<List<Facture>> getByModePaiement(@PathVariable String modePaiement) {
        return ResponseEntity.ok(factureService.getByModePaiement(modePaiement));
    }

    @GetMapping("/mutuelle/{mutuelle}")
    public ResponseEntity<List<Facture>> getByMutuelle(@PathVariable String mutuelle) {
        return ResponseEntity.ok(factureService.getByMutuelle(mutuelle));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Facture>> getTodayFactures() {
        return ResponseEntity.ok(factureService.getTodayFactures());
    }

    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<Facture>> getByYearAndMonth(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(factureService.getByYearAndMonth(year, month));
    }

    // Statistiques
    @GetMapping("/stats/revenue/{year}/{month}")
    public ResponseEntity<Double> getTotalRevenue(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(factureService.getTotalRevenue(year, month));
    }

    @GetMapping("/stats/mode-paiement")
    public ResponseEntity<List<Object[]>> getStatsByModePaiement() {
        return ResponseEntity.ok(factureService.getStatsByModePaiement());
    }

    // Utilitaires
    @GetMapping("/next-numero")
    public ResponseEntity<Map<String, String>> getNextFactureNumber() {
        String nextNumber = factureService.getNextFactureNumber();
        return ResponseEntity.ok(Map.of("numero", nextNumber));
    }

    @GetMapping("/check-numero/{numero}")
    public ResponseEntity<Map<String, Boolean>> checkNumeroExists(@PathVariable String numero) {
        boolean exists = factureService.isNumeroExists(numero);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Endpoints spécialisés
    @GetMapping("/count")
    public ResponseEntity<Long> getCount() {
        List<Facture> factures = factureService.getAll();
        return ResponseEntity.ok((long) factures.size());
    }

    @GetMapping("/total-revenue")
    public ResponseEntity<Double> getTotalRevenue() {
        List<Facture> factures = factureService.getAll();
        double total = factures.stream()
                .mapToDouble(Facture::getMontantTotal)
                .sum();
        return ResponseEntity.ok(total);
    }

    // Export/Import (pour plus tard)
    @GetMapping("/export")
    public ResponseEntity<?> exportFactures(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        // TODO: Implémenter l'export en PDF/Excel
        return ResponseEntity.ok(Map.of("message", "Export en cours de développement"));
    }
}