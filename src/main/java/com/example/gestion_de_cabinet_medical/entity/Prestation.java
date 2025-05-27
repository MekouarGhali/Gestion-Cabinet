package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prestation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Prestation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private int quantite;

    @Column(nullable = false)
    private double prixUnitaire;

    @Column(nullable = false)
    private double total;

    // ✅ SOLUTION FINALE : Ignorer complètement lors de la sérialisation JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = true)
    @JsonIgnore  // Complètement ignoré par Jackson
    private Facture facture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id", nullable = true)
    @JsonIgnore  // Complètement ignoré par Jackson
    private Devis devis;

    @PrePersist
    @PreUpdate
    private void calculateTotalAndValidate() {
        // Calculer le total
        this.total = this.quantite * this.prixUnitaire;

        // Validation : une prestation doit appartenir soit à une facture soit à un devis
        if (facture == null && devis == null) {
            throw new IllegalStateException("Une prestation doit appartenir soit à une facture soit à un devis");
        }

        if (facture != null && devis != null) {
            throw new IllegalStateException("Une prestation ne peut pas appartenir à la fois à une facture et à un devis");
        }
    }

    // ✅ toString sans relations pour éviter les cycles
    @Override
    public String toString() {
        return "Prestation{" +
                "id=" + id +
                ", designation='" + designation + '\'' +
                ", quantite=" + quantite +
                ", prixUnitaire=" + prixUnitaire +
                ", total=" + total +
                '}';
    }

    // ✅ Equals et hashCode basés uniquement sur l'ID
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Prestation)) return false;
        Prestation that = (Prestation) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}