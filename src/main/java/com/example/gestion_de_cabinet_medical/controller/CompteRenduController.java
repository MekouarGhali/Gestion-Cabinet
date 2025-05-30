package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.CompteRendu;
import com.example.gestion_de_cabinet_medical.service.CompteRenduService;
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
@RequestMapping("/api/comptes-rendus")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CompteRenduController {

    private final CompteRenduService compteRenduService;

    // === OPÉRATIONS CRUD BASIQUES ===

    @GetMapping
    public ResponseEntity<List<CompteRendu>> getAll() {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getAll();
            log.info("Récupération de {} comptes rendus", comptesRendus.size());
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompteRendu> getById(@PathVariable Long id) {
        try {
            CompteRendu compteRendu = compteRenduService.getById(id);
            return ResponseEntity.ok(compteRendu);
        } catch (RuntimeException e) {
            log.error("Compte rendu non trouvé avec l'ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du compte rendu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CompteRendu compteRendu) {
        try {
            log.info("Création d'un nouveau compte rendu pour: {}", compteRendu.getNomPatient());
            CompteRendu createdCompteRendu = compteRenduService.create(compteRendu);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCompteRendu);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la création", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CompteRendu compteRendu) {
        try {
            CompteRendu updatedCompteRendu = compteRenduService.update(id, compteRendu);
            return ResponseEntity.ok(updatedCompteRendu);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
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
            compteRenduService.delete(id);
            return ResponseEntity.ok()
                    .body(Map.of("message", "Compte rendu supprimé avec succès"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
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
    public ResponseEntity<List<CompteRendu>> getByPatient(@PathVariable Long patientId) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getByPatient(patientId);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus du patient {}", patientId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<CompteRendu>> getByStatut(@PathVariable String statut) {
        try {
            CompteRendu.StatutCompteRendu statutEnum = CompteRendu.StatutCompteRendu.valueOf(statut.toUpperCase());
            List<CompteRendu> comptesRendus = compteRenduService.getByStatut(statutEnum);
            return ResponseEntity.ok(comptesRendus);
        } catch (IllegalArgumentException e) {
            log.warn("Statut invalide: {}", statut);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par statut", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<CompteRendu>> search(@RequestParam String q) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.searchByKeyword(q);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la recherche", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === MÉTHODES SPÉCIALISÉES ===

    @GetMapping("/recent")
    public ResponseEntity<List<CompteRendu>> getRecentComptesRendus() {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getRecentComptesRendus();
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus récents", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/incomplete")
    public ResponseEntity<List<CompteRendu>> getIncompleteComptesRendus() {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getIncompleteComptesRendus();
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus incomplets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === GESTION DES STATUTS ===

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

            CompteRendu.StatutCompteRendu statut = CompteRendu.StatutCompteRendu.valueOf(statutStr.toUpperCase());
            CompteRendu updatedCompteRendu = compteRenduService.updateStatut(id, statut);
            return ResponseEntity.ok(updatedCompteRendu);
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
    public ResponseEntity<CompteRendu> marquerEnCours(@PathVariable Long id) {
        try {
            CompteRendu compteRendu = compteRenduService.marquerEnCours(id);
            return ResponseEntity.ok(compteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/marquer-termine")
    public ResponseEntity<CompteRendu> marquerTermine(@PathVariable Long id) {
        try {
            CompteRendu compteRendu = compteRenduService.marquerTermine(id);
            return ResponseEntity.ok(compteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    // === DUPLICATION ===

    @PostMapping("/{id}/dupliquer")
    public ResponseEntity<?> dupliquer(@PathVariable Long id) {
        try {
            CompteRendu compteRenduDuplique = compteRenduService.dupliquer(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(compteRenduDuplique);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne lors de la duplication", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === STATISTIQUES ===

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAllStats() {
        try {
            Map<String, Object> stats = compteRenduService.getCompteRenduStatistiques();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === UTILITAIRES ===

    @GetMapping("/generate-numero")
    public ResponseEntity<Map<String, String>> generateNumero() {
        try {
            String numero = compteRenduService.generateNextNumCompteRendu();
            return ResponseEntity.ok(Map.of("numero", numero));
        } catch (Exception e) {
            log.error("Erreur lors de la génération du numéro", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/patient/{patientId}")
    public ResponseEntity<?> createFromPatient(@PathVariable Long patientId) {
        try {
            CompteRendu compteRendu = compteRenduService.createFromPatient(patientId);
            return ResponseEntity.status(HttpStatus.CREATED).body(compteRendu);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création depuis patient: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur interne", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === GESTION DES TESTS ===

    @PostMapping("/{id}/tests")
    public ResponseEntity<?> ajouterTest(@PathVariable Long id, @RequestBody Map<String, String> testData) {
        try {
            String testName = testData.get("testName");
            if (testName == null || testName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Nom du test requis"));
            }

            CompteRendu updatedCompteRendu = compteRenduService.ajouterTest(id, testName);
            return ResponseEntity.ok(updatedCompteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de l'ajout du test", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @DeleteMapping("/{id}/tests/{testName}")
    public ResponseEntity<?> retirerTest(@PathVariable Long id, @PathVariable String testName) {
        try {
            CompteRendu updatedCompteRendu = compteRenduService.retirerTest(id, testName);
            return ResponseEntity.ok(updatedCompteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression du test", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === ASSOCIATION PATIENT ===

    @PatchMapping("/{id}/associer-patient/{patientId}")
    public ResponseEntity<?> associerPatient(@PathVariable Long id, @PathVariable Long patientId) {
        try {
            CompteRendu updatedCompteRendu = compteRenduService.associerPatient(id, patientId);
            return ResponseEntity.ok(updatedCompteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de l'association du patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PatchMapping("/{id}/dissocier-patient")
    public ResponseEntity<?> dissocierPatient(@PathVariable Long id) {
        try {
            CompteRendu updatedCompteRendu = compteRenduService.dissocierPatient(id);
            return ResponseEntity.ok(updatedCompteRendu);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("introuvable")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la dissociation du patient", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // === ENDPOINTS UTILITAIRES ===

    @GetMapping("/statuts")
    public ResponseEntity<CompteRendu.StatutCompteRendu[]> getStatuts() {
        return ResponseEntity.ok(CompteRendu.StatutCompteRendu.values());
    }

    @GetMapping("/tests-disponibles")
    public ResponseEntity<List<String>> getTestsDisponibles() {
        try {
            List<String> tests = compteRenduService.getTestsDisponibles();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des tests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === RECHERCHES AVANCÉES ===

    @GetMapping("/date-range")
    public ResponseEntity<List<CompteRendu>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getByDateRange(dateDebut, dateFin);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par plage de dates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/niveau-scolaire/{niveau}")
    public ResponseEntity<List<CompteRendu>> getByNiveauScolaire(@PathVariable String niveau) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getByNiveauScolaire(niveau);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par niveau scolaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/test/{testName}")
    public ResponseEntity<List<CompteRendu>> getByTestUtilise(@PathVariable String testName) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getByTestUtilise(testName);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par test utilisé", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/age-range")
    public ResponseEntity<List<CompteRendu>> getByPatientAgeRange(
            @RequestParam int ageMin,
            @RequestParam int ageMax) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getByPatientAgeRange(ageMin, ageMax);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération par tranche d'âge", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/en-retard")
    public ResponseEntity<List<CompteRendu>> getComptesRendusEnRetard(@RequestParam(defaultValue = "30") int jours) {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getComptesRendusEnRetard(jours);
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus en retard", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/today")
    public ResponseEntity<List<CompteRendu>> getTodayComptesRendus() {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getTodayComptesRendus();
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus du jour", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/current-week")
    public ResponseEntity<List<CompteRendu>> getCurrentWeekComptesRendus() {
        try {
            List<CompteRendu> comptesRendus = compteRenduService.getCurrentWeekComptesRendus();
            return ResponseEntity.ok(comptesRendus);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des comptes rendus de la semaine", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === GESTION D'ERREURS ===

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(IllegalArgumentException e) {
        log.warn("Erreur de validation: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        if (e.getMessage().contains("introuvable")) {
            return ResponseEntity.notFound().build();
        }
        log.error("Erreur: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}