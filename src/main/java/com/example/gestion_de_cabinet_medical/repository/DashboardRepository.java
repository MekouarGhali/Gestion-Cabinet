package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Dashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, Long> {

    // Récupérer le dashboard d'aujourd'hui
    @Query("SELECT d FROM Dashboard d WHERE d.date = CURRENT_DATE")
    Optional<Dashboard> findTodayDashboard();

    // Récupérer le dashboard d'une date spécifique
    Optional<Dashboard> findByDate(LocalDate date);

    // Récupérer les dashboards d'une plage de dates
    List<Dashboard> findByDateBetweenOrderByDateDesc(LocalDate dateDebut, LocalDate dateFin);

    // Récupérer les dashboards du mois courant
    @Query("SELECT d FROM Dashboard d WHERE YEAR(d.date) = YEAR(CURRENT_DATE) AND MONTH(d.date) = MONTH(CURRENT_DATE) ORDER BY d.date DESC")
    List<Dashboard> findCurrentMonthDashboards();

    // Récupérer le dashboard le plus récent
    Optional<Dashboard> findTopByOrderByDateDesc();

    // Récupérer les 7 derniers dashboards
    List<Dashboard> findTop7ByOrderByDateDesc();

    // Récupérer les 30 derniers dashboards
    List<Dashboard> findTop30ByOrderByDateDesc();

    // Vérifier si un dashboard existe pour une date
    boolean existsByDate(LocalDate date);

    // Supprimer les anciens dashboards (plus de X jours)
    @Query("DELETE FROM Dashboard d WHERE d.date < :cutoffDate")
    void deleteOldDashboards(@Param("cutoffDate") LocalDate cutoffDate);

    // Statistiques d'évolution : comparer avec le jour précédent
    @Query("SELECT d FROM Dashboard d WHERE d.date = :date OR d.date = :previousDate ORDER BY d.date")
    List<Dashboard> findForComparison(@Param("date") LocalDate date, @Param("previousDate") LocalDate previousDate);

    // Récupérer les totaux du mois pour une année donnée
    @Query("SELECT MONTH(d.date) as mois, " +
            "SUM(d.rendezVousAujourdhuiTotal) as totalRdv, " +
            "SUM(d.rendezVousAnnulesMois) as totalAnnules, " +
            "SUM(d.revenusMensuelsDH) as totalRevenus " +
            "FROM Dashboard d " +
            "WHERE YEAR(d.date) = :year " +
            "GROUP BY MONTH(d.date) " +
            "ORDER BY MONTH(d.date)")
    List<Object[]> getMonthlyStatsForYear(@Param("year") int year);

    // Calculer la moyenne des revenus journaliers du mois
    @Query("SELECT AVG(d.revenusAujourdhuiDH) FROM Dashboard d WHERE YEAR(d.date) = YEAR(CURRENT_DATE) AND MONTH(d.date) = MONTH(CURRENT_DATE)")
    Double getAverageDailyRevenueThisMonth();

    // Récupérer le pic d'activité (jour avec le plus de RDV)
    @Query("SELECT d FROM Dashboard d WHERE d.rendezVousAujourdhuiTotal = (SELECT MAX(d2.rendezVousAujourdhuiTotal) FROM Dashboard d2 WHERE YEAR(d2.date) = YEAR(CURRENT_DATE) AND MONTH(d2.date) = MONTH(CURRENT_DATE))")
    List<Dashboard> findPeakActivityDays();

    // Compter les jours travaillés dans le mois (avec au moins 1 RDV)
    @Query("SELECT COUNT(d) FROM Dashboard d WHERE YEAR(d.date) = YEAR(CURRENT_DATE) AND MONTH(d.date) = MONTH(CURRENT_DATE) AND d.rendezVousAujourdhuiTotal > 0")
    Long countWorkingDaysThisMonth();

    // Évolution semaine par semaine
    @Query("SELECT WEEK(d.date) as semaine, " +
            "SUM(d.rendezVousAujourdhuiTotal) as totalRdv, " +
            "SUM(d.revenusAujourdhuiDH) as totalRevenus " +
            "FROM Dashboard d " +
            "WHERE YEAR(d.date) = :year " +
            "GROUP BY WEEK(d.date) " +
            "ORDER BY WEEK(d.date)")
    List<Object[]> getWeeklyStatsForYear(@Param("year") int year);

    // Récupérer les dashboards les plus récents pour comparaison
    @Query("SELECT d FROM Dashboard d ORDER BY d.date DESC LIMIT :limit")
    List<Dashboard> findRecentDashboards(@Param("limit") int limit);
}