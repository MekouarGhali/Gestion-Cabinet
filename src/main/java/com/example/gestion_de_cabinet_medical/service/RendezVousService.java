package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.entity.RendezVous;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import com.example.gestion_de_cabinet_medical.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;

    // CRUD Operations
    public List<RendezVous> getAll() {
        return rendezVousRepository.findAll();
    }

    public RendezVous getById(Long id) {
        return rendezVousRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable avec l'ID: " + id));
    }

    public RendezVous create(RendezVous rendezVous) {
        // Valider les données
        validateRendezVous(rendezVous);

        // Vérifier les conflits d'horaires
        if (hasTimeConflict(rendezVous)) {
            throw new RuntimeException("Conflit d'horaire détecté. Un autre rendez-vous existe déjà à cette heure.");
        }

        // Récupérer le patient complet
        Patient patient = patientRepository.findById(rendezVous.getPatient().getId())
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        rendezVous.setPatient(patient);

        // Sauvegarder le RDV principal
        RendezVous savedRendezVous = rendezVousRepository.save(rendezVous);

        if (rendezVous.isEstRecurrent()) {
            // 🔄 RDV récurrent : créer TOUS les RDV pour toutes les séances prévues
            createAllRecurringAppointments(savedRendezVous, patient);
        } else {
            // 🎯 RDV ponctuel : ajuster les RDV récurrents existants
            if (rendezVous.getType() == RendezVous.TypeRendezVous.SEANCE) {
                adjustRecurringAppointments(patient);
            }
        }

        return savedRendezVous;
    }

    public RendezVous update(Long id, RendezVous rendezVousDetails) {
        RendezVous rendezVous = getById(id);

        // Mettre à jour les champs
        rendezVous.setDateRendezVous(rendezVousDetails.getDateRendezVous());
        rendezVous.setHeureDebut(rendezVousDetails.getHeureDebut());
        rendezVous.setHeureFin(rendezVousDetails.getHeureFin());
        rendezVous.setType(rendezVousDetails.getType());
        rendezVous.setStatut(rendezVousDetails.getStatut());
        rendezVous.setNotes(rendezVousDetails.getNotes());
        rendezVous.setEstRecurrent(rendezVousDetails.isEstRecurrent());

        // Mettre à jour le patient si changé
        if (rendezVousDetails.getPatient() != null &&
                !rendezVous.getPatient().getId().equals(rendezVousDetails.getPatient().getId())) {
            Patient patient = patientRepository.findById(rendezVousDetails.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient introuvable"));
            rendezVous.setPatient(patient);
        }

        // Valider les modifications
        validateRendezVous(rendezVous);

        // Vérifier les conflits d'horaires (en excluant le rendez-vous actuel)
        if (hasTimeConflictExcluding(rendezVous, id)) {
            throw new RuntimeException("Conflit d'horaire détecté. Un autre rendez-vous existe déjà à cette heure.");
        }

        return rendezVousRepository.save(rendezVous);
    }

    public void delete(Long id) {
        RendezVous rendezVous = getById(id);
        rendezVousRepository.delete(rendezVous);
    }

    // Recherche et filtrage
    public List<RendezVous> getByDate(LocalDate date) {
        return rendezVousRepository.findByDateRendezVousOrderByHeureDebutAsc(date);
    }

    public List<RendezVous> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        System.out.println("🔍 Service getByDateRange:");
        System.out.println("📅 Recherche du " + dateDebut + " au " + dateFin);

        List<RendezVous> results = rendezVousRepository.findByDateRendezVousBetweenOrderByDateRendezVousAscHeureDebutAsc(
                dateDebut, dateFin);

        System.out.println("📊 Repository a retourné: " + results.size() + " RDV");

        return results;
    }

    public List<RendezVous> getByPatient(Long patientId) {
        return rendezVousRepository.findByPatientIdOrderByDateRendezVousDescHeureDebutDesc(patientId);
    }

    public List<RendezVous> getByStatut(RendezVous.StatutRendezVous statut) {
        return rendezVousRepository.findByStatutOrderByDateRendezVousAscHeureDebutAsc(statut);
    }

    public List<RendezVous> getByType(RendezVous.TypeRendezVous type) {
        return rendezVousRepository.findByTypeOrderByDateRendezVousAscHeureDebutAsc(type);
    }

    public List<RendezVous> searchByPatientName(String query) {
        return rendezVousRepository.searchByPatientName(query);
    }

    // Méthodes spécialisées
    public List<RendezVous> getTodayAppointments() {
        // ✅ Retourne uniquement les RDV actifs (non terminés, non annulés)
        return rendezVousRepository.findTodayAppointments();
    }

    // ✅ NOUVELLE MÉTHODE : Tous les RDV d'aujourd'hui (pour les modals)
    public List<RendezVous> getAllTodayAppointments() {
        return rendezVousRepository.findAllTodayAppointments();
    }

    public List<RendezVous> getCurrentWeekAppointments() {
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.FRANCE); // Semaine commence le lundi

        LocalDate startOfWeek = today.with(weekFields.dayOfWeek(), 1);
        LocalDate endOfWeek = today.with(weekFields.dayOfWeek(), 6); // Samedi

        return rendezVousRepository.findWeekAppointments(startOfWeek, endOfWeek);
    }

    public List<RendezVous> getWeekAppointments(LocalDate startOfWeek) {
        LocalDate endOfWeek = startOfWeek.plusDays(5); // Lundi à Samedi
        return rendezVousRepository.findWeekAppointments(startOfWeek, endOfWeek);
    }

    public List<RendezVous> getUpcomingAppointments() {
        return rendezVousRepository.findUpcomingAppointments();
    }

    public List<RendezVous> getOverdueAppointments() {
        return rendezVousRepository.findOverdueAppointments();
    }

    public List<RendezVous> getRecurringAppointments() {
        return rendezVousRepository.findByEstRecurrentTrueOrderByDateRendezVousAsc();
    }

    // Statistiques
    public long countByStatut(RendezVous.StatutRendezVous statut) {
        return rendezVousRepository.countByStatut(statut);
    }

    public long countByDate(LocalDate date) {
        return rendezVousRepository.countByDateRendezVous(date);
    }

    // Gestion des statuts
    @Transactional
    public RendezVous confirmerRendezVous(Long id) {
        RendezVous rendezVous = getById(id);
        rendezVous.setStatut(RendezVous.StatutRendezVous.CONFIRME);
        return rendezVousRepository.save(rendezVous);
    }

    @Transactional
    public RendezVous commencerRendezVous(Long id) {
        RendezVous rendezVous = getById(id);
        rendezVous.setStatut(RendezVous.StatutRendezVous.EN_COURS);
        return rendezVousRepository.save(rendezVous);
    }

    @Transactional
    public RendezVous terminerRendezVous(Long id) {
        RendezVous rendezVous = getById(id);
        rendezVous.setStatut(RendezVous.StatutRendezVous.TERMINE);

        // 🎯 LOGIQUE INTELLIGENTE : Quand une séance est terminée
        if (rendezVous.getType() == RendezVous.TypeRendezVous.SEANCE) {
            Patient patient = rendezVous.getPatient();

            // Incrémenter le compteur de séances effectuées
            if (patient.getSeancesEffectuees() == null) {
                patient.setSeancesEffectuees(0);
            }
            patient.setSeancesEffectuees(patient.getSeancesEffectuees() + 1);

            // Mettre à jour le statut du patient
            updatePatientStatus(patient);
            patientRepository.save(patient);

            // 🔄 Ajuster automatiquement les RDV récurrents
            handleRecurringLogicAfterSession(patient);
        }

        return rendezVousRepository.save(rendezVous);
    }

    @Transactional
    public RendezVous annulerRendezVous(Long id) {
        RendezVous rendezVous = getById(id);
        rendezVous.setStatut(RendezVous.StatutRendezVous.ANNULE);
        return rendezVousRepository.save(rendezVous);
    }

    @Transactional
    public RendezVous reporterRendezVous(Long id, LocalDate nouvelleDate, LocalTime nouvelleHeure) {
        RendezVous rendezVous = getById(id);

        // Calculer la durée du rendez-vous
        long dureeMinutes = java.time.Duration.between(rendezVous.getHeureDebut(), rendezVous.getHeureFin()).toMinutes();

        // Définir les nouvelles heures
        rendezVous.setDateRendezVous(nouvelleDate);
        rendezVous.setHeureDebut(nouvelleHeure);
        rendezVous.setHeureFin(nouvelleHeure.plusMinutes(dureeMinutes));
        rendezVous.setStatut(RendezVous.StatutRendezVous.REPORTE);

        // Vérifier les conflits avec les nouvelles heures
        if (hasTimeConflictExcluding(rendezVous, id)) {
            throw new RuntimeException("Conflit d'horaire pour la nouvelle date/heure.");
        }

        return rendezVousRepository.save(rendezVous);
    }

    // 🔄 LOGIQUE INTELLIGENTE : Créer TOUS les RDV récurrents
    private void createAllRecurringAppointments(RendezVous firstRendezVous, Patient patient) {
        int seancesTotales = patient.getSeancesPrevues() != null ? patient.getSeancesPrevues() : 0;

        // ✅ CORRECTION FINALE: Créer RDV pour TOUTES les séances prévues (indépendamment des effectuées)
        int rdvTotauxACreer = seancesTotales - 1; // -1 car le premier RDV existe déjà

        System.out.println("🎯 Patient: " + patient.getPrenom() + " " + patient.getNom());
        System.out.println("📊 Séances prévues: " + seancesTotales);
        System.out.println("🔄 RDV récurrents à créer: " + rdvTotauxACreer + " (+ 1 RDV initial = " + seancesTotales + " total)");

        if (rdvTotauxACreer <= 0) {
            System.out.println("⚠️ Pas de RDV récurrents à créer");
            return;
        }

        LocalDate currentDate = firstRendezVous.getDateRendezVous();
        int rdvCrees = 0;

        for (int i = 1; i <= rdvTotauxACreer; i++) {
            currentDate = currentDate.plusWeeks(1); // Chaque semaine

            // Vérifier les conflits
            List<RendezVous> conflicts = rendezVousRepository.findConflictingAppointments(
                    currentDate,
                    firstRendezVous.getHeureDebut(),
                    firstRendezVous.getHeureFin(),
                    -1L
            );

            if (conflicts.isEmpty()) {
                RendezVous recurringRendezVous = RendezVous.builder()
                        .patient(patient)
                        .dateRendezVous(currentDate)
                        .heureDebut(firstRendezVous.getHeureDebut())
                        .heureFin(firstRendezVous.getHeureFin())
                        .type(firstRendezVous.getType())
                        .notes("RDV récurrent - Séance " + (i + 1) + "/" + seancesTotales)
                        .estRecurrent(true)
                        .statut(RendezVous.StatutRendezVous.PLANIFIE)
                        .build();

                rendezVousRepository.save(recurringRendezVous);
                rdvCrees++;
                System.out.println("✅ RDV " + (i + 1) + " créé pour le " + currentDate);
            } else {
                System.out.println("⚠️ Conflit pour le " + currentDate + " - RDV non créé");
            }
        }

        System.out.println("🎯 Résumé: " + rdvCrees + " RDV récurrents créés");
    }

    // 🎯 LOGIQUE INTELLIGENTE : Ajuster les RDV récurrents quand un RDV ponctuel est ajouté
    private void adjustRecurringAppointments(Patient patient) {
        System.out.println("🎯 Ajustement RDV récurrents pour " + patient.getPrenom() + " " + patient.getNom());

        // Compter tous les RDV de type SEANCE pour ce patient
        List<RendezVous> tousLesRdvSeances = rendezVousRepository.findByPatientIdAndType(
                patient.getId(), RendezVous.TypeRendezVous.SEANCE);

        // Récupérer les RDV récurrents futurs
        List<RendezVous> rdvRecurrentsFuturs = rendezVousRepository.findFutureRecurringAppointments(
                patient.getId(), LocalDate.now());

        int seancesTotales = patient.getSeancesPrevues() != null ? patient.getSeancesPrevues() : 0;
        int rdvTotaux = tousLesRdvSeances.size();
        int rdvRecurrentsASupprimer = rdvTotaux - seancesTotales;

        System.out.println("📊 RDV séances totaux: " + rdvTotaux + ", Séances prévues: " + seancesTotales);

        if (rdvRecurrentsASupprimer > 0 && !rdvRecurrentsFuturs.isEmpty()) {
            System.out.println("🗑️ Suppression de " + rdvRecurrentsASupprimer + " RDV récurrents");

            // Supprimer les derniers RDV récurrents (plus éloignés dans le temps)
            rdvRecurrentsFuturs.stream()
                    .sorted((a, b) -> b.getDateRendezVous().compareTo(a.getDateRendezVous()))
                    .limit(rdvRecurrentsASupprimer)
                    .forEach(rdv -> {
                        System.out.println("🗑️ Suppression RDV récurrent du " + rdv.getDateRendezVous());
                        rendezVousRepository.delete(rdv);
                    });
        }
    }

    // 🔄 LOGIQUE INTELLIGENTE : Gérer les RDV récurrents après une séance terminée
    private void handleRecurringLogicAfterSession(Patient patient) {
        int seancesTotales = patient.getSeancesPrevues() != null ? patient.getSeancesPrevues() : 0;
        int seancesEffectuees = patient.getSeancesEffectuees() != null ? patient.getSeancesEffectuees() : 0;
        int seancesRestantes = seancesTotales - seancesEffectuees;

        System.out.println("🔄 Après séance terminée - Patient: " + patient.getPrenom() + " " + patient.getNom());
        System.out.println("📊 Séances: " + seancesEffectuees + "/" + seancesTotales + " (restantes: " + seancesRestantes + ")");

        // Récupérer tous les RDV FUTURS (non terminés, non annulés) de ce patient
        List<RendezVous> rdvFuturs = rendezVousRepository.findFutureAppointmentsForPatient(
                patient.getId(), LocalDate.now());

        System.out.println("📅 RDV futurs trouvés: " + rdvFuturs.size());

        // Si il y a plus de RDV futurs que de séances restantes, en supprimer
        int rdvASupprimer = rdvFuturs.size() - seancesRestantes;

        if (rdvASupprimer > 0) {
            System.out.println("🗑️ Suppression de " + rdvASupprimer + " RDV en trop");

            // Prioriser la suppression des RDV récurrents les plus éloignés
            List<RendezVous> rdvRecurrentsFuturs = rdvFuturs.stream()
                    .filter(RendezVous::isEstRecurrent)
                    .sorted((a, b) -> b.getDateRendezVous().compareTo(a.getDateRendezVous()))
                    .toList();

            // Supprimer d'abord les RDV récurrents
            int supprimesRecurrents = 0;
            for (RendezVous rdv : rdvRecurrentsFuturs) {
                if (supprimesRecurrents >= rdvASupprimer) break;

                System.out.println("🗑️ Suppression RDV récurrent du " + rdv.getDateRendezVous());
                rendezVousRepository.delete(rdv);
                supprimesRecurrents++;
            }

            // Si pas assez de RDV récurrents, supprimer des ponctuels
            if (supprimesRecurrents < rdvASupprimer) {
                List<RendezVous> rdvPonctuelsFuturs = rdvFuturs.stream()
                        .filter(rdv -> !rdv.isEstRecurrent())
                        .sorted((a, b) -> b.getDateRendezVous().compareTo(a.getDateRendezVous()))
                        .limit(rdvASupprimer - supprimesRecurrents)
                        .toList();

                for (RendezVous rdv : rdvPonctuelsFuturs) {
                    System.out.println("🗑️ Suppression RDV ponctuel du " + rdv.getDateRendezVous());
                    rendezVousRepository.delete(rdv);
                }
            }
        } else {
            System.out.println("✅ Nombre de RDV futurs correct (" + rdvFuturs.size() + " pour " + seancesRestantes + " séances restantes)");
        }
    }

    // Méthodes de validation
    private void validateRendezVous(RendezVous rendezVous) {
        if (rendezVous.getDateRendezVous() == null) {
            throw new RuntimeException("La date du rendez-vous est obligatoire");
        }

        if (rendezVous.getHeureDebut() == null) {
            throw new RuntimeException("L'heure de début est obligatoire");
        }

        if (rendezVous.getHeureFin() == null) {
            throw new RuntimeException("L'heure de fin est obligatoire");
        }

        if (rendezVous.getPatient() == null || rendezVous.getPatient().getId() == null) {
            throw new RuntimeException("Le patient est obligatoire");
        }

        if (rendezVous.getHeureDebut().isAfter(rendezVous.getHeureFin()) ||
                rendezVous.getHeureDebut().equals(rendezVous.getHeureFin())) {
            throw new RuntimeException("L'heure de fin doit être après l'heure de début");
        }
        /*
        // Vérifier que le rendez-vous ne soit pas dans le passé (sauf pour modification)
        LocalDate today = LocalDate.now();
        if (rendezVous.getDateRendezVous().isBefore(today)) {
            throw new RuntimeException("Impossible de créer un rendez-vous dans le passé");
        }*/
    }

    private boolean hasTimeConflict(RendezVous rendezVous) {
        List<RendezVous> conflicts = rendezVousRepository.findConflictingAppointments(
                rendezVous.getDateRendezVous(),
                rendezVous.getHeureDebut(),
                rendezVous.getHeureFin(),
                -1L // Pas d'exclusion pour un nouveau rendez-vous
        );
        return !conflicts.isEmpty();
    }

    private boolean hasTimeConflictExcluding(RendezVous rendezVous, Long excludeId) {
        List<RendezVous> conflicts = rendezVousRepository.findConflictingAppointments(
                rendezVous.getDateRendezVous(),
                rendezVous.getHeureDebut(),
                rendezVous.getHeureFin(),
                excludeId
        );
        return !conflicts.isEmpty();
    }

    private void updatePatientStatus(Patient patient) {
        if (patient.getSeancesEffectuees() >= patient.getSeancesPrevues()) {
            patient.setStatut("inactif");
        } else if (patient.getSeancesEffectuees() > 0) {
            patient.setStatut("actif");
        }
    }
}