package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Seance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SeanceRepository extends JpaRepository<Seance, Long> {

    // Récupérer toutes les séances d'un patient triées par date décroissante
    List<Seance> findByPatientIdOrderByDateSeanceDescHeureDebutDesc(Long patientId);

    // Récupérer les séances d'un patient par type
    List<Seance> findByPatientIdAndTypeOrderByDateSeanceDescHeureDebutDesc(Long patientId, Seance.TypeSeance type);

    // Récupérer les séances d'une date spécifique
    List<Seance> findByDateSeanceOrderByHeureDebutAsc(LocalDate dateSeance);

    // Récupérer les séances d'aujourd'hui
    @Query("SELECT s FROM Seance s WHERE s.dateSeance = CURRENT_DATE ORDER BY s.heureDebut ASC")
    List<Seance> findTodaySessions();

    // Récupérer les séances par plage de dates
    List<Seance> findByDateSeanceBetweenOrderByDateSeanceAscHeureDebutAsc(LocalDate dateDebut, LocalDate dateFin);

    // Récupérer les séances par type
    List<Seance> findByTypeOrderByDateSeanceDescHeureDebutDesc(Seance.TypeSeance type);

    // Compter les séances effectuées d'un patient (seules les SEANCE comptent)
    @Query("SELECT COUNT(s) FROM Seance s WHERE s.patient.id = :patientId AND s.type = 'SEANCE'")
    Long countSeancesEffectueesForPatient(@Param("patientId") Long patientId);

    // Compter toutes les séances d'un patient (tous types confondus)
    Long countByPatientId(Long patientId);

    // Récupérer les dernières séances ajoutées
    List<Seance> findTop10ByOrderByCreatedAtDesc();

    // Récupérer les dernières séances d'un patient (limitées)
    @Query("SELECT s FROM Seance s WHERE s.patient.id = :patientId ORDER BY s.dateSeance DESC, s.heureDebut DESC LIMIT :limit")
    List<Seance> findLastSessionsForPatient(@Param("patientId") Long patientId, @Param("limit") int limit);

    // Compter les séances par type pour un patient
    @Query("SELECT s.type, COUNT(s) FROM Seance s WHERE s.patient.id = :patientId GROUP BY s.type")
    List<Object[]> countSessionsByTypeForPatient(@Param("patientId") Long patientId);

    // Récupérer les séances liées à un rendez-vous spécifique
    List<Seance> findByRendezVousId(Long rendezVousId);

    // Vérifier si une séance existe déjà pour un rendez-vous
    boolean existsByRendezVousId(Long rendezVousId);

    // Compter les séances du jour
    @Query("SELECT COUNT(s) FROM Seance s WHERE s.dateSeance = CURRENT_DATE")
    Long countTodaySessions();

    // Compter les séances du mois
    @Query("SELECT COUNT(s) FROM Seance s WHERE YEAR(s.dateSeance) = YEAR(CURRENT_DATE) AND MONTH(s.dateSeance) = MONTH(CURRENT_DATE)")
    Long countCurrentMonthSessions();

    // Compter les séances par type aujourd'hui
    @Query("SELECT s.type, COUNT(s) FROM Seance s WHERE s.dateSeance = CURRENT_DATE GROUP BY s.type")
    List<Object[]> countTodaySessionsByType();

    // ✅ CORRECTION : Récupérer les séances récentes (7 derniers jours) - version alternative plus compatible
    @Query("SELECT s FROM Seance s WHERE s.dateSeance >= :sevenDaysAgo ORDER BY s.dateSeance DESC, s.heureDebut DESC")
    List<Seance> findRecentSessions(@Param("sevenDaysAgo") LocalDate sevenDaysAgo);

    // Recherche textuelle dans les observations
    @Query("SELECT s FROM Seance s WHERE LOWER(s.observations) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY s.dateSeance DESC")
    List<Seance> searchByObservations(@Param("query") String query);

    // Récupérer les séances d'un patient pour une période donnée
    @Query("SELECT s FROM Seance s WHERE s.patient.id = :patientId AND s.dateSeance BETWEEN :dateDebut AND :dateFin ORDER BY s.dateSeance ASC")
    List<Seance> findPatientSessionsInPeriod(@Param("patientId") Long patientId, @Param("dateDebut") LocalDate dateDebut, @Param("dateFin") LocalDate dateFin);

    // Statistiques : durée moyenne des séances par patient
    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, s.heureDebut, s.heureFin)) FROM Seance s WHERE s.patient.id = :patientId AND s.type = 'SEANCE'")
    Double getAverageSessionDurationForPatient(@Param("patientId") Long patientId);

    // Récupérer les patients avec le plus de séances (top 10)
    @Query("SELECT s.patient.id, s.patient.nom, s.patient.prenom, COUNT(s) as sessionCount FROM Seance s WHERE s.type = 'SEANCE' GROUP BY s.patient.id, s.patient.nom, s.patient.prenom ORDER BY sessionCount DESC LIMIT 10")
    List<Object[]> findTopPatientsWithMostSessions();
}