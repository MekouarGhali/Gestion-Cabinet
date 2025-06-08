package com.example.gestion_de_cabinet_medical.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "tache")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tache {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime heure;

    @Builder.Default
    private boolean terminee = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt; // Quand la tâche a été terminée

    @PrePersist
    private void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // Méthodes utilitaires
    public void marquerTerminee() {
        this.terminee = true;
        this.completedAt = LocalDateTime.now();
    }

    public boolean isAujourdhui() {
        return LocalDate.now().equals(this.date);
    }

    public boolean isPasse() {
        return this.date.isBefore(LocalDate.now());
    }

    public String getFormattedDateTime() {
        if (heure != null) {
            return date.toString() + " " + heure.toString();
        }
        return date.toString();
    }

    // Vérifier si la tâche doit être supprimée (fin de journée pour les tâches terminées)
    public boolean doitEtreSupprimee() {
        if (!terminee || completedAt == null) {
            return false;
        }

        // Supprimer à la fin de la journée (00h00 du jour suivant)
        LocalDate dateCompletion = completedAt.toLocalDate();
        LocalDate aujourdhui = LocalDate.now();

        // Si la tâche a été terminée hier ou avant, elle doit être supprimée
        return dateCompletion.isBefore(aujourdhui);
    }
}