package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Dashboard;
import com.example.gestion_de_cabinet_medical.entity.RendezVous;
import com.example.gestion_de_cabinet_medical.repository.DashboardRepository;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import com.example.gestion_de_cabinet_medical.repository.RendezVousRepository;
import com.example.gestion_de_cabinet_medical.repository.RevenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DashboardService {

    private final DashboardRepository dashboardRepository;
    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final RevenuRepository revenuRepository;

    // ===== RÉCUPÉRATION DES STATISTIQUES =====

    /**
     * Récupère ou crée le dashboard d'aujourd'hui avec mise à jour en temps réel
     */
    public Dashboard getTodayDashboard() {
        LocalDate today = LocalDate.now();

        Optional<Dashboard> existing = dashboardRepository.findTodayDashboard();
        if (existing.isPresent()) {
            // Mettre à jour les statistiques en temps réel
            return updateDashboardStats(existing.get());
        } else {
            // Créer un nouveau dashboard pour aujourd'hui
            return createTodayDashboard();
        }
    }

    /**
     * Récupère le dashboard d'une date spécifique
     */
    public Dashboard getDashboardByDate(LocalDate date) {
        Optional<Dashboard> dashboard = dashboardRepository.findByDate(date);
        if (dashboard.isPresent()) {
            return dashboard.get();
        } else {
            // Créer le dashboard pour cette date
            return createDashboardForDate(date);
        }
    }

    /**
     * Récupère les statistiques des 7 derniers jours
     */
    public List<Dashboard> getWeeklyDashboards() {
        return dashboardRepository.findTop7ByOrderByDateDesc();
    }

    /**
     * Récupère les statistiques du mois courant
     */
    public List<Dashboard> getMonthlyDashboards() {
        return dashboardRepository.findCurrentMonthDashboards();
    }

    // ===== MISE À JOUR EN TEMPS RÉEL =====

    /**
     * Met à jour toutes les statistiques du dashboard d'aujourd'hui
     */
    @Transactional
    public Dashboard updateTodayStats() {
        Dashboard today = getTodayDashboard();
        return updateDashboardStats(today);
    }

    /**
     * Met à jour les statistiques d'un dashboard spécifique
     */
    @Transactional
    public Dashboard updateDashboardStats(Dashboard dashboard) {
        LocalDate date = dashboard.getDate();
        log.debug("🔄 Mise à jour des statistiques pour le {}", date);

        // ===== STATISTIQUES RDV DU JOUR =====
        updateRendezVousStats(dashboard, date);

        // ===== STATISTIQUES PATIENTS =====
        updatePatientsStats(dashboard);

        // ===== STATISTIQUES MENSUELLES =====
        updateMonthlyStats(dashboard, date);

        // ===== STATISTIQUES REVENUS =====
        updateRevenusStats(dashboard, date);

        dashboard.setLastUpdated(java.time.LocalDateTime.now());
        Dashboard saved = dashboardRepository.save(dashboard);

        log.debug("✅ Statistiques mises à jour pour le {}", date);
        return saved;
    }

    // ===== CRÉATION DE DASHBOARDS =====

    /**
     * Crée un nouveau dashboard pour aujourd'hui
     */
    @Transactional
    public Dashboard createTodayDashboard() {
        LocalDate today = LocalDate.now();
        return createDashboardForDate(today);
    }

    /**
     * Crée un dashboard pour une date spécifique
     */
    @Transactional
    public Dashboard createDashboardForDate(LocalDate date) {
        log.info("📊 Création d'un nouveau dashboard pour le {}", date);

        Dashboard dashboard = Dashboard.createForDate(date);
        dashboard = updateDashboardStats(dashboard);

        log.info("✅ Dashboard créé pour le {} avec {} RDV", date, dashboard.getRendezVousAujourdhuiTotal());
        return dashboard;
    }

    // ===== MÉTHODES DE MISE À JOUR SPÉCIALISÉES =====

    private void updateRendezVousStats(Dashboard dashboard, LocalDate date) {
        // RDV total du jour
        Long totalRdv = rendezVousRepository.countByDateRendezVous(date);
        dashboard.setRendezVousAujourdhuiTotal(totalRdv);

        // RDV en cours (statut EN_COURS)
        Long rdvEnCours = rendezVousRepository.countByDateRendezVousAndStatut(date, RendezVous.StatutRendezVous.EN_COURS);
        dashboard.setRendezVousEnCours(rdvEnCours);

        // RDV terminés (statut TERMINE)
        Long rdvTermines = rendezVousRepository.countByDateRendezVousAndStatut(date, RendezVous.StatutRendezVous.TERMINE);
        dashboard.setRendezVousTermines(rdvTermines);

        // RDV restants (planifiés, confirmés)
        Long rdvRestants = totalRdv - rdvEnCours - rdvTermines;
        dashboard.setRendezVousAujourdhui(Math.max(0L, rdvRestants));

        log.debug("📅 RDV {}: Total={}, EnCours={}, Terminés={}, Restants={}",
                date, totalRdv, rdvEnCours, rdvTermines, rdvRestants);
    }

    private void updatePatientsStats(Dashboard dashboard) {
        // Patients actifs
        Long patientsActifs = patientRepository.countByStatut("actif");
        dashboard.setPatientsActifs(patientsActifs);

        // Patients nouveaux
        Long patientsNouveaux = patientRepository.countByStatut("nouveau");
        dashboard.setPatientsNouveaux(patientsNouveaux);

        // Patients total
        Long patientsTotaux = patientRepository.count();
        dashboard.setPatientsTotaux(patientsTotaux);

        log.debug("👥 Patients: Actifs={}, Nouveaux={}, Total={}",
                patientsActifs, patientsNouveaux, patientsTotaux);
    }

    private void updateMonthlyStats(Dashboard dashboard, LocalDate date) {
        YearMonth currentMonth = YearMonth.from(date);
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        // RDV annulés du mois
        Long rdvAnnulesMois = rendezVousRepository.countByDateRendezVousBetweenAndStatut(
                startOfMonth, endOfMonth, RendezVous.StatutRendezVous.ANNULE);
        dashboard.setRendezVousAnnulesMois(rdvAnnulesMois);

        log.debug("📊 Mois {}: RDV annulés={}", currentMonth, rdvAnnulesMois);
    }

    private void updateRevenusStats(Dashboard dashboard, LocalDate date) {
        YearMonth currentMonth = YearMonth.from(date);

        // Revenus du jour
        Double revenusJour = revenuRepository.getTotalRevenueByDate(date);
        dashboard.setRevenusAujourdhuiDH(revenusJour != null ? revenusJour : 0.0);

        // Revenus du mois
        Double revenusMois = revenuRepository.getTotalRevenue(currentMonth.getYear(), currentMonth.getMonthValue());
        dashboard.setRevenusMensuelsDH(revenusMois != null ? revenusMois : 0.0);

        log.debug("💰 Revenus: Jour={} DH, Mois={} DH",
                dashboard.getRevenusAujourdhuiDH(), dashboard.getRevenusMensuelsDH());
    }

    // ===== ÉVÉNEMENTS DE MISE À JOUR =====

    /**
     * Appelé quand un RDV est confirmé/terminé
     */
    @Transactional
    public void onRendezVousStatusChanged(RendezVous rendezVous, RendezVous.StatutRendezVous oldStatut) {
        LocalDate dateRdv = rendezVous.getDateRendezVous();

        // Mettre à jour le dashboard de la date du RDV
        Optional<Dashboard> dashboardOpt = dashboardRepository.findByDate(dateRdv);
        if (dashboardOpt.isPresent()) {
            updateDashboardStats(dashboardOpt.get());
            log.debug("🔄 Dashboard mis à jour suite au changement de statut RDV: {} → {}",
                    oldStatut, rendezVous.getStatut());
        }
    }

    /**
     * Appelé quand un nouveau patient est ajouté
     */
    @Transactional
    public void onNewPatientAdded() {
        Dashboard today = getTodayDashboard();
        updatePatientsStats(today);
        dashboardRepository.save(today);
        log.debug("👥 Dashboard mis à jour suite à l'ajout d'un nouveau patient");
    }

    /**
     * Appelé quand le statut d'un patient change
     */
    @Transactional
    public void onPatientStatusChanged(String oldStatut, String newStatut) {
        Dashboard today = getTodayDashboard();
        updatePatientsStats(today);
        dashboardRepository.save(today);
        log.debug("👤 Dashboard mis à jour suite au changement de statut patient: {} → {}", oldStatut, newStatut);
    }

    // ===== DÉTECTION AUTOMATIQUE DES RDV EN COURS =====

    /**
     * Met à jour automatiquement les RDV "En cours" basé sur l'heure actuelle
     */
    @Transactional
    public void updateCurrentAppointments() {
        LocalTime now = LocalTime.now();
        LocalDate today = LocalDate.now();

        // Récupérer tous les RDV d'aujourd'hui
        List<RendezVous> rdvAujourdHui = rendezVousRepository.findByDateRendezVousOrderByHeureDebutAsc(today);

        boolean hasChanges = false;

        for (RendezVous rdv : rdvAujourdHui) {
            RendezVous.StatutRendezVous newStatut = determineStatutBasedOnTime(rdv, now);

            if (newStatut != rdv.getStatut()) {
                RendezVous.StatutRendezVous oldStatut = rdv.getStatut();
                rdv.setStatut(newStatut);
                rendezVousRepository.save(rdv);
                hasChanges = true;

                log.debug("⏰ RDV {} automatiquement mis à jour: {} → {} ({})",
                        rdv.getNomCompletPatient(), oldStatut, newStatut, now);
            }
        }

        // Mettre à jour le dashboard si des changements ont eu lieu
        if (hasChanges) {
            updateTodayStats();
            log.debug("📊 Dashboard mis à jour suite aux changements automatiques de statut");
        }
    }

    private RendezVous.StatutRendezVous determineStatutBasedOnTime(RendezVous rdv, LocalTime now) {
        // Si le RDV est déjà terminé ou annulé, ne pas changer
        if (rdv.getStatut() == RendezVous.StatutRendezVous.TERMINE ||
                rdv.getStatut() == RendezVous.StatutRendezVous.ANNULE) {
            return rdv.getStatut();
        }

        // Si l'heure actuelle est dans la plage du RDV
        if (!now.isBefore(rdv.getHeureDebut()) && now.isBefore(rdv.getHeureFin())) {
            return RendezVous.StatutRendezVous.EN_COURS;
        }

        // Si le RDV est passé mais pas marqué comme terminé
        if (now.isAfter(rdv.getHeureFin()) && rdv.getStatut() == RendezVous.StatutRendezVous.EN_COURS) {
            // Garder EN_COURS jusqu'à confirmation manuelle
            return RendezVous.StatutRendezVous.EN_COURS;
        }

        // Sinon, garder le statut actuel ou PLANIFIE par défaut
        return rdv.getStatut() != null ? rdv.getStatut() : RendezVous.StatutRendezVous.PLANIFIE;
    }

    // ===== STATISTIQUES AVANCÉES =====

    public Map<String, Object> getDashboardSummary() {
        Dashboard today = getTodayDashboard();
        Map<String, Object> summary = new HashMap<>();

        // Statistiques d'aujourd'hui
        summary.put("rdvAujourdHui", today.getRendezVousAujourdhuiTotal());
        summary.put("rdvEnCours", today.getRendezVousEnCours());
        summary.put("rdvTermines", today.getRendezVousTermines());
        summary.put("rdvRestants", today.getRendezVousAujourdhui());

        // Statistiques patients
        summary.put("patientsActifs", today.getPatientsActifs());
        summary.put("patientsNouveaux", today.getPatientsNouveaux());
        summary.put("patientsTotaux", today.getPatientsTotaux());

        // Statistiques mensuelles
        summary.put("rdvAnnulesMois", today.getRendezVousAnnulesMois());
        summary.put("revenusAujourdHui", today.getRevenusAujourdhuiDH());
        summary.put("revenusMensuels", today.getRevenusMensuelsDH());

        // Pourcentages
        summary.put("tauxCompletionAujourdHui", today.getTauxCompletionAujourdHui());
        summary.put("tauxAnnulationMois", today.getTauxAnnulationMois());

        // Dernière mise à jour
        summary.put("lastUpdated", today.getLastUpdated());

        return summary;
    }

    public List<Dashboard> getComparison(LocalDate date) {
        LocalDate previousDate = date.minusDays(1);
        return dashboardRepository.findForComparison(date, previousDate);
    }

    public Map<String, Object> getEvolutionStats() {
        List<Dashboard> recent = dashboardRepository.findTop7ByOrderByDateDesc();
        Map<String, Object> evolution = new HashMap<>();

        if (recent.size() >= 2) {
            Dashboard today = recent.get(0);
            Dashboard yesterday = recent.get(1);

            // Évolution RDV
            long diffRdv = today.getRendezVousAujourdhuiTotal() - yesterday.getRendezVousAujourdhuiTotal();
            evolution.put("evolutionRdv", diffRdv);

            // Évolution revenus
            double diffRevenus = today.getRevenusAujourdhuiDH() - yesterday.getRevenusAujourdhuiDH();
            evolution.put("evolutionRevenus", diffRevenus);

            // Évolution patients actifs
            long diffPatients = today.getPatientsActifs() - yesterday.getPatientsActifs();
            evolution.put("evolutionPatients", diffPatients);
        }

        return evolution;
    }

    // ===== NETTOYAGE =====

    /**
     * Supprime les anciens dashboards (plus de 90 jours)
     */
    @Transactional
    public void cleanOldDashboards() {
        LocalDate cutoffDate = LocalDate.now().minusDays(90);
        dashboardRepository.deleteOldDashboards(cutoffDate);
        log.info("🧹 Anciens dashboards supprimés (avant {})", cutoffDate);
    }

    // ===== UTILITAIRES =====

    public boolean hasDashboardForDate(LocalDate date) {
        return dashboardRepository.existsByDate(date);
    }

    public Dashboard getLatestDashboard() {
        return dashboardRepository.findTopByOrderByDateDesc()
                .orElseGet(this::createTodayDashboard);
    }
}