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

    // Rechercher les rendez-vous d'aujourd'hui
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous = CURRENT_DATE " +
            "ORDER BY r.heureDebut ASC")
    List<RendezVous> findTodayAppointments();

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

    // Prochains rendez-vous (à partir d'aujourd'hui)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous >= CURRENT_DATE " +
            "AND r.statut NOT IN ('ANNULE', 'TERMINE') " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC")
    List<RendezVous> findUpcomingAppointments();

    // Rendez-vous en retard (heure passée mais statut non terminé)
    @Query("SELECT r FROM RendezVous r WHERE r.dateRendezVous < CURRENT_DATE " +
            "AND r.statut NOT IN ('TERMINE', 'ANNULE') " +
            "ORDER BY r.dateRendezVous ASC, r.heureDebut ASC")
    List<RendezVous> findOverdueAppointments();

    // ===== NOUVELLES MÉTHODES POUR LA LOGIQUE INTELLIGENTE =====

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
}