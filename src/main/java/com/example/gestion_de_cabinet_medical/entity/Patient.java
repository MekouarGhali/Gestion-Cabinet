package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ AJOUT ICI
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
}