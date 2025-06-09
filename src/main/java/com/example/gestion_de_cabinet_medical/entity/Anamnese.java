package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "anamnese")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Anamnese {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numAnamnese;

    @Column(nullable = false)
    private LocalDate dateEntretien;

    @Column(nullable = false)
    private String nomPrenom;

    @Column(nullable = false)
    private LocalDate dateNaissance;

    private String adressePar;
    private String motifConsultation;
    private String reeducationAnterieure;

    // ✅ MODIFICATION : Statuts harmonisés avec CompteRendu
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAnamnese statut = StatutAnamnese.EN_COURS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "anamneses", "rendezVous", "factures"})
    private Patient patient;

    // === INFORMATIONS STRUCTURÉES ===
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "nomPere", column = @Column(name = "nom_pere")),
            @AttributeOverride(name = "agePere", column = @Column(name = "age_pere")),
            @AttributeOverride(name = "professionPere", column = @Column(name = "profession_pere")),
            @AttributeOverride(name = "nomMere", column = @Column(name = "nom_mere")),
            @AttributeOverride(name = "ageMere", column = @Column(name = "age_mere")),
            @AttributeOverride(name = "professionMere", column = @Column(name = "profession_mere"))
    })
    private InfoParents parents;

    private Boolean consanguinite;

    @Column(columnDefinition = "TEXT")
    private String fraterie;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "desire", column = @Column(name = "grossesse_desire")),
            @AttributeOverride(name = "compliquee", column = @Column(name = "grossesse_compliquee")),
            @AttributeOverride(name = "autres", column = @Column(name = "grossesse_autres", columnDefinition = "TEXT"))
    })
    private InfoGrossesse grossesse;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "terme", column = @Column(name = "accouchement_terme")),
            @AttributeOverride(name = "premature", column = @Column(name = "accouchement_premature")),
            @AttributeOverride(name = "postMature", column = @Column(name = "accouchement_post_mature")),
            @AttributeOverride(name = "voieBasse", column = @Column(name = "accouchement_voie_basse")),
            @AttributeOverride(name = "cesarienne", column = @Column(name = "accouchement_cesarienne")),
            @AttributeOverride(name = "cris", column = @Column(name = "accouchement_cris")),
            @AttributeOverride(name = "autres", column = @Column(name = "accouchement_autres", columnDefinition = "TEXT"))
    })
    private InfoAccouchement accouchement;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "type", column = @Column(name = "allaitement_type")),
            @AttributeOverride(name = "duree", column = @Column(name = "allaitement_duree"))
    })
    private InfoAllaitement allaitement;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "tenueTete", column = @Column(name = "dev_tenue_tete")),
            @AttributeOverride(name = "positionAssise", column = @Column(name = "dev_position_assise")),
            @AttributeOverride(name = "quatrePattes", column = @Column(name = "dev_quatre_pattes")),
            @AttributeOverride(name = "positionDebout", column = @Column(name = "dev_position_debout")),
            @AttributeOverride(name = "marche", column = @Column(name = "dev_marche"))
    })
    private InfoDeveloppement developpement;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "premierMot", column = @Column(name = "langage_premier_mot")),
            @AttributeOverride(name = "premierePhrase", column = @Column(name = "langage_premiere_phrase"))
    })
    private InfoLangage langage;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "avecMere", column = @Column(name = "comp_mere", columnDefinition = "TEXT")),
            @AttributeOverride(name = "avecPere", column = @Column(name = "comp_pere", columnDefinition = "TEXT")),
            @AttributeOverride(name = "avecFreres", column = @Column(name = "comp_freres", columnDefinition = "TEXT")),
            @AttributeOverride(name = "aEcole", column = @Column(name = "comp_ecole", columnDefinition = "TEXT")),
            @AttributeOverride(name = "autres", column = @Column(name = "comp_autres", columnDefinition = "TEXT"))
    })
    private InfoComportement comportement;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "scolarisation", column = @Column(name = "divers_scolarisation")),
            @AttributeOverride(name = "sommeil", column = @Column(name = "divers_sommeil")),
            @AttributeOverride(name = "appetit", column = @Column(name = "divers_appetit")),
            @AttributeOverride(name = "proprete", column = @Column(name = "divers_proprete"))
    })
    private InfoDivers divers;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "personnels", column = @Column(name = "antecedents_personnels", columnDefinition = "TEXT")),
            @AttributeOverride(name = "familiaux", column = @Column(name = "antecedents_familiaux", columnDefinition = "TEXT"))
    })
    private InfoAntecedents antecedents;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

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

    // ✅ MODIFICATION : Énumération des statuts harmonisée avec CompteRendu
    public enum StatutAnamnese {
        EN_COURS("En cours"),
        TERMINE("Terminé");

        private final String libelle;
        StatutAnamnese(String libelle) { this.libelle = libelle; }
        public String getLibelle() { return libelle; }
    }

    public enum TypeAllaitement {
        MATERNEL("Maternel"),
        ARTIFICIEL("Artificiel"),
        MIXTE("Mixte");

        private final String libelle;
        TypeAllaitement(String libelle) { this.libelle = libelle; }
        public String getLibelle() { return libelle; }
    }

    // === CLASSES EMBEDDABLES (inchangées) ===
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoParents {
        private String nomPere;
        private Integer agePere;
        private String professionPere;
        private String nomMere;
        private Integer ageMere;
        private String professionMere;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoGrossesse {
        private Boolean desire;
        private Boolean compliquee;
        private String autres;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoAccouchement {
        private Boolean terme;
        private Boolean premature;
        private Boolean postMature;
        private Boolean voieBasse;
        private Boolean cesarienne;
        private Boolean cris;
        private String autres;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoAllaitement {
        @Enumerated(EnumType.STRING)
        private TypeAllaitement type;
        private Integer duree;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoDeveloppement {
        private String tenueTete;
        private String positionAssise;
        private String quatrePattes;
        private String positionDebout;
        private String marche;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoLangage {
        private String premierMot;
        private String premierePhrase;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoComportement {
        private String avecMere;
        private String avecPere;
        private String avecFreres;
        private String aEcole;
        private String autres;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoDivers {
        private String scolarisation;
        private String sommeil;
        private String appetit;
        private String proprete;
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfoAntecedents {
        private String personnels;
        private String familiaux;
    }

    // === MÉTHODES UTILITAIRES ===
    public String getPatientNomComplet() {
        return patient != null ?
                (patient.getPrenom() + " " + patient.getNom()).trim() :
                nomPrenom;
    }

    public Integer getAgePatient() {
        if (dateNaissance != null) {
            return LocalDate.now().getYear() - dateNaissance.getYear();
        }
        return null;
    }

    public boolean isComplete() {
        return statut == StatutAnamnese.TERMINE;
    }

    public boolean estEnCours() {
        return statut == StatutAnamnese.EN_COURS;
    }

    // ✅ AJOUT : Méthode pour déterminer le statut automatiquement
    public StatutAnamnese determinerStatutAutomatique() {
        // Vérifier les champs obligatoires
        boolean champsObligatoiresRemplis =
                nomPrenom != null && !nomPrenom.trim().isEmpty() &&
                        dateNaissance != null &&
                        dateEntretien != null;

        if (!champsObligatoiresRemplis) {
            return StatutAnamnese.EN_COURS;
        }

        // Compter les sections remplies
        int sectionsRemplies = 0;
        int totalSections = 8; // parents, grossesse, accouchement, allaitement, développement, langage, comportement, divers

        if (parents != null && hasParentsContent()) sectionsRemplies++;
        if (grossesse != null && hasGrossesseContent()) sectionsRemplies++;
        if (accouchement != null && hasAccouchementContent()) sectionsRemplies++;
        if (allaitement != null && hasAllaitementContent()) sectionsRemplies++;
        if (developpement != null && hasDeveloppementContent()) sectionsRemplies++;
        if (langage != null && hasLangageContent()) sectionsRemplies++;
        if (comportement != null && hasComportementContent()) sectionsRemplies++;
        if (divers != null && hasDiversContent()) sectionsRemplies++;

        // Critères pour "TERMINE": au moins 5 sections sur 8 remplies
        if (sectionsRemplies >= 5) {
            return StatutAnamnese.TERMINE;
        }

        return StatutAnamnese.EN_COURS;
    }

    // ✅ AJOUT : Méthodes utilitaires pour vérifier le contenu des sections
    private boolean hasParentsContent() {
        return parents != null && (
                (parents.getNomPere() != null && !parents.getNomPere().trim().isEmpty()) ||
                        (parents.getNomMere() != null && !parents.getNomMere().trim().isEmpty())
        );
    }

    private boolean hasGrossesseContent() {
        return grossesse != null && (
                grossesse.getDesire() != null ||
                        grossesse.getCompliquee() != null ||
                        (grossesse.getAutres() != null && !grossesse.getAutres().trim().isEmpty())
        );
    }

    private boolean hasAccouchementContent() {
        return accouchement != null && (
                accouchement.getTerme() != null ||
                        accouchement.getPremature() != null ||
                        accouchement.getPostMature() != null ||
                        accouchement.getVoieBasse() != null ||
                        accouchement.getCesarienne() != null ||
                        accouchement.getCris() != null ||
                        (accouchement.getAutres() != null && !accouchement.getAutres().trim().isEmpty())
        );
    }

    private boolean hasAllaitementContent() {
        return allaitement != null && (
                allaitement.getType() != null ||
                        allaitement.getDuree() != null
        );
    }

    private boolean hasDeveloppementContent() {
        return developpement != null && (
                (developpement.getTenueTete() != null && !developpement.getTenueTete().trim().isEmpty()) ||
                        (developpement.getPositionAssise() != null && !developpement.getPositionAssise().trim().isEmpty()) ||
                        (developpement.getQuatrePattes() != null && !developpement.getQuatrePattes().trim().isEmpty()) ||
                        (developpement.getPositionDebout() != null && !developpement.getPositionDebout().trim().isEmpty()) ||
                        (developpement.getMarche() != null && !developpement.getMarche().trim().isEmpty())
        );
    }

    private boolean hasLangageContent() {
        return langage != null && (
                (langage.getPremierMot() != null && !langage.getPremierMot().trim().isEmpty()) ||
                        (langage.getPremierePhrase() != null && !langage.getPremierePhrase().trim().isEmpty())
        );
    }

    private boolean hasComportementContent() {
        return comportement != null && (
                (comportement.getAvecMere() != null && !comportement.getAvecMere().trim().isEmpty()) ||
                        (comportement.getAvecPere() != null && !comportement.getAvecPere().trim().isEmpty()) ||
                        (comportement.getAvecFreres() != null && !comportement.getAvecFreres().trim().isEmpty()) ||
                        (comportement.getAEcole() != null && !comportement.getAEcole().trim().isEmpty()) ||
                        (comportement.getAutres() != null && !comportement.getAutres().trim().isEmpty())
        );
    }

    private boolean hasDiversContent() {
        return divers != null && (
                (divers.getScolarisation() != null && !divers.getScolarisation().trim().isEmpty()) ||
                        (divers.getSommeil() != null && !divers.getSommeil().trim().isEmpty()) ||
                        (divers.getAppetit() != null && !divers.getAppetit().trim().isEmpty()) ||
                        (divers.getProprete() != null && !divers.getProprete().trim().isEmpty())
        );
    }
}