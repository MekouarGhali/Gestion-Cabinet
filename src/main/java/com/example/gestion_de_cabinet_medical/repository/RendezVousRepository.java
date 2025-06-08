package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {

    // ===== MÉTHODES EXISTANTES =====

    // Rechercher par date
    List<RendezVous> findByDateRendezVousOrderByHeureDebutAsc(LocalDate date);

    // Rechercher par plage de dates
    List<RendezVous> findByDateRendezVousBetweenOrderByDateRendezVousAscHeureDebutAsc(
            LocalDate dateDebut, LocalDate dateFin);

    // Rechercher par patient (ordre descendant pour avoir le plus récent en premier)
    List<RendezVous> findByPatientIdOrderByDateRendezVousDescHeureDebutDesc(Long patientId);

    // Rechercher par patient (ordre ascendant pour debug)
    List<RendezVous> findByPatientIdOrderByDateRendezVousAscHeureDebutAsc(Long patientId);

    // Rechercher par statut
    List<RendezVous> findByStatutOrderByDateRendezVousAscHeureDebutAsc(RendezVous.StatutRendezVous statut);

    // Rechercher par type
    List<RendezVous> findByTypeOrderByDateRendezVousAscHeureDebutAsc(RendezVous.TypeRendezVous type);

    // Vérifier les conflits d'horaires
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = :date " +
            "AND ((r.heureDebut <= :heureDebut AND r.heureFin > :heureDebut) " +
            "OR (r.heureDebut < :heureFin AND r.heureFin >= :heureFin) " +
            "OR (r.heureDebut >= :heureDebut AND r.heureFin <= :heureFin)) " +
            "AND r.id != :excludeId")
    List<RendezVous> findConflictingAppointments(
            @Param("date") LocalDate date,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin,
            @Param("excludeId") Long excludeId
    );

    // ✅ CORRECTION CRITIQUE : Rendez-vous d'aujourd'hui ACTIFS (non terminés, non annulés)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.statut NOT IN ('TERMINE', 'ANNULE') " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findTodayAppointments();

    // ✅ NOUVELLE MÉTHODE : Tous les RDV d'aujourd'hui (pour les modals)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findAllTodayAppointments();

    // Rechercher les rendez-vous de la semaine courante
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous >= :startOfWeek " +
            "AND r.dateRendezVous <= :endOfWeek " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC")
    List<RendezVous> findWeekAppointments(
            @Param("startOfWeek") LocalDate startOfWeek,
            @Param("endOfWeek") LocalDate endOfWeek
    );

    // Rechercher par nom/prénom de patient
    @Query("SELECT r FROM RendezVous r JOIN r.patient p " +
            "WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(p.prenom) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY r.dateRendezVous DESC, r.heureDebut DESC")
    List<RendezVous> searchByPatientName(@Param("query") String query);

    // Compter les rendez-vous par statut
    long countByStatut(RendezVous.StatutRendezVous statut);

    // Compter les rendez-vous par date
    long countByDateRendezVous(LocalDate date);

    // Rendez-vous récurrents
    List<RendezVous> findByEstRecurrentTrueOrderByDateRendezVousAsc();

    // ✅ CORRECTION : Prochains rendez-vous (à partir d'aujourd'hui) ACTIFS
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous >= CURRENT_DATE " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC")
    List<RendezVous> findUpcomingAppointments();

    // Rendez-vous en retard (heure passée mais statut non terminé)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous < CURRENT_DATE " +
            "AND r.statut NOT IN ('TERMINE', 'ANNULE') " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC")
    List<RendezVous> findOverdueAppointments();

    // RDV récurrents futurs d'un patient (non terminés, non annulés)
    @Query("SELECT r FROM RendezVous r WHERE r.patient.id = :patientId " +
            "AND r.estRecurrent = true " +
            "AND r.dateRendezVous > :currentDate " +
            "AND r.statut NOT IN ('TERMINE', 'ANNULE') " +
            "ORDER BY r.dateRendezVous ASC")
    List<RendezVous> findFutureRecurringAppointments(@Param("patientId") Long patientId, @Param("currentDate") LocalDate currentDate);

    // Tous les RDV futurs d'un patient (récurrents + ponctuels)
    @Query("SELECT r FROM RendezVous r WHERE r.patient.id = :patientId " +
            "AND r.dateRendezVous > :currentDate " +
            "AND r.statut NOT IN ('TERMINE', 'ANNULE') " +
            "AND r.type = 'SEANCE' " +
            "ORDER BY r.dateRendezVous ASC")
    List<RendezVous> findFutureAppointmentsForPatient(@Param("patientId") Long patientId, @Param("currentDate") LocalDate currentDate);

    // RDV d'un patient par type
    @Query("SELECT r FROM RendezVous r WHERE r.patient.id = :patientId " +
            "AND r.type = :type " +
            "ORDER BY r.dateRendezVous ASC")
    List<RendezVous> findByPatientIdAndType(@Param("patientId") Long patientId, @Param("type") RendezVous.TypeRendezVous type);

    // ===== NOUVELLES MÉTHODES POUR LE DASHBOARD =====

    // Compter les RDV par date et statut
    @Query("SELECT COUNT(r) FROM RendezVous r WHERE r.dateRendezVous = :date AND r.statut = :statut")
    Long countByDateRendezVousAndStatut(@Param("date") LocalDate date, @Param("statut") RendezVous.StatutRendezVous statut);

    // Compter les RDV annulés dans une plage de dates
    @Query("SELECT COUNT(r) FROM RendezVous r WHERE r.dateRendezVous BETWEEN :dateDebut AND :dateFin AND r.statut = :statut")
    Long countByDateRendezVousBetweenAndStatut(@Param("dateDebut") LocalDate dateDebut, @Param("dateFin") LocalDate dateFin, @Param("statut") RendezVous.StatutRendezVous statut);

    // RDV d'aujourd'hui par statut
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE AND r.statut = :statut ORDER BY r.heureDebut ASC")
    List<RendezVous> findTodayAppointmentsByStatut(@Param("statut") RendezVous.StatutRendezVous statut);

    // RDV en cours d'aujourd'hui (pour détection automatique)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.heureDebut <= :currentTime AND r.heureFin > :currentTime " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findCurrentActiveAppointments(@Param("currentTime") LocalTime currentTime);

    // Prochains RDV d'aujourd'hui (pas encore commencés)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.heureDebut > :currentTime " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findUpcomingTodayAppointments(@Param("currentTime") LocalTime currentTime);

    // RDV passés d'aujourd'hui qui ne sont pas marqués comme terminés
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.heureFin <= :currentTime " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findOverdueAppointmentsToday(@Param("currentTime") LocalTime currentTime);

    // RDV confirmés d'aujourd'hui (pour créer des séances)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.statut = 'CONFIRME' " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findTodayConfirmedAppointments();

    // Statistiques mensuelles
    @Query("SELECT COUNT(r) FROM RendezVous r WHERE YEAR(r.dateRendezVous) = :year " +
            "AND MONTH(r.dateRendezVous) = :month")
    Long countByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT COUNT(r) FROM RendezVous r WHERE YEAR(r.dateRendezVous) = :year " +
            "AND MONTH(r.dateRendezVous) = :month AND r.statut = :statut")
    Long countByYearAndMonthAndStatut(@Param("year") int year, @Param("month") int month, @Param("statut") RendezVous.StatutRendezVous statut);

    // RDV du jour par type
    @Query("SELECT r.type, COUNT(r) FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE GROUP BY r.type")
    List<Object[]> countTodayAppointmentsByType();

    // RDV par statut aujourd'hui
    @Query("SELECT r.statut, COUNT(r) FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE GROUP BY r.statut")
    List<Object[]> countTodayAppointmentsByStatut();

    // Patients récents (basé sur les RDV récents)
    @Query("SELECT DISTINCT r.patient FROM RendezVous r WHERE r.dateRendezVous >= :dateLimit " +
            "AND r.statut IN ('TERMINE', 'CONFIRME') " +
            "ORDER BY r.dateRendezVous DESC")
    List<Object> findRecentPatients(@Param("dateLimit") LocalDate dateLimit);

    // Derniers RDV terminés (pour patients récents)
    @Query("SELECT r FROM RendezVous r WHERE r.statut = 'TERMINE' " +
            "ORDER BY r.dateRendezVous DESC, r.heureDebut DESC LIMIT :limit")
    List<RendezVous> findLastCompletedAppointments(@Param("limit") int limit);

    // RDV du jour triés par heure pour le tableau de bord
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.statut NOT IN ('ANNULE') " +
            "ORDER BY " +
            "CASE WHEN r.statut = 'EN_COURS' THEN 1 " +
            "     WHEN r.statut = 'CONFIRME' THEN 2 " +
            "     WHEN r.statut = 'PLANIFIE' THEN 3 " +
            "     ELSE 4 END, " +
            "r.heureDebut ASC")
    List<RendezVous> findTodayAppointmentsForDashboard();

    // Prochains RDV (pour la section "Prochains rendez-vous")
    @Query("SELECT r FROM RendezVous r WHERE " +
            "(r.dateRendezVous = CURRENT_DATE AND r.heureDebut > :currentTime) " +
            "OR (r.dateRendezVous > CURRENT_DATE) " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC LIMIT :limit")
    List<RendezVous> findNextAppointments(@Param("currentTime") LocalTime currentTime, @Param("limit") int limit);

    // RDV en cours (pour affichage prioritaire)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "AND r.statut = 'EN_COURS' " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findCurrentAppointments();

    // Moyennes et statistiques
    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, r.heureDebut, r.heureFin)) FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE")
    Double getAverageAppointmentDurationToday();

    // Taux d'occupation par jour
    @Query("SELECT COUNT(r) * 100.0 / (SELECT COUNT(DISTINCT TIME(r2.heureDebut)) FROM RendezVous r2 WHERE r2.dateRendezVous = :date) " +
            "FROM RendezVous r WHERE r.dateRendezVous = :date AND r.statut NOT IN ('ANNULE')")
    Double getOccupancyRateForDate(@Param("date") LocalDate date);
}