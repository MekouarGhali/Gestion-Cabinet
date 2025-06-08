package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Tache;
import com.example.gestion_de_cabinet_medical.service.TacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/taches")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;

    // ===== CRUD OPERATIONS =====

    @GetMapping
    public ResponseEntity<List<Tache>> getAll() {
        return ResponseEntity.ok(tacheService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tache> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tacheService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Tache tache) {
        try {
            Tache created = tacheService.create(tache);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Tache tache) {
        try {
            Tache updated = tacheService.update(id, tache);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            tacheService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== GESTION DES STATUTS =====

    @PutMapping("/{id}/terminer")
    public ResponseEntity<?> marquerTerminee(@PathVariable Long id) {
        try {
            Tache tache = tacheService.marquerTerminee(id);
            return ResponseEntity.ok(tache);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/non-terminee")
    public ResponseEntity<?> marquerNonTerminee(@PathVariable Long id) {
        try {
            Tache tache = tacheService.marquerNonTerminee(id);
            return ResponseEntity.ok(tache);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== RÉCUPÉRATION PAR CATÉGORIES =====

    @GetMapping("/aujourd-hui")
    public ResponseEntity<List<Tache>> getTachesAujourdHui() {
        return ResponseEntity.ok(tacheService.getTachesAujourdHui());
    }

    @GetMapping("/aujourd-hui/non-terminees")
    public ResponseEntity<List<Tache>> getTachesAujourdHuiNonTerminees() {
        return ResponseEntity.ok(tacheService.getTachesAujourdHuiNonTerminees());
    }

    @GetMapping("/demain")
    public ResponseEntity<List<Tache>> getTachesDemain() {
        return ResponseEntity.ok(tacheService.getTachesDemain());
    }

    @GetMapping("/en-retard")
    public ResponseEntity<List<Tache>> getTachesEnRetard() {
        return ResponseEntity.ok(tacheService.getTachesEnRetard());
    }

    @GetMapping("/prochaines")
    public ResponseEntity<List<Tache>> getTachesProchaines() {
        return ResponseEntity.ok(tacheService.getTachesProchaines());
    }

    @GetMapping("/non-terminees")
    public ResponseEntity<List<Tache>> getTachesNonTerminees() {
        return ResponseEntity.ok(tacheService.getTachesNonTerminees());
    }

    @GetMapping("/terminees")
    public ResponseEntity<List<Tache>> getTachesTerminees() {
        return ResponseEntity.ok(tacheService.getTachesTerminees());
    }

    // ===== RÉCUPÉRATION PAR DATE =====

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Tache>> getTachesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(tacheService.getTachesByDate(date));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<Tache>> getTachesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(tacheService.getTachesByPeriod(dateDebut, dateFin));
    }

    // ===== RECHERCHE =====

    @GetMapping("/search")
    public ResponseEntity<List<Tache>> search(@RequestParam String q) {
        return ResponseEntity.ok(tacheService.search(q));
    }

    // ===== STATISTIQUES =====

    @GetMapping("/stats/aujourd-hui")
    public ResponseEntity<Map<String, Object>> getStatsAujourdHui() {
        Map<String, Object> stats = Map.of(
                "total", tacheService.countTachesAujourdHui(),
                "terminees", tacheService.countTachesTermineesAujourdHui(),
                "enRetard", tacheService.countTachesEnRetard(),
                "pourcentageCompletion", tacheService.getPourcentageCompletionAujourdHui()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/counts")
    public ResponseEntity<Map<String, Long>> getCounts() {
        Map<String, Long> counts = Map.of(
                "aujourd'hui", tacheService.countTachesAujourdHui(),
                "termineesAujourdHui", tacheService.countTachesTermineesAujourdHui(),
                "enRetard", tacheService.countTachesEnRetard()
        );
        return ResponseEntity.ok(counts);
    }

    // ===== CRÉATIONS RAPIDES =====

    @PostMapping("/rapide/aujourd-hui")
    public ResponseEntity<?> createTacheAujourdHui(@RequestBody Map<String, Object> request) {
        try {
            String description = (String) request.get("description");
            String heureStr = (String) request.get("heure");

            LocalTime heure = null;
            if (heureStr != null && !heureStr.isEmpty()) {
                heure = LocalTime.parse(heureStr);
            }

            Tache tache = tacheService.createTacheAujourdHui(description, heure);
            return ResponseEntity.ok(tache);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rapide/demain")
    public ResponseEntity<?> createTacheDemain(@RequestBody Map<String, Object> request) {
        try {
            String description = (String) request.get("description");
            String heureStr = (String) request.get("heure");

            LocalTime heure = null;
            if (heureStr != null && !heureStr.isEmpty()) {
                heure = LocalTime.parse(heureStr);
            }

            Tache tache = tacheService.createTacheDemain(description, heure);
            return ResponseEntity.ok(tache);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rapide/personnalisee")
    public ResponseEntity<?> createTachePersonnalisee(@RequestBody Map<String, Object> request) {
        try {
            String description = (String) request.get("description");
            String dateStr = (String) request.get("date");
            String heureStr = (String) request.get("heure");

            LocalDate date = LocalDate.parse(dateStr);
            LocalTime heure = null;
            if (heureStr != null && !heureStr.isEmpty()) {
                heure = LocalTime.parse(heureStr);
            }

            Tache tache = tacheService.createTachePersonnalisee(description, date, heure);
            return ResponseEntity.ok(tache);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== NETTOYAGE =====

    @PostMapping("/nettoyage/manuel")
    public ResponseEntity<Map<String, Object>> nettoyageManuel() {
        try {
            int nbSupprimees = tacheService.nettoyageManuelTachesTerminees();
            return ResponseEntity.ok(Map.of(
                    "message", "Nettoyage effectué avec succès",
                    "tachesSupprimees", nbSupprimees
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== UTILITAIRES =====

    @GetMapping("/dernieres")
    public ResponseEntity<List<Tache>> getDernieresTachesAjoutees() {
        return ResponseEntity.ok(tacheService.getDernieresTachesAjoutees(10));
    }

    @GetMapping("/validation")
    public ResponseEntity<Map<String, Boolean>> validateTache(
            @RequestParam String description,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean isValid = tacheService.isTacheValidePourCreation(description, date);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/check/aujourd-hui")
    public ResponseEntity<Map<String, Boolean>> checkTachesAujourdHui() {
        return ResponseEntity.ok(Map.of(
                "hasTachesAujourdHui", tacheService.hasTachesAujourdHui(),
                "hasTachesEnRetard", tacheService.hasTachesEnRetard()
        ));
    }
}