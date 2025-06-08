package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Tache;
import com.example.gestion_de_cabinet_medical.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;

    // ===== CRUD OPERATIONS =====

    public List<Tache> getAll() {
        return tacheRepository.findAll();
    }

    public Tache getById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tâche introuvable avec l'ID: " + id));
    }

    public Tache create(Tache tache) {
        // Validation
        if (tache.getDescription() == null || tache.getDescription().trim().isEmpty()) {
            throw new RuntimeException("La description de la tâche est obligatoire");
        }
        if (tache.getDate() == null) {
            throw new RuntimeException("La date de la tâche est obligatoire");
        }

        log.info("Création d'une nouvelle tâche: {}", tache.getDescription());
        return tacheRepository.save(tache);
    }

    public Tache update(Long id, Tache tacheDetails) {
        Tache tache = getById(id);

        tache.setDescription(tacheDetails.getDescription());
        tache.setDate(tacheDetails.getDate());
        tache.setHeure(tacheDetails.getHeure());
        tache.setTerminee(tacheDetails.isTerminee());

        log.info("Mise à jour de la tâche ID {}: {}", id, tache.getDescription());
        return tacheRepository.save(tache);
    }

    public void delete(Long id) {
        Tache tache = getById(id);
        log.info("Suppression de la tâche ID {}: {}", id, tache.getDescription());
        tacheRepository.delete(tache);
    }

    // ===== GESTION DES STATUTS =====

    @Transactional
    public Tache marquerTerminee(Long id) {
        Tache tache = getById(id);
        tache.marquerTerminee();

        log.info("Tâche marquée comme terminée ID {}: {}", id, tache.getDescription());
        return tacheRepository.save(tache);
    }

    @Transactional
    public Tache marquerNonTerminee(Long id) {
        Tache tache = getById(id);
        tache.setTerminee(false);
        tache.setCompletedAt(null);

        log.info("Tâche marquée comme non terminée ID {}: {}", id, tache.getDescription());
        return tacheRepository.save(tache);
    }

    // ===== RÉCUPÉRATION PAR CATÉGORIES =====

    public List<Tache> getTachesAujourdHui() {
        return tacheRepository.findTodayAllTasks();
    }

    public List<Tache> getTachesAujourdHuiNonTerminees() {
        return tacheRepository.findTodayPendingTasks();
    }

    public List<Tache> getTachesDemain() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        return tacheRepository.findTomorrowTasks(tomorrow);
    }

    public List<Tache> getTachesEnRetard() {
        return tacheRepository.findOverdueTasks();
    }

    public List<Tache> getTachesProchaines() {
        LocalDate sevenDaysFromNow = LocalDate.now().plusDays(7);
        return tacheRepository.findUpcomingTasks(sevenDaysFromNow);
    }

    public List<Tache> getTachesNonTerminees() {
        return tacheRepository.findByTermineeFalseOrderByDateAscHeureAsc();
    }

    public List<Tache> getTachesTerminees() {
        return tacheRepository.findByTermineeOrderByDateDescHeureDesc(true);
    }

    // ===== RECHERCHE =====

    public List<Tache> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getTachesNonTerminees();
        }
        return tacheRepository.searchByDescription(query.trim());
    }

    public List<Tache> getTachesByDate(LocalDate date) {
        return tacheRepository.findByDateOrderByHeureAsc(date);
    }

    public List<Tache> getTachesByPeriod(LocalDate dateDebut, LocalDate dateFin) {
        return tacheRepository.findByDateBetweenOrderByDateAscHeureAsc(dateDebut, dateFin);
    }

    // ===== STATISTIQUES =====

    public Long countTachesAujourdHui() {
        return tacheRepository.countTodayTasks();
    }

    public Long countTachesTermineesAujourdHui() {
        return tacheRepository.countTodayCompletedTasks();
    }

    public Long countTachesEnRetard() {
        return tacheRepository.countOverdueTasks();
    }

    public double getPourcentageCompletionAujourdHui() {
        Long total = countTachesAujourdHui();
        if (total == 0) return 0.0;

        Long terminees = countTachesTermineesAujourdHui();
        return (double) terminees / total * 100;
    }

    // ===== CRÉATIONS RAPIDES =====

    public Tache createTacheAujourdHui(String description, LocalTime heure) {
        Tache tache = Tache.builder()
                .description(description)
                .date(LocalDate.now())
                .heure(heure)
                .build();

        return create(tache);
    }

    public Tache createTacheDemain(String description, LocalTime heure) {
        Tache tache = Tache.builder()
                .description(description)
                .date(LocalDate.now().plusDays(1))
                .heure(heure)
                .build();

        return create(tache);
    }

    public Tache createTachePersonnalisee(String description, LocalDate date, LocalTime heure) {
        Tache tache = Tache.builder()
                .description(description)
                .date(date)
                .heure(heure)
                .build();

        return create(tache);
    }

    // ===== NETTOYAGE AUTOMATIQUE =====

    /**
     * Supprime automatiquement les tâches terminées à la fin de chaque journée (00h00)
     * Les tâches terminées avant aujourd'hui sont supprimées
     */
    @Scheduled(cron = "0 0 0 * * *") // Tous les jours à 00h00
    @Transactional
    public void nettoyageTachesTerminees() {
        log.info("🧹 Début du nettoyage automatique des tâches terminées");

        try {
            List<Tache> tachesASupprimer = tacheRepository.findCompletedTasksToDelete();

            if (!tachesASupprimer.isEmpty()) {
                log.info("📋 {} tâche(s) terminée(s) à supprimer", tachesASupprimer.size());

                for (Tache tache : tachesASupprimer) {
                    log.debug("🗑️ Suppression de la tâche: {} (terminée le {})",
                            tache.getDescription(),
                            tache.getCompletedAt().toLocalDate());
                }

                tacheRepository.deleteAll(tachesASupprimer);
                log.info("✅ {} tâche(s) supprimée(s) avec succès", tachesASupprimer.size());
            } else {
                log.info("ℹ️ Aucune tâche terminée à supprimer");
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors du nettoyage des tâches terminées", e);
        }
    }

    /**
     * Nettoyage manuel des tâches terminées
     */
    @Transactional
    public int nettoyageManuelTachesTerminees() {
        log.info("🧹 Nettoyage manuel des tâches terminées demandé");

        List<Tache> tachesASupprimer = tacheRepository.findCompletedTasksToDelete();

        if (!tachesASupprimer.isEmpty()) {
            tacheRepository.deleteAll(tachesASupprimer);
            log.info("✅ {} tâche(s) supprimée(s) manuellement", tachesASupprimer.size());
        }

        return tachesASupprimer.size();
    }

    // ===== VALIDATION =====

    public boolean isTacheValidePourCreation(String description, LocalDate date) {
        if (description == null || description.trim().isEmpty()) {
            return false;
        }
        if (date == null) {
            return false;
        }
        // Peut créer des tâches dans le passé (pour rattrapage)
        return true;
    }

    // ===== UTILITAIRES =====

    public List<Tache> getDernieresTachesAjoutees(int limit) {
        return tacheRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public boolean hasTachesAujourdHui() {
        return countTachesAujourdHui() > 0;
    }

    public boolean hasTachesEnRetard() {
        return countTachesEnRetard() > 0;
    }
}