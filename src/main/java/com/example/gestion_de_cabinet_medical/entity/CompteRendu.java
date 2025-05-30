package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "compte_rendu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CompteRendu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numCompteRendu;

    @Column(nullable = false)
    private String nomPatient;

    @Column(nullable = false)
    private LocalDate dateNaissance;

    @Column(nullable = false)
    private LocalDate dateBilan;

    @Column(nullable = false)
    private String niveauScolaire;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutCompteRendu statut = StatutCompteRendu.EN_COURS;

    // Relation avec Patient (optionnelle)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "anamneses", "rendezVous", "factures"})
    private Patient patient;

    // === TESTS UTILISÉS ===
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "compte_rendu_tests",
            joinColumns = @JoinColumn(name = "compte_rendu_id")
    )
    @Column(name = "test_nom")
    private List<String> testsUtilises;

    // === CONTENU DU COMPTE RENDU ===
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "presentation", column = @Column(name = "contenu_presentation", columnDefinition = "TEXT")),
            @AttributeOverride(name = "anamnese", column = @Column(name = "contenu_anamnese", columnDefinition = "TEXT")),
            @AttributeOverride(name = "comportement", column = @Column(name = "contenu_comportement", columnDefinition = "TEXT")),
            @AttributeOverride(name = "conclusion", column = @Column(name = "contenu_conclusion", columnDefinition = "TEXT")),
            @AttributeOverride(name = "projetTherapeutique", column = @Column(name = "contenu_projet_therapeutique", columnDefinition = "TEXT"))
    })
    private ContenuCompteRendu contenu;

    // === BILAN PSYCHOMOTEUR DÉTAILLÉ ===
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "schemaCorporel", column = @Column(name = "bilan_schema_corporel", columnDefinition = "TEXT")),
            @AttributeOverride(name = "espace", column = @Column(name = "bilan_espace", columnDefinition = "TEXT")),
            @AttributeOverride(name = "tempsRythmes", column = @Column(name = "bilan_temps_rythmes", columnDefinition = "TEXT")),
            @AttributeOverride(name = "lateralite", column = @Column(name = "bilan_lateralite", columnDefinition = "TEXT")),
            @AttributeOverride(name = "graphisme", column = @Column(name = "bilan_graphisme", columnDefinition = "TEXT")),
            @AttributeOverride(name = "fonctionCognitive", column = @Column(name = "bilan_fonction_cognitive", columnDefinition = "TEXT")),
            @AttributeOverride(name = "equipementMoteur", column = @Column(name = "bilan_equipement_moteur", columnDefinition = "TEXT"))
    })
    private BilanPsychomoteur bilan;

    // === MÉTADONNÉES ===
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    // === ÉNUMÉRATIONS ===
    public enum StatutCompteRendu {
        EN_COURS("En cours"),
        TERMINE("Terminé");

        private final String libelle;
        StatutCompteRendu(String libelle) { this.libelle = libelle; }
        public String getLibelle() { return libelle; }
    }

    // === CLASSES INTERNES EMBEDDABLES ===
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContenuCompteRendu {
        private String presentation;
        private String anamnese;
        private String comportement;
        private String conclusion;
        private String projetTherapeutique;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BilanPsychomoteur {
        private String schemaCorporel;
        private String espace;
        private String tempsRythmes;
        private String lateralite;
        private String graphisme;
        private String fonctionCognitive;
        private String equipementMoteur;
    }

    // === MÉTHODES UTILITAIRES ===
    public String getPatientNomComplet() {
        return patient != null ?
                (patient.getPrenom() + " " + patient.getNom()).trim() :
                nomPatient;
    }

    public Integer getAgePatient() {
        if (dateNaissance != null) {
            return LocalDate.now().getYear() - dateNaissance.getYear();
        }
        return null;
    }

    public String getTestsUtilisesString() {
        if (testsUtilises == null || testsUtilises.isEmpty()) {
            return "Aucun test spécifié";
        }
        return String.join(", ", testsUtilises);
    }

    public boolean isComplet() {
        return statut == StatutCompteRendu.TERMINE;
    }

    public boolean estEnCours() {
        return statut == StatutCompteRendu.EN_COURS;
    }

    // === NOUVELLE MÉTHODE POUR DÉTERMINER LE STATUT AUTOMATIQUEMENT ===
    public StatutCompteRendu determinerStatutAutomatique() {
        // Vérifier les champs obligatoires
        boolean champsObligatoiresRemplis =
                nomPatient != null && !nomPatient.trim().isEmpty() &&
                        dateNaissance != null &&
                        dateBilan != null &&
                        niveauScolaire != null && !niveauScolaire.trim().isEmpty();

        if (!champsObligatoiresRemplis) {
            return StatutCompteRendu.EN_COURS;
        }

        // Compter les champs de contenu remplis
        int champsContenuRemplis = 0;
        if (contenu != null) {
            if (contenu.getPresentation() != null && !contenu.getPresentation().trim().isEmpty()) champsContenuRemplis++;
            if (contenu.getAnamnese() != null && !contenu.getAnamnese().trim().isEmpty()) champsContenuRemplis++;
            if (contenu.getComportement() != null && !contenu.getComportement().trim().isEmpty()) champsContenuRemplis++;
            if (contenu.getConclusion() != null && !contenu.getConclusion().trim().isEmpty()) champsContenuRemplis++;
            if (contenu.getProjetTherapeutique() != null && !contenu.getProjetTherapeutique().trim().isEmpty()) champsContenuRemplis++;
        }

        // Compter les champs de bilan remplis
        int champsBilanRemplis = 0;
        if (bilan != null) {
            if (bilan.getSchemaCorporel() != null && !bilan.getSchemaCorporel().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getEspace() != null && !bilan.getEspace().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getTempsRythmes() != null && !bilan.getTempsRythmes().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getLateralite() != null && !bilan.getLateralite().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getGraphisme() != null && !bilan.getGraphisme().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getFonctionCognitive() != null && !bilan.getFonctionCognitive().trim().isEmpty()) champsBilanRemplis++;
            if (bilan.getEquipementMoteur() != null && !bilan.getEquipementMoteur().trim().isEmpty()) champsBilanRemplis++;
        }

        // Critères pour "TERMINE": au moins 3 champs de contenu et 4 champs de bilan
        if (champsContenuRemplis >= 3 && champsBilanRemplis >= 4) {
            return StatutCompteRendu.TERMINE;
        }

        return StatutCompteRendu.EN_COURS;
    }
}