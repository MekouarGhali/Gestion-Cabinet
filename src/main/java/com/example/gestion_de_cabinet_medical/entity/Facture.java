package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facture")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Facture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    // ✅ Relation avec Patient au lieu d'un simple String
    @ManyToOne(fetch = FetchType.EAGER) // Changer LAZY en EAGER
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"factures", "rendezVous", "hibernateLazyInitializer", "handler"})
    private Patient patient;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String modePaiement; // "espèce", "carte bancaire", "chèque", "virement"

    @Column(nullable = false)
    private String mutuelle; // "oui" / "non"

    private double montantTotal;

    // Informations du cabinet (par défaut mais modifiables)
    private String adresse;
    private String gsm;
    private String ice;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"facture", "hibernateLazyInitializer", "handler"})
    @Builder.Default
    private List<Prestation> prestations = new ArrayList<>();

    // ✅ NOUVELLE RELATION: Revenu associé à cette facture
    @OneToOne(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Revenu revenu;

    // Méthodes utilitaires
    public String getNomCompletPatient() {
        if (patient != null) {
            return (patient.getPrenom() != null ? patient.getPrenom() : "") + " " +
                    (patient.getNom() != null ? patient.getNom() : "");
        }
        return "";
    }

    @PrePersist
    @PreUpdate
    private void calculateTotal() {
        this.montantTotal = prestations.stream()
                .mapToDouble(Prestation::getTotal)
                .sum();
    }
}