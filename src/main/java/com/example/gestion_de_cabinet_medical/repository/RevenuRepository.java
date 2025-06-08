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

    // ===== MÉTHODES EXISTANTES =====

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

    // ===== NOUVELLES MÉTHODES POUR LE DASHBOARD =====

    // Revenus d'une date spécifique
    @Query("SELECT SUM(r.montant) FROM Revenu r WHERE r.dateTransaction = :date AND r.statut = 'PAYE'")
    Double getTotalRevenueByDate(@Param("date") LocalDate date);

    // Revenus d'aujourd'hui
    @Query("SELECT SUM(r.montant) FROM Revenu r WHERE r.dateTransaction = CURRENT_DATE AND r.statut = 'PAYE'")
    Double getTodayRevenue();

    // Compter les revenus d'aujourd'hui
    @Query("SELECT COUNT(r) FROM Revenu r WHERE r.dateTransaction = CURRENT_DATE")
    Long countTodayRevenus();

    // Revenus payés d'aujourd'hui
    @Query("SELECT COUNT(r) FROM Revenu r WHERE r.dateTransaction = CURRENT_DATE AND r.statut = 'PAYE'")
    Long countTodayPaidRevenus();

    // Moyenne des revenus journaliers du mois
    @Query("SELECT AVG(daily.total) FROM (" +
            "SELECT SUM(r.montant) as total FROM Revenu r " +
            "WHERE YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month AND r.statut = 'PAYE' " +
            "GROUP BY r.dateTransaction" +
            ") daily")
    Double getAverageDailyRevenueForMonth(@Param("year") int year, @Param("month") int month);

    // Revenus par jour de la semaine
    @Query("SELECT DAYOFWEEK(r.dateTransaction) as dayOfWeek, SUM(r.montant) as total " +
            "FROM Revenu r " +
            "WHERE r.statut = 'PAYE' AND r.dateTransaction >= :startDate AND r.dateTransaction <= :endDate " +
            "GROUP BY DAYOFWEEK(r.dateTransaction) " +
            "ORDER BY DAYOFWEEK(r.dateTransaction)")
    List<Object[]> getRevenueByDayOfWeek(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Top 5 des jours avec le plus de revenus ce mois
    @Query("SELECT r.dateTransaction, SUM(r.montant) as total " +
            "FROM Revenu r " +
            "WHERE YEAR(r.dateTransaction) = :year AND MONTH(r.dateTransaction) = :month AND r.statut = 'PAYE' " +
            "GROUP BY r.dateTransaction " +
            "ORDER BY total DESC LIMIT 5")
    List<Object[]> getTop5RevenueDays(@Param("year") int year, @Param("month") int month);

    // Revenus par type de mutuelle
    @Query("SELECT r.mutuelle, COUNT(r), SUM(r.montant) FROM Revenu r WHERE r.statut = 'PAYE' GROUP BY r.mutuelle")
    List<Object[]> getStatsByMutuelle();

    // Evolution des revenus (comparaison avec période précédente)
    @Query("SELECT " +
            "SUM(CASE WHEN r.dateTransaction BETWEEN :currentStart AND :currentEnd THEN r.montant ELSE 0 END) as currentPeriod, " +
            "SUM(CASE WHEN r.dateTransaction BETWEEN :previousStart AND :previousEnd THEN r.montant ELSE 0 END) as previousPeriod " +
            "FROM Revenu r WHERE r.statut = 'PAYE'")
    List<Object[]> getRevenueComparison(@Param("currentStart") LocalDate currentStart,
                                        @Param("currentEnd") LocalDate currentEnd,
                                        @Param("previousStart") LocalDate previousStart,
                                        @Param("previousEnd") LocalDate previousEnd);

    // Derniers revenus ajoutés
    @Query("SELECT r FROM Revenu r ORDER BY r.createdAt DESC LIMIT :limit")
    List<Revenu> findLatestRevenus(@Param("limit") int limit);

    // Revenus par patient le mieux payé
    @Query("SELECT r.nomCompletPatient, SUM(r.montant) as total " +
            "FROM Revenu r " +
            "WHERE r.statut = 'PAYE' " +
            "GROUP BY r.nomCompletPatient, r.patient.id " +
            "ORDER BY total DESC LIMIT :limit")
    List<Object[]> getTopPayingPatients(@Param("limit") int limit);

    // Montant moyen par transaction
    @Query("SELECT AVG(r.montant) FROM Revenu r WHERE r.statut = 'PAYE'")
    Double getAverageTransactionAmount();

    // Taux de recouvrement (pourcentage de revenus payés)
    @Query("SELECT " +
            "COUNT(CASE WHEN r.statut = 'PAYE' THEN 1 END) * 100.0 / COUNT(r) as tauxRecouvrement " +
            "FROM Revenu r")
    Double getRecoveryRate();

    // Revenus en attente les plus anciens
    @Query("SELECT r FROM Revenu r WHERE r.statut = 'EN_ATTENTE' ORDER BY r.dateTransaction ASC LIMIT :limit")
    List<Revenu> getOldestPendingRevenus(@Param("limit") int limit);

    // Statistiques détaillées pour le dashboard
    @Query("SELECT " +
            "COUNT(r) as totalTransactions, " +
            "SUM(r.montant) as totalMontant, " +
            "AVG(r.montant) as moyenneMontant, " +
            "SUM(CASE WHEN r.statut = 'PAYE' THEN r.montant ELSE 0 END) as montantPaye, " +
            "SUM(CASE WHEN r.statut = 'EN_ATTENTE' THEN r.montant ELSE 0 END) as montantEnAttente " +
            "FROM Revenu r WHERE r.dateTransaction = :date")
    List<Object[]> getDailyRevenueStats(@Param("date") LocalDate date);
}