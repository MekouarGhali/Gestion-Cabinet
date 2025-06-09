package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Anamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnamneseRepository extends JpaRepository<Anamnese, Long> {

    // === RECHERCHE BASIQUE ===

    // Trouver par numéro d'anamnèse
    Optional<Anamnese> findByNumAnamnese(String numAnamnese);

    // Vérifier si un numéro d'anamnèse existe déjà
    boolean existsByNumAnamnese(String numAnamnese);

    // === RECHERCHE PAR PATIENT ===

    // Trouver toutes les anamnèses d'un patient
    List<Anamnese> findByPatientIdOrderByDateCreationDesc(Long patientId);

    // Trouver toutes les anamnèses d'un patient par son nom/prénom
    @Query("SELECT a FROM Anamnese a WHERE a.patient.id = :patientId " +
            "OR (LOWER(a.nomPrenom) LIKE LOWER(CONCAT('%', :nomPrenom, '%'))) " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> findByPatientIdOrNomPrenomContaining(
            @Param("patientId") Long patientId,
            @Param("nomPrenom") String nomPrenom
    );

    // === RECHERCHE PAR STATUT ===

    // Trouver par statut
    List<Anamnese> findByStatutOrderByDateCreationDesc(Anamnese.StatutAnamnese statut);

    // Compter par statut
    long countByStatut(Anamnese.StatutAnamnese statut);

    // === RECHERCHE PAR DATE ===

    // Trouver par date d'entretien
    List<Anamnese> findByDateEntretienOrderByDateCreationDesc(LocalDate dateEntretien);

    // Trouver par plage de dates d'entretien
    List<Anamnese> findByDateEntretienBetweenOrderByDateEntretienDesc(
            LocalDate dateDebut,
            LocalDate dateFin
    );

    // Anamnèses d'aujourd'hui
    @Query("SELECT a FROM Anamnese a WHERE a.dateEntretien = CURRENT_DATE " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> findTodayAnamneses();

    // Anamnèses de cette semaine
    @Query("SELECT a FROM Anamnese a WHERE a.dateEntretien >= :startOfWeek " +
            "AND a.dateEntretien <= :endOfWeek " +
            "ORDER BY a.dateEntretien DESC")
    List<Anamnese> findWeekAnamneses(
            @Param("startOfWeek") LocalDate startOfWeek,
            @Param("endOfWeek") LocalDate endOfWeek
    );

    // === RECHERCHE TEXTUELLE ===

    // Recherche globale dans plusieurs champs
    @Query("SELECT a FROM Anamnese a WHERE " +
            "LOWER(a.numAnamnese) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.nomPrenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.motifConsultation) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.adressePar) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.observations) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> searchByKeyword(@Param("query") String query);

    // Recherche par nom du patient (dans la table Patient et dans nomPrenom)
    @Query("SELECT a FROM Anamnese a LEFT JOIN a.patient p WHERE " +
            "LOWER(CONCAT(p.prenom, ' ', p.nom)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.nomPrenom) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> searchByPatientName(@Param("query") String query);

    // === STATISTIQUES ===

    // Compter le total des anamnèses
    @Query("SELECT COUNT(a) FROM Anamnese a")
    long countTotal();

    // Compter par mois
    @Query("SELECT COUNT(a) FROM Anamnese a WHERE " +
            "YEAR(a.dateEntretien) = :year AND MONTH(a.dateEntretien) = :month")
    long countByMonth(@Param("year") int year, @Param("month") int month);

    // Statistiques par statut
    @Query("SELECT a.statut, COUNT(a) FROM Anamnese a GROUP BY a.statut")
    List<Object[]> getStatistiquesByStatut();

    // === MÉTHODES UTILITAIRES ===

    // Dernière anamnèse créée (pour générer le prochain numéro)
    @Query("SELECT a FROM Anamnese a ORDER BY a.id DESC LIMIT 1")
    Optional<Anamnese> findLastCreated();

    // Anamnèses récentes (les 10 dernières)
    @Query("SELECT a FROM Anamnese a ORDER BY a.dateCreation DESC LIMIT 10")
    List<Anamnese> findRecentAnamneses();

    // ✅ MODIFICATION : Anamnèses incomplètes (en cours seulement) pour correspondre aux nouveaux statuts
    @Query("SELECT a FROM Anamnese a WHERE a.statut = 'EN_COURS' " +
            "ORDER BY a.dateCreation ASC")
    List<Anamnese> findIncompleteAnamneses();

    // Anamnèses d'un patient triées par date d'entretien
    List<Anamnese> findByPatientIdOrderByDateEntretienDesc(Long patientId);

    // Vérifier si un patient a déjà une anamnèse
    boolean existsByPatientId(Long patientId);

    // Compter les anamnèses d'un patient
    long countByPatientId(Long patientId);

    // === REQUÊTES AVANCÉES ===

    // Anamnèses avec informations patient complètes
    @Query("SELECT a FROM Anamnese a LEFT JOIN FETCH a.patient p " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> findAllWithPatientInfo();

    // Anamnèses par tranche d'âge du patient
    @Query("SELECT a FROM Anamnese a WHERE " +
            "YEAR(CURRENT_DATE) - YEAR(a.dateNaissance) BETWEEN :ageMin AND :ageMax " +
            "ORDER BY a.dateCreation DESC")
    List<Anamnese> findByPatientAgeRange(
            @Param("ageMin") int ageMin,
            @Param("ageMax") int ageMax
    );

    // Anamnèses par professionnel référent
    List<Anamnese> findByAdresseParContainingIgnoreCaseOrderByDateCreationDesc(String adressePar);
}