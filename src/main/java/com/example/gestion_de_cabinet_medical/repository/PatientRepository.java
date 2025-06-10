package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    // Méthodes existantes
    List<Patient> findByStatut(String statut);
    // ===== NOUVELLES MÉTHODES POUR LE DASHBOARD =====

    // Compter les patients par statut
    Long countByStatut(String statut);

    // Récupérer les patients actifs
    List<Patient> findByStatutOrderByDerniereVisiteDesc(String statut);

    // Récupérer les patients récemment vus (dans les X derniers jours)
    @Query("SELECT p FROM Patient p WHERE p.derniereVisite >= :dateLimit ORDER BY p.derniereVisite DESC")
    List<Patient> findRecentPatients(@Param("dateLimit") LocalDate dateLimit);

    // Récupérer les patients récemment vus (limité)
    @Query("SELECT p FROM Patient p WHERE p.derniereVisite >= :dateLimit ORDER BY p.derniereVisite DESC LIMIT :limit")
    List<Patient> findRecentPatientsLimited(@Param("dateLimit") LocalDate dateLimit, @Param("limit") int limit);

    // Récupérer les patients par date de dernière visite
    List<Patient> findByDerniereVisiteOrderByDerniereVisiteDesc(LocalDate derniereVisite);

    // ✅ CORRECTION : Utiliser une expression calculée au lieu de seancesRestantes
    @Query("SELECT p FROM Patient p WHERE p.seancesPrevues > p.seancesEffectuees ORDER BY (p.seancesPrevues - p.seancesEffectuees) DESC")
    List<Patient> findPatientsWithRemainingSessionsOrderByRemaining();

    // Récupérer les patients qui ont terminé leurs séances
    @Query("SELECT p FROM Patient p WHERE p.seancesEffectuees >= p.seancesPrevues AND p.seancesPrevues > 0 ORDER BY p.derniereVisite DESC")
    List<Patient> findPatientsWithCompletedSessions();

    // Recherche avancée
    @Query("SELECT p FROM Patient p WHERE " +
            "LOWER(p.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(CONCAT(p.prenom, ' ', p.nom)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(CONCAT(p.nom, ' ', p.prenom)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.pathologie) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.telephone) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Patient> searchPatients(@Param("query") String query);

    // Statistiques pour le dashboard
    @Query("SELECT COUNT(p) FROM Patient p WHERE p.statut = 'actif'")
    Long countActivePatients();

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.statut = 'nouveau'")
    Long countNewPatients();

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.statut = 'inactif'")
    Long countInactivePatients();

    // Patients récemment actifs (dernière visite dans les 30 jours)
    @Query("SELECT COUNT(p) FROM Patient p WHERE p.derniereVisite >= :dateLimit")
    Long countRecentlyActivePatients(@Param("dateLimit") LocalDate dateLimit);

    // Patients avec séances en cours
    @Query("SELECT COUNT(p) FROM Patient p WHERE p.seancesEffectuees < p.seancesPrevues AND p.seancesPrevues > 0")
    Long countPatientsWithOngoingSessions();

    // Top patients par nombre de séances effectuées
    @Query("SELECT p FROM Patient p WHERE p.seancesEffectuees > 0 ORDER BY p.seancesEffectuees DESC LIMIT :limit")
    List<Patient> findTopPatientsBySessionsCount(@Param("limit") int limit);

    // Patients nouveaux de la semaine
    @Query("SELECT p FROM Patient p WHERE p.derniereVisite >= :weekStart ORDER BY p.derniereVisite DESC")
    List<Patient> findNewPatientsThisWeek(@Param("weekStart") LocalDate weekStart);

    // Patients par pathologie
    List<Patient> findByPathologieContainingIgnoreCaseOrderByNomAsc(String pathologie);

    // Patients par tranche d'âge (approximatif basé sur l'année de naissance)
    @Query("SELECT p FROM Patient p WHERE YEAR(CURRENT_DATE) - YEAR(p.dateNaissance) BETWEEN :ageMin AND :ageMax ORDER BY p.dateNaissance DESC")
    List<Patient> findPatientsByAgeRange(@Param("ageMin") int ageMin, @Param("ageMax") int ageMax);

    // Vérifier si un patient existe avec un nom et prénom
    boolean existsByNomAndPrenom(String nom, String prenom);

    // Récupérer les patients par sexe
    List<Patient> findBySexeOrderByNomAsc(String sexe);

    // Patients sans dernière visite renseignée
    List<Patient> findByDerniereVisiteIsNullOrderByNomAsc();

    // Moyenne des séances prévues
    @Query("SELECT AVG(p.seancesPrevues) FROM Patient p WHERE p.seancesPrevues > 0")
    Double getAverageSeancesPrevues();

    // Moyenne des séances effectuées
    @Query("SELECT AVG(p.seancesEffectuees) FROM Patient p WHERE p.seancesEffectuees > 0")
    Double getAverageSeancesEffectuees();

    // ✅ CORRECTION : Patients avec le plus de séances restantes (calculé)
    @Query("SELECT p FROM Patient p WHERE (p.seancesPrevues - p.seancesEffectuees) > 0 ORDER BY (p.seancesPrevues - p.seancesEffectuees) DESC LIMIT :limit")
    List<Patient> findPatientsWithMostRemainingSessions(@Param("limit") int limit);

    // Compter les patients créés aujourd'hui
    @Query("SELECT COUNT(p) FROM Patient p WHERE DATE(p.derniereVisite) = CURRENT_DATE")
    Long countPatientsSeenToday();

    // Récupérer les patients vus aujourd'hui
    @Query("SELECT p FROM Patient p WHERE DATE(p.derniereVisite) = CURRENT_DATE ORDER BY p.derniereVisite DESC")
    List<Patient> findPatientsSeenToday();

    // Récupérer les patients sans séances prévues
    @Query("SELECT p FROM Patient p WHERE p.seancesPrevues IS NULL OR p.seancesPrevues = 0 ORDER BY p.nom ASC")
    List<Patient> findPatientsWithoutPlannedSessions();

    // Récupérer les patients inactifs depuis X jours
    @Query("SELECT p FROM Patient p WHERE p.derniereVisite < :dateLimit OR p.derniereVisite IS NULL ORDER BY p.derniereVisite ASC")
    List<Patient> findInactivePatientsOlderThan(@Param("dateLimit") LocalDate dateLimit);
}