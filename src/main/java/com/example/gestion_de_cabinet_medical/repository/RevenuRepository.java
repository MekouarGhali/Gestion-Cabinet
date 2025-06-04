package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Revenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RevenuRepository extends JpaRepository<Revenu, Long> {

    // Rechercher par patient
    List<Revenu> findByPatientIdOrderByDateTransactionDescIdDesc(Long patientId);

    // Rechercher par plage de dates
    List<Revenu> findByDateTransactionBetweenOrderByDateTransactionDescIdDesc(LocalDate dateDebut, LocalDate dateFin);

    // Rechercher par mode de paiement
    List<Revenu> findByModePaiementOrderByDateTransactionDescIdDesc(String modePaiement);

    // Rechercher par mutuelle
    List<Revenu> findByMutuelleOrderByDateTransactionDescIdDesc(String mutuelle);

    // Rechercher par statut
    List<Revenu> findByStatutOrderByDateTransactionDescIdDesc(Revenu.StatutRevenu statut);

    // Recherche globale (nom patient, numéro facture, mode paiement)
    @Query("SELECT r FROM Revenu r " +
            "WHERE LOWER(r.nomCompletPatient) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(r.numeroFacture) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(r.modePaiement) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY r.dateTransaction DESC, r.id DESC")
    List<Revenu> searchRevenus(@Param("query") String query);

    // Revenus d'aujourd'hui
    @Query("SELECT r FROM Revenu r WHERE r.dateTransaction = CURRENT_DATE ORDER BY r.id DESC")
    List<Revenu> findTodayRevenus();

    // Revenus du mois en cours
    @Query("SELECT r FROM Revenu r WHERE YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month ORDER BY r.dateTransaction DESC")
    List<Revenu> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    // Revenus de l'année en cours
    @Query("SELECT r FROM Revenu r WHERE YEAR(r.dateTransaction) = :year ORDER BY r.dateTransaction DESC")
    List<Revenu> findByYear(@Param("year") int year);

    // Statistiques - Total du chiffre d'affaires par mois
    @Query("SELECT SUM(r.montant) FROM Revenu r WHERE YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month AND r.statut = 'PAYE'")
    Double getTotalRevenue(@Param("year") int year, @Param("month") int month);

    // Statistiques - Total du chiffre d'affaires par année
    @Query("SELECT SUM(r.montant) FROM Revenu r WHERE YEAR(r.dateTransaction) = :year AND r.statut = 'PAYE'")
    Double getTotalRevenueByYear(@Param("year") int year);

    // Statistiques - Nombre de revenus par mode de paiement
    @Query("SELECT r.modePaiement, COUNT(r), SUM(r.montant) FROM Revenu r WHERE r.statut = 'PAYE' GROUP BY r.modePaiement")
    List<Object[]> getStatsByModePaiement();

    // Statistiques - Revenus par mois pour une année donnée
    @Query("SELECT MONTH(r.dateTransaction) as mois, SUM(r.montant) as total " +
            "FROM Revenu r " +
            "WHERE YEAR(r.dateTransaction) = :year AND r.statut = 'PAYE' " +
            "GROUP BY MONTH(r.dateTransaction) " +
            "ORDER BY MONTH(r.dateTransaction)")
    List<Object[]> getMonthlyRevenueByYear(@Param("year") int year);

    // Statistiques - Revenus par année
    @Query("SELECT YEAR(r.dateTransaction) as annee, SUM(r.montant) as total " +
            "FROM Revenu r " +
            "WHERE r.statut = 'PAYE' " +
            "GROUP BY YEAR(r.dateTransaction) " +
            "ORDER BY YEAR(r.dateTransaction)")
    List<Object[]> getYearlyRevenue();

    // Statistiques - Revenus par type de prestation (calcul dynamique via les prestations)
    @Query("SELECT " +
            "CASE " +
            "  WHEN LOWER(p.designation) LIKE '%bilan%' OR LOWER(p.designation) LIKE '%évaluation%' OR LOWER(p.designation) LIKE '%evaluation%' THEN 'Bilan' " +
            "  WHEN LOWER(p.designation) LIKE '%anamnèse%' OR LOWER(p.designation) LIKE '%anamnese%' THEN 'Anamnèse' " +
            "  ELSE 'Séance' " +
            "END as type, " +
            "SUM(p.total) as montant " +
            "FROM Prestation p " +
            "JOIN p.facture f " +
            "JOIN f.revenu r " +
            "WHERE r.statut = 'PAYE' AND YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month " +
            "GROUP BY " +
            "CASE " +
            "  WHEN LOWER(p.designation) LIKE '%bilan%' OR LOWER(p.designation) LIKE '%évaluation%' OR LOWER(p.designation) LIKE '%evaluation%' THEN 'Bilan' " +
            "  WHEN LOWER(p.designation) LIKE '%anamnèse%' OR LOWER(p.designation) LIKE '%anamnese%' THEN 'Anamnèse' " +
            "  ELSE 'Séance' " +
            "END " +
            "ORDER BY montant DESC")
    List<Object[]> getRevenueByPrestationType(@Param("year") int year, @Param("month") int month);

    // Compter les revenus en attente
    @Query("SELECT COUNT(r) FROM Revenu r WHERE r.statut = 'EN_ATTENTE'")
    Long countPendingPayments();

    // Montant total en attente
    @Query("SELECT SUM(r.montant) FROM Revenu r WHERE r.statut = 'EN_ATTENTE'")
    Double getTotalPendingAmount();

    // Compter les séances du mois
    @Query("SELECT COUNT(r) FROM Revenu r WHERE YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month")
    Long countSessionsByMonth(@Param("year") int year, @Param("month") int month);

    // Toutes les revenus triés par date décroissante
    List<Revenu> findAllByOrderByDateTransactionDescIdDesc();

    // Vérifier si un revenu existe déjà pour une facture
    boolean existsByFactureId(Long factureId);

    // Trouver par facture
    Revenu findByFactureId(Long factureId);
}