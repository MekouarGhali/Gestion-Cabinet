package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    // Rechercher par numéro de facture
    Optional<Facture> findByNumero(String numero);

    // Vérifier si un numéro existe déjà
    boolean existsByNumero(String numero);

    // Rechercher par patient
    List<Facture> findByPatientIdOrderByDateDescIdDesc(Long patientId);

    // Rechercher par plage de dates
    List<Facture> findByDateBetweenOrderByDateDescIdDesc(LocalDate dateDebut, LocalDate dateFin);

    // Rechercher par mode de paiement
    List<Facture> findByModePaiementOrderByDateDescIdDesc(String modePaiement);

    // Rechercher par mutuelle
    List<Facture> findByMutuelleOrderByDateDescIdDesc(String mutuelle);

    // Recherche globale (nom patient, numéro facture, mode paiement)
    @Query("SELECT f FROM Facture f JOIN f.patient p " +
            "WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(p.prenom) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(f.numero) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(f.modePaiement) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY f.date DESC, f.id DESC")
    List<Facture> searchFactures(@Param("query") String query);

    // Factures d'aujourd'hui
    @Query("SELECT f FROM Facture f WHERE f.date = CURRENT_DATE ORDER BY f.id DESC")
    List<Facture> findTodayFactures();

    // Factures du mois en cours
    @Query("SELECT f FROM Facture f WHERE YEAR(f.date) = :year AND MONTH(f.date) = :month ORDER BY f.date DESC")
    List<Facture> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    // Statistiques - Total du chiffre d'affaires par mois
    @Query("SELECT SUM(f.montantTotal) FROM Facture f WHERE YEAR(f.date) = :year AND MONTH(f.date) = :month")
    Double getTotalRevenue(@Param("year") int year, @Param("month") int month);

    // Statistiques - Nombre de factures par mode de paiement
    @Query("SELECT f.modePaiement, COUNT(f) FROM Facture f GROUP BY f.modePaiement")
    List<Object[]> countByModePaiement();

    // Toutes les factures triées par date décroissante
    List<Facture> findAllByOrderByDateDescIdDesc();
}