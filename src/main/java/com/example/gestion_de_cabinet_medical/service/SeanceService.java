package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.entity.RendezVous;
import com.example.gestion_de_cabinet_medical.entity.Seance;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import com.example.gestion_de_cabinet_medical.repository.SeanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SeanceService {

    private final SeanceRepository seanceRepository;
    private final PatientRepository patientRepository;

    // ===== CRUD OPERATIONS =====

    public List<Seance> getAll() {
        return seanceRepository.findAll();
    }

    public Seance getById(Long id) {
        return seanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Séance introuvable avec l'ID: " + id));
    }

    public Seance create(Seance seance) {
        // Validation
        validateSeance(seance);

        log.info("Création d'une nouvelle séance pour le patient {}: {}",
                seance.getNomCompletPatient(), seance.getType().getLibelle());

        Seance savedSeance = seanceRepository.save(seance);

        // ✅ MISE À JOUR DU COMPTEUR : Seulement si c'est une SEANCE
        if (seance.compteCommeSeanceEffectuee()) {
            updatePatientSeancesEffectuees(seance.getPatient().getId());
            log.info("✅ Séance comptabilisée pour le patient {}", seance.getNomCompletPatient());
        } else {
            log.info("ℹ️ Séance de type {} non comptabilisée pour le patient {}",
                    seance.getType().getLibelle(), seance.getNomCompletPatient());
        }

        return savedSeance;
    }

    public Seance update(Long id, Seance seanceDetails) {
        Seance seance = getById(id);
        Seance.TypeSeance oldType = seance.getType();

        // Mise à jour des champs
        seance.setDateSeance(seanceDetails.getDateSeance());
        seance.setHeureDebut(seanceDetails.getHeureDebut());
        seance.setHeureFin(seanceDetails.getHeureFin());
        seance.setType(seanceDetails.getType());
        seance.setObservations(seanceDetails.getObservations());

        validateSeance(seance);

        Seance savedSeance = seanceRepository.save(seance);

        // ✅ RECALCUL si le type a changé
        if (oldType != seanceDetails.getType()) {
            updatePatientSeancesEffectuees(seance.getPatient().getId());
            log.info("🔄 Recalcul des séances effectuées suite au changement de type: {} → {}",
                    oldType.getLibelle(), seanceDetails.getType().getLibelle());
        }

        return savedSeance;
    }

    public void delete(Long id) {
        Seance seance = getById(id);
        Long patientId = seance.getPatient().getId();
        boolean comptait = seance.compteCommeSeanceEffectuee();

        log.info("Suppression de la séance ID {}: {}", id, seance.getType().getLibelle());
        seanceRepository.delete(seance);

        // ✅ RECALCUL si la séance comptait
        if (comptait) {
            updatePatientSeancesEffectuees(patientId);
            log.info("🔄 Recalcul des séances effectuées suite à la suppression");
        }
    }

    // ===== CRÉATION DEPUIS RENDEZ-VOUS =====

    /**
     * Crée une séance à partir d'un rendez-vous confirmé
     */
    @Transactional
    public Seance createFromRendezVous(RendezVous rendezVous, String observations) {
        log.info("🎯 Création de séance depuis RDV confirmé: {} - {}",
                rendezVous.getNomCompletPatient(), rendezVous.getType().name());

        // Vérifier qu'une séance n'existe pas déjà pour ce RDV
        if (seanceRepository.existsByRendezVousId(rendezVous.getId())) {
            throw new RuntimeException("Une séance existe déjà pour ce rendez-vous");
        }

        // Mapper le type de RDV vers le type de séance
        Seance.TypeSeance typeSeance = mapTypeRendezVousToSeance(rendezVous.getType());

        // Créer la séance
        Seance seance = Seance.builder()
                .patient(rendezVous.getPatient())
                .rendezVous(rendezVous)
                .dateSeance(rendezVous.getDateRendezVous())
                .heureDebut(rendezVous.getHeureDebut())
                .heureFin(rendezVous.getHeureFin())
                .type(typeSeance)
                .observations(observations)
                .createdBy("Mekouar Zineb") // Par défaut
                .build();

        return create(seance);
    }

    // ✅ MAPPING SIMPLIFIÉ : RDV → Séance
    private Seance.TypeSeance mapTypeRendezVousToSeance(RendezVous.TypeRendezVous typeRdv) {
        switch (typeRdv) {
            case SEANCE:
                return Seance.TypeSeance.SEANCE;           // ✅ Seule à compter
            case ANAMNESE:
                return Seance.TypeSeance.ANAMNESE;         // ❌ Ne compte pas
            case COMPTE_RENDU:
                return Seance.TypeSeance.BILAN;            // ❌ Ne compte pas
            default:
                return Seance.TypeSeance.SEANCE;           // Par défaut
        }
    }

    // ===== RÉCUPÉRATION PAR PATIENT =====

    public List<Seance> getSeancesByPatient(Long patientId) {
        return seanceRepository.findByPatientIdOrderByDateSeanceDescHeureDebutDesc(patientId);
    }

    public List<Seance> getSeancesByPatientAndType(Long patientId, Seance.TypeSeance type) {
        return seanceRepository.findByPatientIdAndTypeOrderByDateSeanceDescHeureDebutDesc(patientId, type);
    }

    public List<Seance> getLastSeancesForPatient(Long patientId, int limit) {
        return seanceRepository.findLastSessionsForPatient(patientId, limit);
    }

    // ===== RÉCUPÉRATION PAR DATE =====

    public List<Seance> getSeancesAujourdHui() {
        return seanceRepository.findTodaySessions();
    }

    public List<Seance> getSeancesByDate(LocalDate date) {
        return seanceRepository.findByDateSeanceOrderByHeureDebutAsc(date);
    }

    public List<Seance> getSeancesByPeriod(LocalDate dateDebut, LocalDate dateFin) {
        return seanceRepository.findByDateSeanceBetweenOrderByDateSeanceAscHeureDebutAsc(dateDebut, dateFin);
    }

    public List<Seance> getSeancesRecentes() {
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        return seanceRepository.findRecentSessions(sevenDaysAgo);
    }

    // ===== RÉCUPÉRATION PAR TYPE =====

    public List<Seance> getSeancesByType(Seance.TypeSeance type) {
        return seanceRepository.findByTypeOrderByDateSeanceDescHeureDebutDesc(type);
    }

    // ===== STATISTIQUES =====

    public Long countSeancesEffectueesForPatient(Long patientId) {
        return seanceRepository.countSeancesEffectueesForPatient(patientId);
    }

    public Long countAllSeancesForPatient(Long patientId) {
        return seanceRepository.countByPatientId(patientId);
    }

    public Long countSeancesAujourdHui() {
        return seanceRepository.countTodaySessions();
    }

    public Long countSeancesMoisCourant() {
        return seanceRepository.countCurrentMonthSessions();
    }

    public List<Object[]> getStatsByTypeForPatient(Long patientId) {
        return seanceRepository.countSessionsByTypeForPatient(patientId);
    }

    public List<Object[]> getStatsAujourdHuiByType() {
        return seanceRepository.countTodaySessionsByType();
    }

    public Double getAverageSessionDurationForPatient(Long patientId) {
        return seanceRepository.getAverageSessionDurationForPatient(patientId);
    }

    public List<Object[]> getTopPatientsWithMostSessions() {
        return seanceRepository.findTopPatientsWithMostSessions();
    }

    // ===== RECHERCHE =====

    public List<Seance> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return seanceRepository.findTop10ByOrderByCreatedAtDesc();
        }
        return seanceRepository.searchByObservations(query.trim());
    }

    // ===== MÉTHODES UTILITAIRES PRIVÉES =====

    /**
     * Met à jour le compteur de séances effectuées d'un patient
     * Seules les séances de type SEANCE comptent
     */
    @Transactional
    public void updatePatientSeancesEffectuees(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + patientId));

        // ✅ COMPTER SEULEMENT LES SÉANCES DE TYPE "SEANCE"
        Long seancesEffectuees = seanceRepository.countSeancesEffectueesForPatient(patientId);

        log.debug("🔢 Patient {}: {} séances effectuées comptabilisées",
                patient.getNomComplet(), seancesEffectuees);

        // Mise à jour du patient
        patient.setSeancesEffectuees(seancesEffectuees.intValue());

        // Mise à jour du statut du patient
        updatePatientStatus(patient);

        patientRepository.save(patient);

        log.info("📊 Patient {} mis à jour: {}/{} séances (statut: {})",
                patient.getNomComplet(),
                patient.getSeancesEffectuees(),
                patient.getSeancesPrevues(),
                patient.getStatut());
    }

    private void updatePatientStatus(Patient patient) {
        Integer effectuees = patient.getSeancesEffectuees() != null ? patient.getSeancesEffectuees() : 0;
        Integer prevues = patient.getSeancesPrevues() != null ? patient.getSeancesPrevues() : 0;

        if (effectuees >= prevues && prevues > 0) {
            patient.setStatut("inactif");
        } else if (effectuees > 0) {
            patient.setStatut("actif");
        } else {
            patient.setStatut("nouveau");
        }
    }

    private void validateSeance(Seance seance) {
        if (seance.getPatient() == null || seance.getPatient().getId() == null) {
            throw new RuntimeException("Le patient est obligatoire");
        }
        if (seance.getDateSeance() == null) {
            throw new RuntimeException("La date de la séance est obligatoire");
        }
        if (seance.getHeureDebut() == null) {
            throw new RuntimeException("L'heure de début est obligatoire");
        }
        if (seance.getHeureFin() == null) {
            throw new RuntimeException("L'heure de fin est obligatoire");
        }
        if (seance.getHeureDebut().isAfter(seance.getHeureFin()) ||
                seance.getHeureDebut().equals(seance.getHeureFin())) {
            throw new RuntimeException("L'heure de fin doit être après l'heure de début");
        }
        if (seance.getType() == null) {
            throw new RuntimeException("Le type de séance est obligatoire");
        }
    }

    // ===== CRÉATIONS RAPIDES =====

    public Seance createSeanceManuelle(Long patientId, LocalDate date, LocalTime heureDebut,
                                       LocalTime heureFin, Seance.TypeSeance type, String observations) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        Seance seance = Seance.builder()
                .patient(patient)
                .dateSeance(date)
                .heureDebut(heureDebut)
                .heureFin(heureFin)
                .type(type)
                .observations(observations)
                .createdBy("Mekouar Zineb")
                .build();

        return create(seance);
    }

    public List<Seance> getDernieresSeancesAjoutees() {
        return seanceRepository.findTop10ByOrderByCreatedAtDesc();
    }
}