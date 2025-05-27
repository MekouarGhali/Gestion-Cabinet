package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Prestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestationRepository extends JpaRepository<Prestation, Long> {

    // Rechercher par facture
    List<Prestation> findByFactureIdOrderByIdAsc(Long factureId);

    // Rechercher par designation
    List<Prestation> findByDesignationContainingIgnoreCaseOrderByIdDesc(String designation);

    // Statistiques - Prestations les plus demandées
    @Query("SELECT p.designation, COUNT(p), SUM(p.total) FROM Prestation p GROUP BY p.designation ORDER BY COUNT(p) DESC")
    List<Object[]> getPopularPrestations();

    // Total des prestations par designation
    @Query("SELECT SUM(p.total) FROM Prestation p WHERE p.designation = :designation")
    Double getTotalByDesignation(@Param("designation") String designation);
}