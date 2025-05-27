package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "devis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Devis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    // Nom du patient (peut ne pas être enregistré dans le système)
    @Column(nullable = false)
    private String nomPatient;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String mutuelle; // "oui" / "non"

    private double montantTotal;

    // Informations du cabinet (par défaut mais modifiables)
    private String adresse;
    private String gsm;
    private String ice;

    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"devis", "hibernateLazyInitializer", "handler"})
    @Builder.Default
    private List<Prestation> prestations = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void calculateTotal() {
        this.montantTotal = prestations.stream()
                .mapToDouble(Prestation::getTotal)
                .sum();
    }
}