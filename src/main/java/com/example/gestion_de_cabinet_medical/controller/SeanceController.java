package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Seance;
import com.example.gestion_de_cabinet_medical.service.SeanceService;
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
@RequestMapping("/api/seances")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SeanceController {

    private final SeanceService seanceService;

    // ===== CRUD OPERATIONS =====

    @GetMapping
    public ResponseEntity<List<Seance>> getAll() {
        return ResponseEntity.ok(seanceService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seance> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(seanceService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Seance seance) {
        try {
            Seance created = seanceService.create(seance);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Seance seance) {
        try {
            Seance updated = seanceService.update(id, seance);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            seanceService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== RÉCUPÉRATION PAR PATIENT =====

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Seance>> getSeancesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(seanceService.getSeancesByPatient(patientId));
    }

    @GetMapping("/patient/{patientId}/type/{type}")
    public ResponseEntity<List<Seance>> getSeancesByPatientAndType(
            @PathVariable Long patientId,
            @PathVariable Seance.TypeSeance type) {
        return ResponseEntity.ok(seanceService.getSeancesByPatientAndType(patientId, type));
    }

    @GetMapping("/patient/{patientId}/derniere")
    public ResponseEntity<List<Seance>> getLastSeancesForPatient(
            @PathVariable Long patientId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(seanceService.getLastSeancesForPatient(patientId, limit));
    }

    // ===== RÉCUPÉRATION PAR DATE =====

    @GetMapping("/aujourd-hui")
    public ResponseEntity<List<Seance>> getSeancesAujourdHui() {
        return ResponseEntity.ok(seanceService.getSeancesAujourdHui());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Seance>> getSeancesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(seanceService.getSeancesByDate(date));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<Seance>> getSeancesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(seanceService.getSeancesByPeriod(dateDebut, dateFin));
    }

    @GetMapping("/recentes")
    public ResponseEntity<List<Seance>> getSeancesRecentes() {
        return ResponseEntity.ok(seanceService.getSeancesRecentes());
    }

    // ===== RÉCUPÉRATION PAR TYPE =====

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Seance>> getSeancesByType(@PathVariable Seance.TypeSeance type) {
        return ResponseEntity.ok(seanceService.getSeancesByType(type));
    }

    @GetMapping("/types")
    public ResponseEntity<Seance.TypeSeance[]> getTypesSeance() {
        return ResponseEntity.ok(Seance.TypeSeance.values());
    }

    // ===== STATISTIQUES =====

    @GetMapping("/stats/patient/{patientId}")
    public ResponseEntity<Map<String, Object>> getStatsForPatient(@PathVariable Long patientId) {
        Map<String, Object> stats = Map.of(
                "seancesEffectuees", seanceService.countSeancesEffectueesForPatient(patientId),
                "totalSeances", seanceService.countAllSeancesForPatient(patientId),
                "dureeMovenne", seanceService.getAverageSessionDurationForPatient(patientId),
                "repartitionParType", seanceService.getStatsAujourdHuiByType()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/aujourd-hui")
    public ResponseEntity<Map<String, Object>> getStatsAujourdHui() {
        Map<String, Object> stats = Map.of(
                "totalSeances", seanceService.countSeancesAujourdHui(),
                "repartitionParType", seanceService.getStatsAujourdHuiByType()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/mois-courant")
    public ResponseEntity<Map<String, Object>> getStatsMoisCourant() {
        Map<String, Object> stats = Map.of(
                "totalSeancesMois", seanceService.countSeancesMoisCourant(),
                "topPatients", seanceService.getTopPatientsWithMostSessions()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/counts")
    public ResponseEntity<Map<String, Long>> getCounts() {
        Map<String, Long> counts = Map.of(
                "aujourd'hui", seanceService.countSeancesAujourdHui(),
                "moisCourant", seanceService.countSeancesMoisCourant()
        );
        return ResponseEntity.ok(counts);
    }

    // ===== CRÉATION SPÉCIALISÉE =====

    @PostMapping("/manuelle")
    public ResponseEntity<?> createSeanceManuelle(@RequestBody Map<String, Object> request) {
        try {
            Long patientId = Long.valueOf(request.get("patientId").toString());
            LocalDate date = LocalDate.parse((String) request.get("date"));
            LocalTime heureDebut = LocalTime.parse((String) request.get("heureDebut"));
            LocalTime heureFin = LocalTime.parse((String) request.get("heureFin"));
            Seance.TypeSeance type = Seance.TypeSeance.valueOf((String) request.get("type"));
            String observations = (String) request.get("observations");

            Seance seance = seanceService.createSeanceManuelle(patientId, date, heureDebut, heureFin, type, observations);
            return ResponseEntity.ok(seance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== RECHERCHE =====

    @GetMapping("/search")
    public ResponseEntity<List<Seance>> search(@RequestParam String q) {
        return ResponseEntity.ok(seanceService.search(q));
    }

    // ===== MISE À JOUR DES COMPTEURS =====

    @PostMapping("/patient/{patientId}/update-counter")
    public ResponseEntity<?> updatePatientSeancesCounter(@PathVariable Long patientId) {
        try {
            seanceService.updatePatientSeancesEffectuees(patientId);
            return ResponseEntity.ok(Map.of("message", "Compteur de séances mis à jour"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== UTILITAIRES =====

    @GetMapping("/dernieres")
    public ResponseEntity<List<Seance>> getDernieresSeancesAjoutees() {
        return ResponseEntity.ok(seanceService.getDernieresSeancesAjoutees());
    }
}