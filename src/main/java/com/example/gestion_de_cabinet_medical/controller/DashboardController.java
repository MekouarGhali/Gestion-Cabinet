package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Dashboard;
import com.example.gestion_de_cabinet_medical.service.DashboardService;
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
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // ===== RÉCUPÉRATION DES STATISTIQUES =====

    @GetMapping("/today")
    public ResponseEntity<Dashboard> getTodayDashboard() {
        return ResponseEntity.ok(dashboardService.getTodayDashboard());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<Dashboard> getDashboardByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dashboardService.getDashboardByDate(date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<Dashboard>> getWeeklyDashboards() {
        return ResponseEntity.ok(dashboardService.getWeeklyDashboards());
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<Dashboard>> getMonthlyDashboards() {
        return ResponseEntity.ok(dashboardService.getMonthlyDashboards());
    }

    @GetMapping("/latest")
    public ResponseEntity<Dashboard> getLatestDashboard() {
        return ResponseEntity.ok(dashboardService.getLatestDashboard());
    }

    // ===== MISE À JOUR EN TEMPS RÉEL =====

    @PostMapping("/update")
    public ResponseEntity<Dashboard> updateTodayStats() {
        Dashboard updated = dashboardService.updateTodayStats();
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/update/current-appointments")
    public ResponseEntity<Map<String, Object>> updateCurrentAppointments() {
        try {
            dashboardService.updateCurrentAppointments();
            return ResponseEntity.ok(Map.of(
                    "message", "Statuts des rendez-vous mis à jour automatiquement",
                    "timestamp", java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== STATISTIQUES D'ÉVOLUTION =====

    @GetMapping("/evolution")
    public ResponseEntity<Map<String, Object>> getEvolutionStats() {
        return ResponseEntity.ok(dashboardService.getEvolutionStats());
    }

    @GetMapping("/comparison/{date}")
    public ResponseEntity<List<Dashboard>> getComparison(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dashboardService.getComparison(date));
    }

    // ===== ÉVÉNEMENTS DE MISE À JOUR =====

    @PostMapping("/events/new-patient")
    public ResponseEntity<Map<String, String>> onNewPatientAdded() {
        try {
            dashboardService.onNewPatientAdded();
            return ResponseEntity.ok(Map.of("message", "Dashboard mis à jour suite à l'ajout d'un nouveau patient"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/events/patient-status-changed")
    public ResponseEntity<Map<String, String>> onPatientStatusChanged(@RequestBody Map<String, String> request) {
        try {
            String oldStatut = request.get("oldStatut");
            String newStatut = request.get("newStatut");
            dashboardService.onPatientStatusChanged(oldStatut, newStatut);
            return ResponseEntity.ok(Map.of("message", "Dashboard mis à jour suite au changement de statut patient"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== CARTES STATISTIQUES (POUR LE FRONTEND) =====

    @GetMapping("/cards/rendez-vous")
    public ResponseEntity<Map<String, Object>> getRendezVousCard() {
        Dashboard today = dashboardService.getTodayDashboard();
        Map<String, Object> card = Map.of(
                "title", "Rendez-Vous",
                "icon", "ri-calendar-2-line",
                "color", "blue",
                "value", today.getRendezVousAujourdhuiTotal(),  // ✅ SEULEMENT LE TOTAL
                "label", "Aujourd'hui"
                // ❌ SUPPRESSION : plus de "details"
        );
        return ResponseEntity.ok(card);
    }

    @GetMapping("/cards/patients")
    public ResponseEntity<Map<String, Object>> getPatientsCard() {
        Dashboard today = dashboardService.getTodayDashboard();
        Map<String, Object> card = Map.of(
                "title", "Patients",
                "icon", "ri-user-line",
                "color", "green",
                "value", today.getPatientsActifs(), // ✅ SEULEMENT patients actifs
                "label", "Actifs"
        );
        return ResponseEntity.ok(card);
    }

    @GetMapping("/cards/rdv-annules")
    public ResponseEntity<Map<String, Object>> getRdvAnnulesCard() {
        Dashboard today = dashboardService.getTodayDashboard();
        Map<String, Object> card = Map.of(
                "title", "Rendez-Vous Annulés",
                "icon", "ri-calendar-close-line",
                "color", "red",
                "value", today.getRendezVousAnnulesMois(),
                "label", "Ce mois",
                "details", Map.of(
                        "tauxAnnulation", today.getTauxAnnulationMois()
                )
        );
        return ResponseEntity.ok(card);
    }

    @GetMapping("/cards/revenus")
    public ResponseEntity<Map<String, Object>> getRevenusCard() {
        Dashboard today = dashboardService.getTodayDashboard();
        Map<String, Object> card = Map.of(
                "title", "Revenus",
                "icon", "ri-money-dollar-circle-line",
                "color", "yellow",
                "value", today.getRevenusMensuelsDH(), // ✅ SEULEMENT revenus du mois
                "label", "Ce mois",
                "formatted", today.getFormattedRevenusMensuels()
        );
        return ResponseEntity.ok(card);
    }

    @GetMapping("/cards/all")
    public ResponseEntity<Map<String, Object>> getAllCards() {
        Dashboard today = dashboardService.getTodayDashboard();

        Map<String, Object> allCards = Map.of(
                "rendezVous", Map.of(
                        "title", "Rendez-Vous",
                        "icon", "ri-calendar-2-line",
                        "color", "blue",
                        "value", today.getRendezVousAujourdhuiTotal(),  // ✅ SEULEMENT LE TOTAL
                        "label", "Aujourd'hui"
                        // ❌ SUPPRESSION : plus de "details"
                ),
                "patients", Map.of(
                        "title", "Patients",
                        "icon", "ri-user-line",
                        "color", "green",
                        "value", today.getPatientsActifs(),
                        "label", "Actifs"
                ),
                "rdvAnnules", Map.of(
                        "title", "Rendez-Vous Annulés",
                        "icon", "ri-calendar-close-line",
                        "color", "red",
                        "value", today.getRendezVousAnnulesMois(),
                        "label", "Ce mois"
                ),
                "revenus", Map.of(
                        "title", "Revenus",
                        "icon", "ri-money-dollar-circle-line",
                        "color", "yellow",
                        "value", today.getRevenusMensuelsDH(),
                        "label", "Ce mois",
                        "formatted", today.getFormattedRevenusMensuels()
                )
        );

        return ResponseEntity.ok(allCards);
    }

    // ===== NETTOYAGE =====

    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanOldDashboards() {
        try {
            dashboardService.cleanOldDashboards();
            return ResponseEntity.ok(Map.of("message", "Anciens dashboards supprimés avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== CRÉATION MANUELLE =====

    @PostMapping("/create/{date}")
    public ResponseEntity<Dashboard> createDashboardForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Dashboard dashboard = dashboardService.createDashboardForDate(date);
        return ResponseEntity.ok(dashboard);
    }

    // ===== VÉRIFICATIONS =====

    @GetMapping("/exists/{date}")
    public ResponseEntity<Map<String, Boolean>> hasDashboardForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean exists = dashboardService.hasDashboardForDate(date);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // ===== ENDPOINT SPÉCIAL POUR LE TABLEAU DE BORD =====

    /**
     * Endpoint principal pour le tableau de bord - retourne toutes les données nécessaires
     */
    @GetMapping("/complete")
    public ResponseEntity<Map<String, Object>> getCompleteDashboard() {
        try {
            Dashboard today = dashboardService.getTodayDashboard();
            Map<String, Object> evolutionStats = dashboardService.getEvolutionStats();

            Map<String, Object> completeDashboard = Map.of(
                    "dashboard", today,
                    "summary", dashboardService.getDashboardSummary(),
                    "evolution", evolutionStats,
                    "cards", Map.of(
                            "rendezVous", Map.of(
                                    "value", today.getRendezVousAujourdhuiTotal(),  // ✅ SEULEMENT LE TOTAL
                                    "label", "Aujourd'hui"
                                    // ❌ SUPPRESSION : plus de "details"
                            ),
                            "patients", Map.of(
                                    "value", today.getPatientsActifs(),
                                    "label", "Actifs"
                            ),
                            "rdvAnnules", Map.of(
                                    "value", today.getRendezVousAnnulesMois(),
                                    "label", "Ce mois"
                            ),
                            "revenus", Map.of(
                                    "value", today.getRevenusMensuelsDH(),
                                    "label", "Ce mois",
                                    "formatted", today.getFormattedRevenusMensuels()
                            )
                    ),
                    "lastUpdated", today.getLastUpdated()
            );

            return ResponseEntity.ok(completeDashboard);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du dashboard complet", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}