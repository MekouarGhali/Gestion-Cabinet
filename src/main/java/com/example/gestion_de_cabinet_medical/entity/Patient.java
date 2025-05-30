package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;
    private String sexe;
    private String telephone;
    private String pathologie;
    private LocalDate dateNaissance;

    private Integer seancesPrevues;
    private Integer seancesEffectuees;

    private String statut; // Nouveau / Actif / Inactif
    private String avatar; // Initiales
    private LocalDate derniereVisite;

    // ✅ CORRECTIONS: Toutes les collections en @JsonIgnore pour éviter les cycles
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Facture> factures;

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<RendezVous> rendezVous;

    // ✅ CORRECTION CRITIQUE: JsonIgnore sur anamneses
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Anamnese> anamneses;

    // ✅ NOUVELLE RELATION: Comptes rendus du patient
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<CompteRendu> comptesRendus;

    // === MÉTHODES UTILITAIRES (sans @JsonIgnore) ===

    public String getNomComplet() {
        return (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
    }

    public Integer getAge() {
        if (dateNaissance != null) {
            return LocalDate.now().getYear() - dateNaissance.getYear();
        }
        return null;
    }

    public Integer getSeancesRestantes() {
        int prevues = seancesPrevues != null ? seancesPrevues : 0;
        int effectuees = seancesEffectuees != null ? seancesEffectuees : 0;
        return Math.max(0, prevues - effectuees);
    }

    public boolean isActif() {
        return "actif".equalsIgnoreCase(statut);
    }

    public boolean isInactif() {
        return "inactif".equalsIgnoreCase(statut);
    }

    public boolean isNouveau() {
        return "nouveau".equalsIgnoreCase(statut);
    }

    // ✅ CORRECTION: Méthodes utilitaires sans accès direct aux collections
    public boolean hasAnamneses() {
        // Ne pas accéder directement à la collection pour éviter lazy loading
        return false; // Sera calculé côté service si nécessaire
    }

    public int getNombreAnamneses() {
        // Ne pas accéder directement à la collection
        return 0; // Sera calculé côté service si nécessaire
    }

    public boolean hasComptesRendus() {
        // Ne pas accéder directement à la collection pour éviter lazy loading
        return false; // Sera calculé côté service si nécessaire
    }

    public int getNombreComptesRendus() {
        // Ne pas accéder directement à la collection
        return 0; // Sera calculé côté service si nécessaire
    }

    // ✅ SUPPRESSION: Pas d'accès direct aux collections
    // car cela force le chargement et peut créer des cycles de sérialisation
}