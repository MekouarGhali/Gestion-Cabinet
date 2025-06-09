package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Anamnese;
import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.repository.AnamneseRepository;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AnamneseService {

    private final AnamneseRepository anamneseRepository;
    private final PatientRepository patientRepository;

    // === OPÉRATIONS CRUD ===

    public List<Anamnese> getAll() {
        return anamneseRepository.findAllWithPatientInfo();
    }

    public Anamnese getById(Long id) {
        return anamneseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anamnèse introuvable avec l'ID: " + id));
    }

    public Anamnese getByNumAnamnese(String numAnamnese) {
        return anamneseRepository.findByNumAnamnese(numAnamnese)
                .orElseThrow(() -> new RuntimeException("Anamnèse introuvable avec le numéro: " + numAnamnese));
    }

    public Anamnese create(Anamnese anamnese) {
        log.info("Création d'une nouvelle anamnèse pour le patient: {}", anamnese.getNomPrenom());

        // Valider les données
        validateAnamnese(anamnese);

        // Générer le numéro d'anamnèse si pas fourni
        if (anamnese.getNumAnamnese() == null || anamnese.getNumAnamnese().isEmpty()) {
            anamnese.setNumAnamnese(generateNextNumAnamnese());
        } else {
            // Vérifier l'unicité du numéro fourni
            if (anamneseRepository.existsByNumAnamnese(anamnese.getNumAnamnese())) {
                throw new RuntimeException("Le numéro d'anamnèse '" + anamnese.getNumAnamnese() + "' existe déjà");
            }
        }

        // Associer le patient si fourni
        if (anamnese.getPatient() != null && anamnese.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(anamnese.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + anamnese.getPatient().getId()));

            anamnese.setPatient(patient);

            // Synchroniser les informations du patient
            if (anamnese.getNomPrenom() == null || anamnese.getNomPrenom().isEmpty()) {
                anamnese.setNomPrenom(patient.getPrenom() + " " + patient.getNom());
            }
            if (anamnese.getDateNaissance() == null) {
                anamnese.setDateNaissance(patient.getDateNaissance());
            }
        }

        // ✅ AJOUT : Déterminer automatiquement le statut
        anamnese.setStatut(anamnese.determinerStatutAutomatique());

        Anamnese savedAnamnese = anamneseRepository.save(anamnese);
        log.info("Anamnèse créée avec succès: {} - Statut: {}",
                savedAnamnese.getNumAnamnese(), savedAnamnese.getStatut());

        return savedAnamnese;
    }

    public Anamnese update(Long id, Anamnese anamneseDetails) {
        log.info("Mise à jour de l'anamnèse ID: {}", id);

        Anamnese anamnese = getById(id);

        // Valider les données
        validateAnamnese(anamneseDetails);

        // Vérifier l'unicité du numéro si modifié
        if (!anamnese.getNumAnamnese().equals(anamneseDetails.getNumAnamnese())) {
            if (anamneseRepository.existsByNumAnamnese(anamneseDetails.getNumAnamnese())) {
                throw new RuntimeException("Le numéro d'anamnèse '" + anamneseDetails.getNumAnamnese() + "' existe déjà");
            }
        }

        // Mettre à jour les champs de base
        anamnese.setNumAnamnese(anamneseDetails.getNumAnamnese());
        anamnese.setDateEntretien(anamneseDetails.getDateEntretien());
        anamnese.setNomPrenom(anamneseDetails.getNomPrenom());
        anamnese.setDateNaissance(anamneseDetails.getDateNaissance());
        anamnese.setAdressePar(anamneseDetails.getAdressePar());
        anamnese.setMotifConsultation(anamneseDetails.getMotifConsultation());
        anamnese.setReeducationAnterieure(anamneseDetails.getReeducationAnterieure());

        // Mettre à jour le patient si changé
        if (anamneseDetails.getPatient() != null && anamneseDetails.getPatient().getId() != null) {
            if (anamnese.getPatient() == null ||
                    !anamnese.getPatient().getId().equals(anamneseDetails.getPatient().getId())) {

                Patient patient = patientRepository.findById(anamneseDetails.getPatient().getId())
                        .orElseThrow(() -> new RuntimeException("Patient introuvable"));
                anamnese.setPatient(patient);
            }
        }

        // Mettre à jour les informations structurées
        anamnese.setParents(anamneseDetails.getParents());
        anamnese.setConsanguinite(anamneseDetails.getConsanguinite());
        anamnese.setFraterie(anamneseDetails.getFraterie());
        anamnese.setGrossesse(anamneseDetails.getGrossesse());
        anamnese.setAccouchement(anamneseDetails.getAccouchement());
        anamnese.setAllaitement(anamneseDetails.getAllaitement());
        anamnese.setDeveloppement(anamneseDetails.getDeveloppement());
        anamnese.setLangage(anamneseDetails.getLangage());
        anamnese.setComportement(anamneseDetails.getComportement());
        anamnese.setDivers(anamneseDetails.getDivers());
        anamnese.setAntecedents(anamneseDetails.getAntecedents());
        anamnese.setObservations(anamneseDetails.getObservations());

        // ✅ MODIFICATION : Déterminer le statut automatiquement OU garder le statut fourni
        Anamnese.StatutAnamnese statutAutomatique = anamnese.determinerStatutAutomatique();
        if (anamneseDetails.getStatut() != null) {
            // Si l'utilisateur a fourni un statut, le conserver
            anamnese.setStatut(anamneseDetails.getStatut());
        } else {
            // Sinon, utiliser le statut automatique
            anamnese.setStatut(statutAutomatique);
        }

        Anamnese updatedAnamnese = anamneseRepository.save(anamnese);
        log.info("Anamnèse mise à jour avec succès: {} - Statut: {}",
                updatedAnamnese.getNumAnamnese(), updatedAnamnese.getStatut());

        return updatedAnamnese;
    }

    public void delete(Long id) {
        log.info("Suppression de l'anamnèse ID: {}", id);

        Anamnese anamnese = getById(id);
        anamneseRepository.delete(anamnese);

        log.info("Anamnèse supprimée avec succès: {}", anamnese.getNumAnamnese());
    }

    // === RECHERCHE ET FILTRAGE ===

    public List<Anamnese> getByPatient(Long patientId) {
        return anamneseRepository.findByPatientIdOrderByDateCreationDesc(patientId);
    }

    public List<Anamnese> getByStatut(Anamnese.StatutAnamnese statut) {
        return anamneseRepository.findByStatutOrderByDateCreationDesc(statut);
    }

    public List<Anamnese> getByDateEntretien(LocalDate date) {
        return anamneseRepository.findByDateEntretienOrderByDateCreationDesc(date);
    }

    public List<Anamnese> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return anamneseRepository.findByDateEntretienBetweenOrderByDateEntretienDesc(dateDebut, dateFin);
    }

    public List<Anamnese> searchByKeyword(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAll();
        }
        return anamneseRepository.searchByKeyword(query.trim());
    }

    public List<Anamnese> searchByPatientName(String nomPrenom) {
        return anamneseRepository.searchByPatientName(nomPrenom);
    }

    public List<Anamnese> getByAdressePar(String adressePar) {
        return anamneseRepository.findByAdresseParContainingIgnoreCaseOrderByDateCreationDesc(adressePar);
    }

    // === MÉTHODES SPÉCIALISÉES ===

    public List<Anamnese> getTodayAnamneses() {
        return anamneseRepository.findTodayAnamneses();
    }

    public List<Anamnese> getCurrentWeekAnamneses() {
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.FRANCE);

        LocalDate startOfWeek = today.with(weekFields.dayOfWeek(), 1);
        LocalDate endOfWeek = today.with(weekFields.dayOfWeek(), 7);

        return anamneseRepository.findWeekAnamneses(startOfWeek, endOfWeek);
    }

    public List<Anamnese> getRecentAnamneses() {
        return anamneseRepository.findRecentAnamneses();
    }

    public List<Anamnese> getIncompleteAnamneses() {
        return anamneseRepository.findIncompleteAnamneses();
    }

    public List<Anamnese> getByPatientAgeRange(int ageMin, int ageMax) {
        return anamneseRepository.findByPatientAgeRange(ageMin, ageMax);
    }

    // === STATISTIQUES ===

    public long countTotal() {
        return anamneseRepository.countTotal();
    }

    public long countByStatut(Anamnese.StatutAnamnese statut) {
        return anamneseRepository.countByStatut(statut);
    }

    public long countByMonth(int year, int month) {
        return anamneseRepository.countByMonth(year, month);
    }

    public Map<String, Long> getStatistiquesByStatut() {
        List<Object[]> results = anamneseRepository.getStatistiquesByStatut();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> ((Anamnese.StatutAnamnese) row[0]).getLibelle(),
                        row -> (Long) row[1]
                ));
    }

    public boolean patientHasAnamnese(Long patientId) {
        return anamneseRepository.existsByPatientId(patientId);
    }

    public long countByPatient(Long patientId) {
        return anamneseRepository.countByPatientId(patientId);
    }

    // === GESTION DES STATUTS (MODIFIÉS) ===

    @Transactional
    public Anamnese updateStatut(Long id, Anamnese.StatutAnamnese nouveauStatut) {
        log.info("Mise à jour du statut de l'anamnèse ID: {} vers {}", id, nouveauStatut);

        Anamnese anamnese = getById(id);
        anamnese.setStatut(nouveauStatut);

        Anamnese updatedAnamnese = anamneseRepository.save(anamnese);
        log.info("Statut mis à jour avec succès pour l'anamnèse: {}", updatedAnamnese.getNumAnamnese());

        return updatedAnamnese;
    }

    @Transactional
    public Anamnese marquerEnCours(Long id) {
        return updateStatut(id, Anamnese.StatutAnamnese.EN_COURS);
    }

    // ✅ MODIFICATION : Renommé de marquerComplete à marquerTermine pour harmonisation
    @Transactional
    public Anamnese marquerTermine(Long id) {
        return updateStatut(id, Anamnese.StatutAnamnese.TERMINE);
    }

    // ✅ SUPPRIMÉ : marquerEnAttente() pour s'harmoniser avec CompteRendu

    // === UTILITAIRES ===

    public String generateNextNumAnamnese() {
        // Trouver la dernière anamnèse créée
        return anamneseRepository.findLastCreated()
                .map(derniere -> {
                    String dernierNum = derniere.getNumAnamnese();
                    try {
                        // Extraire le numéro de la chaîne "AN-XXX"
                        int numero = Integer.parseInt(dernierNum.substring(3));
                        return String.format("AN-%03d", numero + 1);
                    } catch (Exception e) {
                        log.warn("Impossible d'extraire le numéro de: {}. Génération d'un nouveau numéro.", dernierNum);
                        return "AN-001";
                    }
                })
                .orElse("AN-001"); // Premier numéro si aucune anamnèse n'existe
    }

    public Anamnese createFromPatient(Long patientId) {
        log.info("Création d'une anamnèse à partir du patient ID: {}", patientId);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + patientId));

        Anamnese anamnese = Anamnese.builder()
                .numAnamnese(generateNextNumAnamnese())
                .dateEntretien(LocalDate.now())
                .nomPrenom(patient.getPrenom() + " " + patient.getNom())
                .dateNaissance(patient.getDateNaissance())
                .patient(patient)
                .statut(Anamnese.StatutAnamnese.EN_COURS) // ✅ MODIFICATION : Statut par défaut changé
                .build();

        return anamneseRepository.save(anamnese);
    }

    // === VALIDATION ===

    private void validateAnamnese(Anamnese anamnese) {
        if (anamnese.getDateEntretien() == null) {
            throw new IllegalArgumentException("La date d'entretien est obligatoire");
        }

        if (anamnese.getNomPrenom() == null || anamnese.getNomPrenom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom et prénom sont obligatoires");
        }

        if (anamnese.getDateNaissance() == null) {
            throw new IllegalArgumentException("La date de naissance est obligatoire");
        }

        // Vérifier que la date d'entretien n'est pas dans le futur
        if (anamnese.getDateEntretien().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date d'entretien ne peut pas être dans le futur");
        }

        // Vérifier que la date de naissance est cohérente
        if (anamnese.getDateNaissance().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de naissance ne peut pas être dans le futur");
        }

        if (anamnese.getDateNaissance().isAfter(anamnese.getDateEntretien())) {
            throw new IllegalArgumentException("La date de naissance ne peut pas être postérieure à la date d'entretien");
        }

        // Vérifier l'âge minimum (doit être logique pour une anamnèse)
        int age = LocalDate.now().getYear() - anamnese.getDateNaissance().getYear();
        if (age > 100) {
            throw new IllegalArgumentException("L'âge du patient semble incohérent");
        }
    }

    // === MÉTHODES D'EXPORT/IMPORT ===

    public List<Anamnese> getAnamnesesToExport(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut != null && dateFin != null) {
            return getByDateRange(dateDebut, dateFin);
        } else {
            return getAll();
        }
    }

    public Map<String, Object> getAnamneseStatistiques() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("total", countTotal());
        stats.put("enCours", countByStatut(Anamnese.StatutAnamnese.EN_COURS));
        stats.put("terminees", countByStatut(Anamnese.StatutAnamnese.TERMINE)); // ✅ MODIFICATION : Renommé
        stats.put("parStatut", getStatistiquesByStatut());
        stats.put("recentes", getRecentAnamneses().size());
        stats.put("incompletes", getIncompleteAnamneses().size());

        log.info("Statistiques générées: {}", stats);
        return stats;
    }

    // === MÉTHODES DE DUPLICATION ===

    @Transactional
    public Anamnese dupliquer(Long id) {
        log.info("Duplication de l'anamnèse ID: {}", id);

        Anamnese original = getById(id);

        Anamnese copie = Anamnese.builder()
                .numAnamnese(generateNextNumAnamnese())
                .dateEntretien(LocalDate.now())
                .nomPrenom(original.getNomPrenom())
                .dateNaissance(original.getDateNaissance())
                .adressePar(original.getAdressePar())
                .motifConsultation(original.getMotifConsultation())
                .reeducationAnterieure(original.getReeducationAnterieure())
                .statut(Anamnese.StatutAnamnese.EN_COURS) // ✅ MODIFICATION : Statut par défaut changé
                .patient(original.getPatient())
                .parents(original.getParents())
                .consanguinite(original.getConsanguinite())
                .fraterie(original.getFraterie())
                .grossesse(original.getGrossesse())
                .accouchement(original.getAccouchement())
                .allaitement(original.getAllaitement())
                .developpement(original.getDeveloppement())
                .langage(original.getLangage())
                .comportement(original.getComportement())
                .divers(original.getDivers())
                .antecedents(original.getAntecedents())
                .observations("Copie de l'anamnèse " + original.getNumAnamnese() +
                        (original.getObservations() != null ? "\n\n" + original.getObservations() : ""))
                .build();

        Anamnese nouvelleCopie = anamneseRepository.save(copie);
        log.info("Anamnèse dupliquée avec succès: {} -> {}", original.getNumAnamnese(), nouvelleCopie.getNumAnamnese());

        return nouvelleCopie;
    }

    // === MÉTHODES D'ARCHIVAGE ===

    public List<Anamnese> getAnamnesesArchivables(int nombreJours) {
        LocalDate dateLimite = LocalDate.now().minusDays(nombreJours);
        return anamneseRepository.findByDateEntretienBetweenOrderByDateEntretienDesc(
                        LocalDate.of(2000, 1, 1),
                        dateLimite
                ).stream()
                .filter(a -> a.getStatut() == Anamnese.StatutAnamnese.TERMINE) // ✅ MODIFICATION : Filtrer sur TERMINE
                .collect(Collectors.toList());
    }

    // === ASSOCIATION AUTOMATIQUE AVEC PATIENT ===

    @Transactional
    public Anamnese associerPatient(Long anamneseId, Long patientId) {
        log.info("Association de l'anamnèse ID: {} avec le patient ID: {}", anamneseId, patientId);

        Anamnese anamnese = getById(anamneseId);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + patientId));

        anamnese.setPatient(patient);

        // Synchroniser les informations si nécessaire
        if (anamnese.getNomPrenom() == null || anamnese.getNomPrenom().trim().isEmpty()) {
            anamnese.setNomPrenom(patient.getPrenom() + " " + patient.getNom());
        }
        if (anamnese.getDateNaissance() == null) {
            anamnese.setDateNaissance(patient.getDateNaissance());
        }

        Anamnese updatedAnamnese = anamneseRepository.save(anamnese);
        log.info("Association réussie: anamnèse {} avec patient {}",
                updatedAnamnese.getNumAnamnese(), patient.getPrenom() + " " + patient.getNom());

        return updatedAnamnese;
    }

    @Transactional
    public Anamnese dissocierPatient(Long anamneseId) {
        log.info("Dissociation de l'anamnèse ID: {} du patient", anamneseId);

        Anamnese anamnese = getById(anamneseId);
        anamnese.setPatient(null);

        Anamnese updatedAnamnese = anamneseRepository.save(anamnese);
        log.info("Dissociation réussie pour l'anamnèse: {}", updatedAnamnese.getNumAnamnese());

        return updatedAnamnese;
    }
}