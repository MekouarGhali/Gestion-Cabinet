package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.RendezVous;
import com.example.gestion_de_cabinet_medical.service.RendezVousService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rendez-vous")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService rendezVousService;

    // CRUD Operations
    @GetMapping
    public ResponseEntity<List<RendezVous>> getAll() {
        return ResponseEntity.ok(rendezVousService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RendezVous> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rendezVousService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RendezVous rendezVous) {
        try {
            RendezVous created = rendezVousService.create(rendezVous);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody RendezVous rendezVous) {
        try {
            RendezVous updated = rendezVousService.update(id, rendezVous);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            rendezVousService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Recherche par date
    @GetMapping("/date/{date}")
    public ResponseEntity<List<RendezVous>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(rendezVousService.getByDate(date));
    }

    // Recherche par plage de dates
    @GetMapping("/date-range")
    public ResponseEntity<List<RendezVous>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(rendezVousService.getByDateRange(dateDebut, dateFin));
    }

    // Recherche par patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<RendezVous>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(rendezVousService.getByPatient(patientId));
    }

    // Recherche par statut
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<RendezVous>> getByStatut(@PathVariable String statut) {
        try {
            RendezVous.StatutRendezVous statutEnum = RendezVous.StatutRendezVous.valueOf(statut.toUpperCase());
            return ResponseEntity.ok(rendezVousService.getByStatut(statutEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Recherche par type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<RendezVous>> getByType(@PathVariable String type) {
        try {
            RendezVous.TypeRendezVous typeEnum = RendezVous.TypeRendezVous.valueOf(type.toUpperCase());
            return ResponseEntity.ok(rendezVousService.getByType(typeEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Recherche par nom de patient
    @GetMapping("/search")
    public ResponseEntity<List<RendezVous>> searchByPatientName(@RequestParam String q) {
        return ResponseEntity.ok(rendezVousService.searchByPatientName(q));
    }

    // Rendez-vous d'aujourd'hui
    @GetMapping("/today")
    public ResponseEntity<List<RendezVous>> getTodayAppointments() {
        return ResponseEntity.ok(rendezVousService.getTodayAppointments());
    }

    // Rendez-vous de la semaine courante
    @GetMapping("/current-week")
    public ResponseEntity<List<RendezVous>> getCurrentWeekAppointments() {
        return ResponseEntity.ok(rendezVousService.getCurrentWeekAppointments());
    }

    // Rendez-vous d'une semaine spécifique
    @GetMapping("/week/{startDate}")
    public ResponseEntity<List<RendezVous>> getWeekAppointments(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        return ResponseEntity.ok(rendezVousService.getWeekAppointments(startDate));
    }

    // Prochains rendez-vous
    @GetMapping("/upcoming")
    public ResponseEntity<List<RendezVous>> getUpcomingAppointments() {
        return ResponseEntity.ok(rendezVousService.getUpcomingAppointments());
    }

    // Rendez-vous en retard
    @GetMapping("/overdue")
    public ResponseEntity<List<RendezVous>> getOverdueAppointments() {
        return ResponseEntity.ok(rendezVousService.getOverdueAppointments());
    }

    // Rendez-vous récurrents
    @GetMapping("/recurring")
    public ResponseEntity<List<RendezVous>> getRecurringAppointments() {
        return ResponseEntity.ok(rendezVousService.getRecurringAppointments());
    }

    // Gestion des statuts
    @PutMapping("/{id}/confirmer")
    public ResponseEntity<RendezVous> confirmerRendezVous(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rendezVousService.confirmerRendezVous(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/commencer")
    public ResponseEntity<RendezVous> commencerRendezVous(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rendezVousService.commencerRendezVous(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/terminer")
    public ResponseEntity<RendezVous> terminerRendezVous(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rendezVousService.terminerRendezVous(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<RendezVous> annulerRendezVous(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rendezVousService.annulerRendezVous(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/reporter")
    public ResponseEntity<?> reporterRendezVous(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate nouvelleDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime nouvelleHeure) {
        try {
            RendezVous reporte = rendezVousService.reporterRendezVous(id, nouvelleDate, nouvelleHeure);
            return ResponseEntity.ok(reporte);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Statistiques
    @GetMapping("/stats/statut/{statut}")
    public ResponseEntity<Long> countByStatut(@PathVariable String statut) {
        try {
            RendezVous.StatutRendezVous statutEnum = RendezVous.StatutRendezVous.valueOf(statut.toUpperCase());
            return ResponseEntity.ok(rendezVousService.countByStatut(statutEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/stats/date/{date}")
    public ResponseEntity<Long> countByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(rendezVousService.countByDate(date));
    }

    // Endpoints utilitaires
    @GetMapping("/types")
    public ResponseEntity<RendezVous.TypeRendezVous[]> getTypes() {
        return ResponseEntity.ok(RendezVous.TypeRendezVous.values());
    }

    @GetMapping("/statuts")
    public ResponseEntity<RendezVous.StatutRendezVous[]> getStatuts() {
        return ResponseEntity.ok(RendezVous.StatutRendezVous.values());
    }
}