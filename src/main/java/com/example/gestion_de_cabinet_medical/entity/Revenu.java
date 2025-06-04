package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "revenu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Revenu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relation avec la facture (source du revenu)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facture_id", nullable = false)
    @JsonIgnoreProperties({"prestations", "hibernateLazyInitializer", "handler"})
    private Facture facture;

    // Relation avec le patient
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"factures", "rendezVous", "anamneses", "comptesRendus", "hibernateLazyInitializer", "handler"})
    private Patient patient;

    @Column(nullable = false)
    private LocalDate dateTransaction;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private double montant;

    @Column(nullable = false)
    private String modePaiement; // "espèce", "carte bancaire", "chèque", "virement"

    @Column(nullable = false)
    private String mutuelle; // "oui" / "non"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutRevenu statut; // PAYE, EN_ATTENTE, ANNULE

    // Informations extraites de la facture pour faciliter les requêtes
    @Column(nullable = false)
    private String numeroFacture;

    @Column(nullable = false)
    private String nomCompletPatient;

    // Type de prestation principal (basé sur les prestations de la facture)
    private String typePrestationPrincipal;

    // Méthodes utilitaires
    public String getStatutLabel() {
        switch (statut) {
            case PAYE: return "Payé";
            case EN_ATTENTE: return "En attente";
            case ANNULE: return "Annulé";
            default: return "Inconnu";
        }
    }

    public boolean isPaye() {
        return StatutRevenu.PAYE.equals(statut);
    }

    public boolean isEnAttente() {
        return StatutRevenu.EN_ATTENTE.equals(statut);
    }

    public boolean isAnnule() {
        return StatutRevenu.ANNULE.equals(statut);
    }

    @PrePersist
    private void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (dateTransaction == null) {
            dateTransaction = LocalDate.now();
        }
    }

    // Enum pour le statut
    public enum StatutRevenu {
        PAYE, EN_ATTENTE, ANNULE
    }
}