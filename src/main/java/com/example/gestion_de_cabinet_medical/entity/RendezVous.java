package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "rendez_vous")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RendezVous {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ SEULE RELATION : @ManyToOne (obligatoire)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Patient patient;

    @Column(nullable = false)
    private LocalDate dateRendezVous;

    @Column(nullable = false)
    private LocalTime heureDebut;

    @Column(nullable = false)
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeRendezVous type = TypeRendezVous.SEANCE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutRendezVous statut = StatutRendezVous.PLANIFIE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    private boolean estRecurrent = false;

    // ✅ MÉTHODES UTILITAIRES (pas de relations compliquées)
    public String getNomCompletPatient() {
        if (patient != null) {
            return (patient.getPrenom() != null ? patient.getPrenom() : "") + " " +
                    (patient.getNom() != null ? patient.getNom() : "");
        }
        return "";
    }

    public Integer getSeancesRestantes() {
        if (patient == null) return 0;

        int prevues = patient.getSeancesPrevues() == null ? 0 : patient.getSeancesPrevues();
        int effectuees = patient.getSeancesEffectuees() == null ? 0 : patient.getSeancesEffectuees();

        return Math.max(0, prevues - effectuees);
    }

    // Énumérations
    public enum TypeRendezVous {
        SEANCE("Séance"),
        ANAMNESE("Anamnèse"),
        COMPTE_RENDU("Compte Rendu");

        private final String libelle;
        TypeRendezVous(String libelle) { this.libelle = libelle; }
        public String getLibelle() { return libelle; }
    }

    public enum StatutRendezVous {
        PLANIFIE("Planifié"),
        CONFIRME("Confirmé"),
        EN_COURS("En cours"),
        TERMINE("Terminé"),
        ANNULE("Annulé"),
        REPORTE("Reporté");

        private final String libelle;
        StatutRendezVous(String libelle) { this.libelle = libelle; }
        public String getLibelle() { return libelle; }
    }
}