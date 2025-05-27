package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Devis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DevisRepository extends JpaRepository<Devis, Long> {

    // Rechercher par numéro de devis
    Optional<Devis> findByNumero(String numero);

    // Vérifier si un numéro existe déjà
    boolean existsByNumero(String numero);

    // Rechercher par nom de patient
    List<Devis> findByNomPatientContainingIgnoreCaseOrderByDateDescIdDesc(String nomPatient);

    // Rechercher par plage de dates
    List<Devis> findByDateBetweenOrderByDateDescIdDesc(LocalDate dateDebut, LocalDate dateFin);

    // Rechercher par mutuelle
    List<Devis> findByMutuelleOrderByDateDescIdDesc(String mutuelle);

    // Recherche globale (nom patient, numéro devis)
    @Query("SELECT d FROM Devis d " +
            "WHERE LOWER(d.nomPatient) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(d.numero) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY d.date DESC, d.id DESC")
    List<Devis> searchDevis(@Param("query") String query);

    // Devis d'aujourd'hui
    @Query("SELECT d FROM Devis d WHERE d.date = CURRENT_DATE ORDER BY d.id DESC")
    List<Devis> findTodayDevis();

    // Devis du mois en cours
    @Query("SELECT d FROM Devis d WHERE YEAR(d.date) = :year AND MONTH(d.date) = :month ORDER BY d.date DESC")
    List<Devis> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    // Statistiques - Total du chiffre d'affaires par mois
    @Query("SELECT SUM(d.montantTotal) FROM Devis d WHERE YEAR(d.date) = :year AND MONTH(d.date) = :month")
    Double getTotalRevenue(@Param("year") int year, @Param("month") int month);

    // Statistiques - Nombre de devis par mutuelle
    @Query("SELECT d.mutuelle, COUNT(d) FROM Devis d GROUP BY d.mutuelle")
    List<Object[]> countByMutuelle();

    // Toutes les devis triées par date décroissante
    List<Devis> findAllByOrderByDateDescIdDesc();
}