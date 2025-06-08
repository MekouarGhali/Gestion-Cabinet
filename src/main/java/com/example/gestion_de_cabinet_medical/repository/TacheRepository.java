package com.example.gestion_de_cabinet_medical.repository;

import com.example.gestion_de_cabinet_medical.entity.Tache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {

    // Récupérer toutes les tâches non terminées triées par date et heure
    List<Tache> findByTermineeFalseOrderByDateAscHeureAsc();

    // Récupérer les tâches d'une date spécifique
    List<Tache> findByDateOrderByHeureAsc(LocalDate date);

    // Récupérer les tâches d'aujourd'hui non terminées
    @Query("SELECT t FROM Tache t WHERE t.date = CURRENT_DATE AND t.terminee = false ORDER BY t.heure ASC")
    List<Tache> findTodayPendingTasks();

    // Récupérer toutes les tâches d'aujourd'hui (terminées et non terminées)
    @Query("SELECT t FROM Tache t WHERE t.date = CURRENT_DATE ORDER BY t.terminee ASC, t.heure ASC")
    List<Tache> findTodayAllTasks();

    // ✅ CORRECTION : Récupérer les tâches de demain
    @Query("SELECT t FROM Tache t WHERE t.date = :tomorrow AND t.terminee = false ORDER BY t.heure ASC")
    List<Tache> findTomorrowTasks(@Param("tomorrow") LocalDate tomorrow);

    // Récupérer les tâches d'une plage de dates
    List<Tache> findByDateBetweenOrderByDateAscHeureAsc(LocalDate dateDebut, LocalDate dateFin);

    // Récupérer les tâches en retard (date passée et non terminées)
    @Query("SELECT t FROM Tache t WHERE t.date < CURRENT_DATE AND t.terminee = false ORDER BY t.date DESC, t.heure DESC")
    List<Tache> findOverdueTasks();

    // Récupérer les tâches terminées qui doivent être supprimées
    // (terminées avant aujourd'hui)
    @Query("SELECT t FROM Tache t WHERE t.terminee = true AND t.completedAt IS NOT NULL AND DATE(t.completedAt) < CURRENT_DATE")
    List<Tache> findCompletedTasksToDelete();

    // Compter les tâches d'aujourd'hui
    @Query("SELECT COUNT(t) FROM Tache t WHERE t.date = CURRENT_DATE")
    Long countTodayTasks();

    // Compter les tâches terminées d'aujourd'hui
    @Query("SELECT COUNT(t) FROM Tache t WHERE t.date = CURRENT_DATE AND t.terminee = true")
    Long countTodayCompletedTasks();

    // Compter les tâches en retard
    @Query("SELECT COUNT(t) FROM Tache t WHERE t.date < CURRENT_DATE AND t.terminee = false")
    Long countOverdueTasks();

    // Recherche textuelle dans les descriptions
    @Query("SELECT t FROM Tache t WHERE LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')) AND t.terminee = false ORDER BY t.date ASC, t.heure ASC")
    List<Tache> searchByDescription(@Param("query") String query);

    // Supprimer les tâches terminées d'une date spécifique
    @Query("DELETE FROM Tache t WHERE t.terminee = true AND t.completedAt IS NOT NULL AND DATE(t.completedAt) = :date")
    void deleteCompletedTasksFromDate(@Param("date") LocalDate date);

    // ✅ CORRECTION : Récupérer les tâches prochaines (7 prochains jours) non terminées
    @Query("SELECT t FROM Tache t WHERE t.date BETWEEN CURRENT_DATE AND :sevenDaysFromNow AND t.terminee = false ORDER BY t.date ASC, t.heure ASC")
    List<Tache> findUpcomingTasks(@Param("sevenDaysFromNow") LocalDate sevenDaysFromNow);

    // Vérifier s'il existe des tâches pour une date donnée
    boolean existsByDate(LocalDate date);

    // Récupérer les tâches par statut
    List<Tache> findByTermineeOrderByDateDescHeureDesc(boolean terminee);

    // Récupérer les dernières tâches ajoutées
    List<Tache> findTop10ByOrderByCreatedAtDesc();
}