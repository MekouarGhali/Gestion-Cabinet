package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
@Table(name = "dashboard")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Dashboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date; // Date de calcul des statistiques

    // ===== STATISTIQUES DU JOUR =====
    @Column(nullable = false)
    @Builder.Default
    private Long rendezVousAujourdhuiTotal = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Long rendezVousAujourdhui = 0L; // RDV planifiés/confirmés/en cours

    @Column(nullable = false)
    @Builder.Default
    private Long rendezVousEnCours = 0L; // RDV actuellement en cours

    @Column(nullable = false)
    @Builder.Default
    private Long rendezVousTermines = 0L; // RDV terminés aujourd'hui

    // ===== STATISTIQUES PATIENTS =====
    @Column(nullable = false)
    @Builder.Default
    private Long patientsActifs = 0L; // Patients avec statut "actif"

    @Column(nullable = false)
    @Builder.Default
    private Long patientsNouveaux = 0L; // Patients avec statut "nouveau"

    @Column(nullable = false)
    @Builder.Default
    private Long patientsTotaux = 0L; // Tous les patients

    // ===== STATISTIQUES MENSUELLES =====
    @Column(nullable = false)
    @Builder.Default
    private Long rendezVousAnnulesMois = 0L; // RDV annulés ce mois

    @Column(nullable = false)
    @Builder.Default
    private Double revenusAujourdhuiDH = 0.0; // Revenus du jour

    @Column(nullable = false)
    @Builder.Default
    private Double revenusMensuelsDH = 0.0; // Revenus du mois

    // ===== MÉTADONNÉES =====
    @Column(nullable = false)
    private LocalDateTime lastUpdated; // Dernière mise à jour

    @Column(nullable = false)
    @Builder.Default
    private String updatedBy = "SYSTEM"; // Qui a mis à jour

    @PrePersist
    @PreUpdate
    private void preUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    // ===== MÉTHODES UTILITAIRES =====

    public static Dashboard createForDate(LocalDate date) {
        return Dashboard.builder()
                .date(date)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    public boolean isToday() {
        return LocalDate.now().equals(this.date);
    }

    public boolean isThisMonth() {
        YearMonth current = YearMonth.now();
        YearMonth dashboardMonth = YearMonth.from(this.date);
        return current.equals(dashboardMonth);
    }

    // Incrémenter les compteurs
    public void incrementRendezVousAujourdHui() {
        this.rendezVousAujourdhuiTotal++;
        this.rendezVousAujourdhui++;
    }

    public void incrementRendezVousEnCours() {
        this.rendezVousEnCours++;
        if (this.rendezVousAujourdhui > 0) {
            this.rendezVousAujourdhui--;
        }
    }

    public void incrementRendezVousTermines() {
        this.rendezVousTermines++;
        if (this.rendezVousEnCours > 0) {
            this.rendezVousEnCours--;
        }
    }

    public void incrementRendezVousAnnulesMois() {
        this.rendezVousAnnulesMois++;
        if (this.rendezVousAujourdhui > 0) {
            this.rendezVousAujourdhui--;
        }
    }

    public void addRevenuAujourdHui(Double montant) {
        this.revenusAujourdhuiDH += (montant != null ? montant : 0.0);
    }

    public void addRevenuMensuel(Double montant) {
        this.revenusMensuelsDH += (montant != null ? montant : 0.0);
    }

    // Pourcentages et ratios
    public double getTauxCompletionAujourdHui() {
        if (rendezVousAujourdhuiTotal == 0) return 0.0;
        return (double) rendezVousTermines / rendezVousAujourdhuiTotal * 100;
    }

    public double getTauxAnnulationMois() {
        // Calcul approximatif - pourrait être amélioré avec plus de données
        if (rendezVousAnnulesMois == 0) return 0.0;
        return Math.min(100.0, rendezVousAnnulesMois * 5.0); // Estimation
    }

    // Formatage pour l'affichage
    public String getFormattedRevenusAujourdHui() {
        return String.format("%.2f DH", revenusAujourdhuiDH);
    }

    public String getFormattedRevenusMensuels() {
        return String.format("%.2f DH", revenusMensuelsDH);
    }
}