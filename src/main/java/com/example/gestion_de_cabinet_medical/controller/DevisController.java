package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Devis;
import com.example.gestion_de_cabinet_medical.service.DevisService;
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
@RequestMapping("/api/devis")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DevisController {

    private final DevisService devisService;

    // CRUD Operations
    @GetMapping
    public ResponseEntity<List<Devis>> getAll() {
        return ResponseEntity.ok(devisService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Devis> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(devisService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<Devis> getByNumero(@PathVariable String numero) {
        try {
            return ResponseEntity.ok(devisService.getByNumero(numero));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Devis devis) {
        try {
            Devis created = devisService.create(devis);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création du devis", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            devisService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression du devis", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Recherche et filtrage
    @GetMapping("/search")
    public ResponseEntity<List<Devis>> search(@RequestParam String q) {
        return ResponseEntity.ok(devisService.search(q));
    }

    @GetMapping("/patient/{nomPatient}")
    public ResponseEntity<List<Devis>> getByNomPatient(@PathVariable String nomPatient) {
        return ResponseEntity.ok(devisService.getByNomPatient(nomPatient));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Devis>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(devisService.getByDateRange(dateDebut, dateFin));
    }

    @GetMapping("/mutuelle/{mutuelle}")
    public ResponseEntity<List<Devis>> getByMutuelle(@PathVariable String mutuelle) {
        return ResponseEntity.ok(devisService.getByMutuelle(mutuelle));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Devis>> getTodayDevis() {
        return ResponseEntity.ok(devisService.getTodayDevis());
    }

    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<Devis>> getByYearAndMonth(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(devisService.getByYearAndMonth(year, month));
    }

    // Statistiques
    @GetMapping("/stats/revenue/{year}/{month}")
    public ResponseEntity<Double> getTotalRevenue(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(devisService.getTotalRevenue(year, month));
    }

    @GetMapping("/stats/mutuelle")
    public ResponseEntity<List<Object[]>> getStatsByMutuelle() {
        return ResponseEntity.ok(devisService.getStatsByMutuelle());
    }

    // Utilitaires
    @GetMapping("/next-numero")
    public ResponseEntity<Map<String, String>> getNextDevisNumber() {
        String nextNumber = devisService.getNextDevisNumber();
        return ResponseEntity.ok(Map.of("numero", nextNumber));
    }

    @GetMapping("/check-numero/{numero}")
    public ResponseEntity<Map<String, Boolean>> checkNumeroExists(@PathVariable String numero) {
        boolean exists = devisService.isNumeroExists(numero);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Endpoints spécialisés
    @GetMapping("/count")
    public ResponseEntity<Long> getCount() {
        List<Devis> devis = devisService.getAll();
        return ResponseEntity.ok((long) devis.size());
    }

    @GetMapping("/total-revenue")
    public ResponseEntity<Double> getTotalRevenue() {
        List<Devis> devis = devisService.getAll();
        double total = devis.stream()
                .mapToDouble(Devis::getMontantTotal)
                .sum();
        return ResponseEntity.ok(total);
    }

    // Export/Import (pour plus tard)
    @GetMapping("/export")
    public ResponseEntity<?> exportDevis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        // TODO: Implémenter l'export en PDF/Excel
        return ResponseEntity.ok(Map.of("message", "Export en cours de développement"));
    }
}