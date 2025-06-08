package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "seance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Seance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relation avec le patient (obligatoire)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"factures", "rendezVous", "anamneses", "comptesRendus", "seances", "hibernateLazyInitializer", "handler"})
    private Patient patient;

    // Relation avec le rendez-vous d'origine (optionnel pour les séances manuelles)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rendez_vous_id")
    @JsonIgnoreProperties({"patient", "hibernateLazyInitializer", "handler"})
    private RendezVous rendezVous;

    @Column(nullable = false)
    private LocalDate dateSeance;

    @Column(nullable = false)
    private LocalTime heureDebut;

    @Column(nullable = false)
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeSeance type = TypeSeance.SEANCE;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Information sur qui a créé/confirmé la séance
    private String createdBy; // Nom du thérapeute

    @PrePersist
    private void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (createdBy == null) {
            createdBy = "Mekouar Zineb"; // Par défaut
        }
    }

    // Énumération pour le type de séance
    public enum TypeSeance {
        SEANCE("Séance"),                              // ✅ SEULE à compter dans séances effectuées
        ANAMNESE("Anamnèse"),                         // ❌ Ne compte pas
        BILAN("Bilan");                               // ❌ Ne compte pas (pour les comptes rendus)

        private final String libelle;

        TypeSeance(String libelle) {
            this.libelle = libelle;
        }

        public String getLibelle() {
            return libelle;
        }

        // ✅ MÉTHODE CLÉS : Seule la SEANCE compte dans les séances effectuées
        public boolean compteCommeSeanceEffectuee() {
            return this == SEANCE;
        }
    }

    // Méthodes utilitaires
    public String getNomCompletPatient() {
        if (patient != null) {
            return (patient.getPrenom() != null ? patient.getPrenom() : "") + " " +
                    (patient.getNom() != null ? patient.getNom() : "");
        }
        return "";
    }

    public int getDureeEnMinutes() {
        if (heureDebut != null && heureFin != null) {
            return (int) java.time.Duration.between(heureDebut, heureFin).toMinutes();
        }
        return 0;
    }

    public String getFormattedDuration() {
        int minutes = getDureeEnMinutes();
        if (minutes >= 60) {
            int heures = minutes / 60;
            int minutesRestantes = minutes % 60;
            return heures + "h" + (minutesRestantes > 0 ? String.format("%02d", minutesRestantes) : "");
        }
        return minutes + " min";
    }

    // ✅ Vérifier si cette séance compte dans les séances effectuées
    public boolean compteCommeSeanceEffectuee() {
        return type.compteCommeSeanceEffectuee();
    }
}