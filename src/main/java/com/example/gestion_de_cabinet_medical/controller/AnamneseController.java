package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Anamnese;
import com.example.gestion_de_cabinet_medical.service.AnamneseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/anamneses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AnamneseController {

    private final AnamneseService anamneseService;

    // === OPÉRATIONS CRUD ===

    @GetMapping
    public ResponseEntity<List<Anamnese>> getAll() {
        try {
            List<Anamnese> anamneses = anamneseService.getAll();
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Anamnese> getById(@PathVariable Long id) {
        try {
            Anamnese anamnese = anamneseService.getById(id);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            log.error("Anamnèse non trouvée avec l'ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'anamnèse", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/numero/{numAnamnese}")
    public ResponseEntity<Anamnese> getByNumAnamnese(@PathVariable String numAnamnese) {
        try {
            Anamnese anamnese = anamneseService.getByNumAnamnese(numAnamnese);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            log.error("Anamnèse non trouvée avec le numéro: {}", numAnamnese);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'anamnèse", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Anamnese anamnese) {
        try {
            Anamnese createdAnamnese = anamneseService.create(anamnese);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnamnese);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation lors de la création: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de l'anamnèse: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la création de l'anamnèse", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Anamnese anamnese) {
        try {
            Anamnese updatedAnamnese = anamneseService.update(id, anamnese);
            return ResponseEntity.ok(updatedAnamnese);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation lors de la mise à jour: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Erreur lors de la mise à jour: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la mise à jour", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            anamneseService.delete(id);
            return ResponseEntity.ok()
                    .body(Map.of("message", "Anamnèse supprimée avec succès"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Erreur lors de la suppression: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la suppression", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === RECHERCHE ET FILTRAGE ===

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Anamnese>> getByPatient(@PathVariable Long patientId) {
        try {
            List<Anamnese> anamneses = anamneseService.getByPatient(patientId);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses du patient {}", patientId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Anamnese>> getByStatut(@PathVariable String statut) {
        try {
            Anamnese.StatutAnamnese statutEnum = Anamnese.StatutAnamnese.valueOf(statut.toUpperCase());
            List<Anamnese> anamneses = anamneseService.getByStatut(statutEnum);
            return ResponseEntity.ok(anamneses);
        } catch (IllegalArgumentException e) {
            log.warn("Statut invalide: {}", statut);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par statut", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Anamnese>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<Anamnese> anamneses = anamneseService.getByDateEntretien(date);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par date", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Anamnese>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        try {
            List<Anamnese> anamneses = anamneseService.getByDateRange(dateDebut, dateFin);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par plage de dates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Anamnese>> search(@RequestParam String q) {
        try {
            List<Anamnese> anamneses = anamneseService.searchByKeyword(q);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la recherche", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search-patient")
    public ResponseEntity<List<Anamnese>> searchByPatient(@RequestParam String nomPrenom) {
        try {
            List<Anamnese> anamneses = anamneseService.searchByPatientName(nomPrenom);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la recherche par patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/adresse-par/{adressePar}")
    public ResponseEntity<List<Anamnese>> getByAdressePar(@PathVariable String adressePar) {
        try {
            List<Anamnese> anamneses = anamneseService.getByAdressePar(adressePar);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par adressé par", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === MÉTHODES SPÉCIALISÉES ===

    @GetMapping("/today")
    public ResponseEntity<List<Anamnese>> getTodayAnamneses() {
        try {
            List<Anamnese> anamneses = anamneseService.getTodayAnamneses();
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses du jour", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/current-week")
    public ResponseEntity<List<Anamnese>> getCurrentWeekAnamneses() {
        try {
            List<Anamnese> anamneses = anamneseService.getCurrentWeekAnamneses();
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses de la semaine", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Anamnese>> getRecentAnamneses() {
        try {
            List<Anamnese> anamneses = anamneseService.getRecentAnamneses();
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses récentes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/incomplete")
    public ResponseEntity<List<Anamnese>> getIncompleteAnamneses() {
        try {
            List<Anamnese> anamneses = anamneseService.getIncompleteAnamneses();
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des anamnèses incomplètes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/age-range")
    public ResponseEntity<List<Anamnese>> getByPatientAgeRange(
            @RequestParam int ageMin,
            @RequestParam int ageMax) {
        try {
            List<Anamnese> anamneses = anamneseService.getByPatientAgeRange(ageMin, ageMax);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par tranche d'âge", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === GESTION DES STATUTS (MODIFIÉS) ===

    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> statutData) {
        try {
            String statutStr = statutData.get("statut");
            if (statutStr == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Statut requis"));
            }

            Anamnese.StatutAnamnese statut = Anamnese.StatutAnamnese.valueOf(statutStr.toUpperCase());
            Anamnese updatedAnamnese = anamneseService.updateStatut(id, statut);
            return ResponseEntity.ok(updatedAnamnese);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Statut invalide"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du statut", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PatchMapping("/{id}/marquer-en-cours")
    public ResponseEntity<Anamnese> marquerEnCours(@PathVariable Long id) {
        try {
            Anamnese anamnese = anamneseService.marquerEnCours(id);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erreur lors du marquage en cours", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ MODIFICATION : Renommé pour correspondre aux statuts harmonisés
    @PatchMapping("/{id}/marquer-termine")
    public ResponseEntity<Anamnese> marquerTermine(@PathVariable Long id) {
        try {
            Anamnese anamnese = anamneseService.marquerTermine(id);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erreur lors du marquage comme terminé", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ SUPPRIMÉ : marquerEnAttente() pour s'harmoniser avec CompteRendu

    // === STATISTIQUES ===

    @GetMapping("/stats/total")
    public ResponseEntity<Map<String, Long>> getTotalStats() {
        try {
            long total = anamneseService.countTotal();
            return ResponseEntity.ok(Map.of("total", total));
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques totales", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stats/statut/{statut}")
    public ResponseEntity<Map<String, Long>> getStatsByStatut(@PathVariable String statut) {
        try {
            Anamnese.StatutAnamnese statutEnum = Anamnese.StatutAnamnese.valueOf(statut.toUpperCase());
            long count = anamneseService.countByStatut(statutEnum);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques par statut", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stats/month")
    public ResponseEntity<Map<String, Long>> getStatsByMonth(
            @RequestParam int year,
            @RequestParam int month) {
        try {
            long count = anamneseService.countByMonth(year, month);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques mensuelles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAllStats() {
        try {
            Map<String, Object> stats = anamneseService.getAnamneseStatistiques();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques complètes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === UTILITAIRES ===

    @GetMapping("/generate-numero")
    public ResponseEntity<Map<String, String>> generateNumero() {
        try {
            String numero = anamneseService.generateNextNumAnamnese();
            return ResponseEntity.ok(Map.of("numero", numero));
        } catch (Exception e) {
            log.error("Erreur lors de la génération du numéro", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/patient/{patientId}")
    public ResponseEntity<?> createFromPatient(@PathVariable Long patientId) {
        try {
            Anamnese anamnese = anamneseService.createFromPatient(patientId);
            return ResponseEntity.status(HttpStatus.CREATED).body(anamnese);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création depuis patient: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la création depuis patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PostMapping("/{id}/dupliquer")
    public ResponseEntity<?> dupliquer(@PathVariable Long id) {
        try {
            Anamnese copie = anamneseService.dupliquer(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(copie);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Erreur lors de la duplication: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la duplication", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === ASSOCIATION AVEC PATIENT ===

    @PatchMapping("/{id}/associer-patient/{patientId}")
    public ResponseEntity<?> associerPatient(
            @PathVariable Long id,
            @PathVariable Long patientId) {
        try {
            Anamnese anamnese = anamneseService.associerPatient(id, patientId);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Erreur lors de l'association: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de l'association", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PatchMapping("/{id}/dissocier-patient")
    public ResponseEntity<?> dissocierPatient(@PathVariable Long id) {
        try {
            Anamnese anamnese = anamneseService.dissocierPatient(id);
            return ResponseEntity.ok(anamnese);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Erreur lors de la dissociation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la dissociation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === VÉRIFICATIONS ===

    @GetMapping("/patient/{patientId}/exists")
    public ResponseEntity<Map<String, Boolean>> patientHasAnamnese(@PathVariable Long patientId) {
        try {
            boolean hasAnamnese = anamneseService.patientHasAnamnese(patientId);
            return ResponseEntity.ok(Map.of("hasAnamnese", hasAnamnese));
        } catch (Exception e) {
            log.error("Erreur lors de la vérification d'existence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/patient/{patientId}/count")
    public ResponseEntity<Map<String, Long>> countByPatient(@PathVariable Long patientId) {
        try {
            long count = anamneseService.countByPatient(patientId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Erreur lors du comptage par patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === EXPORT/ARCHIVAGE ===

    @GetMapping("/export")
    public ResponseEntity<List<Anamnese>> getAnamnesesToExport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        try {
            List<Anamnese> anamneses = anamneseService.getAnamnesesToExport(dateDebut, dateFin);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de l'export", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/archivables/{nombreJours}")
    public ResponseEntity<List<Anamnese>> getAnamnesesArchivables(@PathVariable int nombreJours) {
        try {
            List<Anamnese> anamneses = anamneseService.getAnamnesesArchivables(nombreJours);
            return ResponseEntity.ok(anamneses);
        } catch (Exception e) {
            log.error("Erreur lors de la recherche d'anamnèses archivables", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === ENDPOINTS UTILITAIRES ===

    @GetMapping("/statuts")
    public ResponseEntity<Anamnese.StatutAnamnese[]> getStatuts() {
        return ResponseEntity.ok(Anamnese.StatutAnamnese.values());
    }

    @GetMapping("/types-allaitement")
    public ResponseEntity<Anamnese.TypeAllaitement[]> getTypesAllaitement() {
        return ResponseEntity.ok(Anamnese.TypeAllaitement.values());
    }

    // === ENDPOINTS DE VALIDATION ===

    @PostMapping("/validate")
    public ResponseEntity<?> validateAnamnese(@RequestBody Anamnese anamnese) {
        try {
            // La validation est déjà effectuée dans le service lors de la création
            // Ici on peut juste faire une validation préliminaire
            if (anamnese.getDateEntretien() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La date d'entretien est obligatoire"));
            }
            if (anamnese.getNomPrenom() == null || anamnese.getNomPrenom().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le nom et prénom sont obligatoires"));
            }
            if (anamnese.getDateNaissance() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La date de naissance est obligatoire"));
            }

            return ResponseEntity.ok(Map.of("valid", true));
        } catch (Exception e) {
            log.error("Erreur lors de la validation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === ENDPOINTS POUR L'INTERFACE ===

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        try {
            Map<String, Object> dashboardData = Map.of(
                    "statistiques", anamneseService.getAnamneseStatistiques(),
                    "recentes", anamneseService.getRecentAnamneses(),
                    "incompletes", anamneseService.getIncompleteAnamneses(),
                    "aujourdhui", anamneseService.getTodayAnamneses(),
                    "semaineActuelle", anamneseService.getCurrentWeekAnamneses()
            );
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des données du dashboard", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === GESTION D'ERREURS SPÉCIALISÉE ===

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(IllegalArgumentException e) {
        log.warn("Erreur de validation: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        if (e.getMessage().contains("introuvable")) {
            log.warn("Ressource non trouvée: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
        log.error("Erreur d'exécution: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception e) {
        log.error("Erreur interne non gérée", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur interne du serveur"));
    }
}