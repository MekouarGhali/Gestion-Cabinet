package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.CompteRendu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompteRenduRepository extends JpaRepository<CompteRendu, Long> {

    // === RECHERCHE BASIQUE ===

    // Trouver par numéro de compte rendu
    Optional<CompteRendu> findByNumCompteRendu(String numCompteRendu);

    // Vérifier si un numéro de compte rendu existe déjà
    boolean existsByNumCompteRendu(String numCompteRendu);

    // === RECHERCHE PAR PATIENT ===

    // Trouver tous les comptes rendus d'un patient
    List<CompteRendu> findByPatientIdOrderByDateCreationDesc(Long patientId);

    // Trouver par nom du patient
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.patient.id = :patientId " +
            "OR (LOWER(cr.nomPatient) LIKE LOWER(CONCAT('%', :nomPatient, '%'))) " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> findByPatientIdOrNomPatientContaining(
            @Param("patientId") Long patientId,
            @Param("nomPatient") String nomPatient
    );

    // === RECHERCHE PAR STATUT ===

    // Trouver par statut
    List<CompteRendu> findByStatutOrderByDateCreationDesc(CompteRendu.StatutCompteRendu statut);

    // Compter par statut
    long countByStatut(CompteRendu.StatutCompteRendu statut);

    // === RECHERCHE PAR DATE ===

    // Trouver par date de bilan
    List<CompteRendu> findByDateBilanOrderByDateCreationDesc(LocalDate dateBilan);

    // Trouver par plage de dates de bilan
    List<CompteRendu> findByDateBilanBetweenOrderByDateBilanDesc(
            LocalDate dateDebut,
            LocalDate dateFin
    );

    // Comptes rendus d'aujourd'hui
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.dateBilan = CURRENT_DATE " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> findTodayComptesRendus();

    // Comptes rendus de cette semaine
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.dateBilan >= :startOfWeek " +
            "AND cr.dateBilan <= :endOfWeek " +
            "ORDER BY cr.dateBilan DESC")
    List<CompteRendu> findWeekComptesRendus(
            @Param("startOfWeek") LocalDate startOfWeek,
            @Param("endOfWeek") LocalDate endOfWeek
    );

    // === RECHERCHE TEXTUELLE ===

    // Recherche globale dans plusieurs champs
    @Query("SELECT cr FROM CompteRendu cr WHERE " +
            "LOWER(cr.numCompteRendu) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(cr.nomPatient) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(cr.niveauScolaire) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(cr.observations) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> searchByKeyword(@Param("query") String query);

    // Recherche par nom du patient (dans la table Patient et dans nomPatient)
    @Query("SELECT cr FROM CompteRendu cr LEFT JOIN cr.patient p WHERE " +
            "LOWER(CONCAT(p.prenom, ' ', p.nom)) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(cr.nomPatient) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> searchByPatientName(@Param("query") String query);

    // Recherche par niveau scolaire
    List<CompteRendu> findByNiveauScolaireContainingIgnoreCaseOrderByDateCreationDesc(String niveauScolaire);

    // === STATISTIQUES ===

    // Compter le total des comptes rendus
    @Query("SELECT COUNT(cr) FROM CompteRendu cr")
    long countTotal();

    // Compter par mois
    @Query("SELECT COUNT(cr) FROM CompteRendu cr WHERE " +
            "YEAR(cr.dateBilan) = :year AND MONTH(cr.dateBilan) = :month")
    long countByMonth(@Param("year") int year, @Param("month") int month);

    // Statistiques par statut
    @Query("SELECT cr.statut, COUNT(cr) FROM CompteRendu cr GROUP BY cr.statut")
    List<Object[]> getStatistiquesByStatut();

    // === MÉTHODES UTILITAIRES ===

    // Dernier compte rendu créé (pour générer le prochain numéro)
    @Query("SELECT cr FROM CompteRendu cr ORDER BY cr.id DESC LIMIT 1")
    Optional<CompteRendu> findLastCreated();

    // Comptes rendus récents (les 10 derniers)
    @Query("SELECT cr FROM CompteRendu cr ORDER BY cr.dateCreation DESC LIMIT 10")
    List<CompteRendu> findRecentComptesRendus();

    // Comptes rendus incomplets (en cours seulement)
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.statut = 'EN_COURS' " +
            "ORDER BY cr.dateCreation ASC")
    List<CompteRendu> findIncompleteComptesRendus();

    // Comptes rendus d'un patient triés par date de bilan
    List<CompteRendu> findByPatientIdOrderByDateBilanDesc(Long patientId);

    // Vérifier si un patient a déjà un compte rendu
    boolean existsByPatientId(Long patientId);

    // Compter les comptes rendus d'un patient
    long countByPatientId(Long patientId);

    // === REQUÊTES AVANCÉES ===

    // Comptes rendus avec informations patient complètes
    @Query("SELECT cr FROM CompteRendu cr LEFT JOIN FETCH cr.patient p " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> findAllWithPatientInfo();

    // Comptes rendus par tranche d'âge du patient
    @Query("SELECT cr FROM CompteRendu cr WHERE " +
            "YEAR(CURRENT_DATE) - YEAR(cr.dateNaissance) BETWEEN :ageMin AND :ageMax " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> findByPatientAgeRange(
            @Param("ageMin") int ageMin,
            @Param("ageMax") int ageMax
    );

    // Comptes rendus par test utilisé
    @Query("SELECT cr FROM CompteRendu cr WHERE " +
            ":testName MEMBER OF cr.testsUtilises " +
            "ORDER BY cr.dateCreation DESC")
    List<CompteRendu> findByTestUtilise(@Param("testName") String testName);

    // Comptes rendus terminés dans une période
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.statut = 'TERMINE' " +
            "AND cr.dateBilan BETWEEN :dateDebut AND :dateFin " +
            "ORDER BY cr.dateBilan DESC")
    List<CompteRendu> findTerminesInPeriod(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // Comptes rendus en retard (en cours depuis plus de X jours)
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.statut = 'EN_COURS' " +
            "AND cr.dateCreation < :dateLimite " +
            "ORDER BY cr.dateCreation ASC")
    List<CompteRendu> findEnRetard(@Param("dateLimite") LocalDate dateLimite);

    // === REQUÊTES POUR TABLEAUX DE BORD ===

    // Comptes rendus à terminer cette semaine
    @Query("SELECT cr FROM CompteRendu cr WHERE cr.statut != 'TERMINE' " +
            "AND cr.dateBilan >= :startOfWeek AND cr.dateBilan <= :endOfWeek " +
            "ORDER BY cr.dateBilan ASC")
    List<CompteRendu> findATerminerCetteSemaine(
            @Param("startOfWeek") LocalDate startOfWeek,
            @Param("endOfWeek") LocalDate endOfWeek
    );

    // Distribution par niveau scolaire
    @Query("SELECT cr.niveauScolaire, COUNT(cr) FROM CompteRendu cr " +
            "GROUP BY cr.niveauScolaire ORDER BY COUNT(cr) DESC")
    List<Object[]> getDistributionParNiveauScolaire();

    // Moyenne d'âge des patients
    @Query("SELECT AVG(YEAR(CURRENT_DATE) - YEAR(cr.dateNaissance)) FROM CompteRendu cr")
    Double getMoyenneAgePatients();

    // Tests les plus utilisés
    @Query("SELECT t, COUNT(t) FROM CompteRendu cr " +
            "JOIN cr.testsUtilises t " +
            "GROUP BY t ORDER BY COUNT(t) DESC")
    List<Object[]> getTestsLesPlusUtilises();
}