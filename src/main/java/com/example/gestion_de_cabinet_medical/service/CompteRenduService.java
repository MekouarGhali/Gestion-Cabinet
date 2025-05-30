package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.CompteRendu;
import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.repository.CompteRenduRepository;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CompteRenduService {

    private final CompteRenduRepository compteRenduRepository;
    private final PatientRepository patientRepository;

    // === OPÉRATIONS CRUD ===

    public List<CompteRendu> getAll() {
        return compteRenduRepository.findAllWithPatientInfo();
    }

    public CompteRendu getById(Long id) {
        return compteRenduRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte rendu introuvable avec l'ID: " + id));
    }

    public CompteRendu getByNumCompteRendu(String numCompteRendu) {
        return compteRenduRepository.findByNumCompteRendu(numCompteRendu)
                .orElseThrow(() -> new RuntimeException("Compte rendu introuvable avec le numéro: " + numCompteRendu));
    }

    public CompteRendu create(CompteRendu compteRendu) {
        log.info("Création d'un nouveau compte rendu pour le patient: {}", compteRendu.getNomPatient());

        // Valider les données
        validateCompteRendu(compteRendu);

        // Générer le numéro de compte rendu si pas fourni
        if (compteRendu.getNumCompteRendu() == null || compteRendu.getNumCompteRendu().isEmpty()) {
            compteRendu.setNumCompteRendu(generateNextNumCompteRendu());
        } else {
            // Vérifier l'unicité du numéro fourni
            if (compteRenduRepository.existsByNumCompteRendu(compteRendu.getNumCompteRendu())) {
                throw new RuntimeException("Le numéro de compte rendu '" + compteRendu.getNumCompteRendu() + "' existe déjà");
            }
        }

        // Associer le patient si fourni
        if (compteRendu.getPatient() != null && compteRendu.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(compteRendu.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + compteRendu.getPatient().getId()));

            compteRendu.setPatient(patient);

            // Synchroniser les informations du patient
            if (compteRendu.getNomPatient() == null || compteRendu.getNomPatient().isEmpty()) {
                compteRendu.setNomPatient(patient.getPrenom() + " " + patient.getNom());
            }
            if (compteRendu.getDateNaissance() == null) {
                compteRendu.setDateNaissance(patient.getDateNaissance());
            }
        }

        // Initialiser les objets embeddables si null
        if (compteRendu.getContenu() == null) {
            compteRendu.setContenu(new CompteRendu.ContenuCompteRendu());
        }
        if (compteRendu.getBilan() == null) {
            compteRendu.setBilan(new CompteRendu.BilanPsychomoteur());
        }
        if (compteRendu.getTestsUtilises() == null) {
            compteRendu.setTestsUtilises(new ArrayList<>());
        }

        // Déterminer automatiquement le statut
        compteRendu.setStatut(compteRendu.determinerStatutAutomatique());

        CompteRendu savedCompteRendu = compteRenduRepository.save(compteRendu);
        log.info("Compte rendu créé avec succès: {} - Statut: {}",
                savedCompteRendu.getNumCompteRendu(), savedCompteRendu.getStatut());

        return savedCompteRendu;
    }

    public CompteRendu update(Long id, CompteRendu compteRenduDetails) {
        log.info("Mise à jour du compte rendu ID: {}", id);

        CompteRendu compteRendu = getById(id);

        // Valider les données
        validateCompteRendu(compteRenduDetails);

        // Vérifier l'unicité du numéro si modifié
        if (!compteRendu.getNumCompteRendu().equals(compteRenduDetails.getNumCompteRendu())) {
            if (compteRenduRepository.existsByNumCompteRendu(compteRenduDetails.getNumCompteRendu())) {
                throw new RuntimeException("Le numéro de compte rendu '" + compteRenduDetails.getNumCompteRendu() + "' existe déjà");
            }
        }

        // Mettre à jour les champs de base
        compteRendu.setNumCompteRendu(compteRenduDetails.getNumCompteRendu());
        compteRendu.setNomPatient(compteRenduDetails.getNomPatient());
        compteRendu.setDateNaissance(compteRenduDetails.getDateNaissance());
        compteRendu.setDateBilan(compteRenduDetails.getDateBilan());
        compteRendu.setNiveauScolaire(compteRenduDetails.getNiveauScolaire());
        compteRendu.setObservations(compteRenduDetails.getObservations());

        // Mettre à jour le patient si changé
        if (compteRenduDetails.getPatient() != null && compteRenduDetails.getPatient().getId() != null) {
            if (compteRendu.getPatient() == null ||
                    !compteRendu.getPatient().getId().equals(compteRenduDetails.getPatient().getId())) {

                Patient patient = patientRepository.findById(compteRenduDetails.getPatient().getId())
                        .orElseThrow(() -> new RuntimeException("Patient introuvable"));
                compteRendu.setPatient(patient);
            }
        }

        // Mettre à jour les tests utilisés
        compteRendu.setTestsUtilises(compteRenduDetails.getTestsUtilises());

        // Mettre à jour le contenu
        if (compteRenduDetails.getContenu() != null) {
            compteRendu.setContenu(compteRenduDetails.getContenu());
        }

        // Mettre à jour le bilan
        if (compteRenduDetails.getBilan() != null) {
            compteRendu.setBilan(compteRenduDetails.getBilan());
        }

        // Déterminer le statut automatiquement OU garder le statut fourni
        CompteRendu.StatutCompteRendu statutAutomatique = compteRendu.determinerStatutAutomatique();
        if (compteRenduDetails.getStatut() != null) {
            // Si l'utilisateur a fourni un statut, le conserver
            compteRendu.setStatut(compteRenduDetails.getStatut());
        } else {
            // Sinon, utiliser le statut automatique
            compteRendu.setStatut(statutAutomatique);
        }

        CompteRendu updatedCompteRendu = compteRenduRepository.save(compteRendu);
        log.info("Compte rendu mis à jour avec succès: {} - Statut: {}",
                updatedCompteRendu.getNumCompteRendu(), updatedCompteRendu.getStatut());

        return updatedCompteRendu;
    }

    public void delete(Long id) {
        log.info("Suppression du compte rendu ID: {}", id);

        CompteRendu compteRendu = getById(id);
        compteRenduRepository.delete(compteRendu);

        log.info("Compte rendu supprimé avec succès: {}", compteRendu.getNumCompteRendu());
    }

    // === RECHERCHE ET FILTRAGE ===

    public List<CompteRendu> getByPatient(Long patientId) {
        return compteRenduRepository.findByPatientIdOrderByDateCreationDesc(patientId);
    }

    public List<CompteRendu> getByStatut(CompteRendu.StatutCompteRendu statut) {
        return compteRenduRepository.findByStatutOrderByDateCreationDesc(statut);
    }

    public List<CompteRendu> getByDateBilan(LocalDate date) {
        return compteRenduRepository.findByDateBilanOrderByDateCreationDesc(date);
    }

    public List<CompteRendu> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return compteRenduRepository.findByDateBilanBetweenOrderByDateBilanDesc(dateDebut, dateFin);
    }

    public List<CompteRendu> searchByKeyword(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAll();
        }
        return compteRenduRepository.searchByKeyword(query.trim());
    }

    public List<CompteRendu> searchByPatientName(String nomPatient) {
        return compteRenduRepository.searchByPatientName(nomPatient);
    }

    public List<CompteRendu> getByNiveauScolaire(String niveauScolaire) {
        return compteRenduRepository.findByNiveauScolaireContainingIgnoreCaseOrderByDateCreationDesc(niveauScolaire);
    }

    public List<CompteRendu> getByTestUtilise(String testName) {
        return compteRenduRepository.findByTestUtilise(testName);
    }

    // === MÉTHODES SPÉCIALISÉES ===

    public List<CompteRendu> getTodayComptesRendus() {
        return compteRenduRepository.findTodayComptesRendus();
    }

    public List<CompteRendu> getCurrentWeekComptesRendus() {
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.FRANCE);

        LocalDate startOfWeek = today.with(weekFields.dayOfWeek(), 1);
        LocalDate endOfWeek = today.with(weekFields.dayOfWeek(), 7);

        return compteRenduRepository.findWeekComptesRendus(startOfWeek, endOfWeek);
    }

    public List<CompteRendu> getRecentComptesRendus() {
        return compteRenduRepository.findRecentComptesRendus();
    }

    public List<CompteRendu> getIncompleteComptesRendus() {
        return compteRenduRepository.findIncompleteComptesRendus();
    }

    public List<CompteRendu> getByPatientAgeRange(int ageMin, int ageMax) {
        return compteRenduRepository.findByPatientAgeRange(ageMin, ageMax);
    }

    public List<CompteRendu> getComptesRendusEnRetard(int nombreJours) {
        LocalDate dateLimite = LocalDate.now().minusDays(nombreJours);
        return compteRenduRepository.findEnRetard(dateLimite);
    }

    public List<CompteRendu> getTerminesInPeriod(LocalDate dateDebut, LocalDate dateFin) {
        return compteRenduRepository.findTerminesInPeriod(dateDebut, dateFin);
    }

    public List<CompteRendu> getATerminerCetteSemaine() {
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.FRANCE);

        LocalDate startOfWeek = today.with(weekFields.dayOfWeek(), 1);
        LocalDate endOfWeek = today.with(weekFields.dayOfWeek(), 7);

        return compteRenduRepository.findATerminerCetteSemaine(startOfWeek, endOfWeek);
    }

    // === STATISTIQUES ===

    public long countTotal() {
        return compteRenduRepository.countTotal();
    }

    public long countByStatut(CompteRendu.StatutCompteRendu statut) {
        return compteRenduRepository.countByStatut(statut);
    }

    public long countByMonth(int year, int month) {
        return compteRenduRepository.countByMonth(year, month);
    }

    public Map<String, Long> getStatistiquesByStatut() {
        List<Object[]> results = compteRenduRepository.getStatistiquesByStatut();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> ((CompteRendu.StatutCompteRendu) row[0]).getLibelle(),
                        row -> (Long) row[1]
                ));
    }

    public Map<String, Long> getDistributionParNiveauScolaire() {
        List<Object[]> results = compteRenduRepository.getDistributionParNiveauScolaire();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));
    }

    public Map<String, Long> getTestsLesPlusUtilises() {
        List<Object[]> results = compteRenduRepository.getTestsLesPlusUtilises();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));
    }

    public Double getMoyenneAgePatients() {
        return compteRenduRepository.getMoyenneAgePatients();
    }

    public boolean patientHasCompteRendu(Long patientId) {
        return compteRenduRepository.existsByPatientId(patientId);
    }

    public long countByPatient(Long patientId) {
        return compteRenduRepository.countByPatientId(patientId);
    }

    // === GESTION DES STATUTS ===

    @Transactional
    public CompteRendu updateStatut(Long id, CompteRendu.StatutCompteRendu nouveauStatut) {
        log.info("Mise à jour du statut du compte rendu ID: {} vers {}", id, nouveauStatut);

        CompteRendu compteRendu = getById(id);
        compteRendu.setStatut(nouveauStatut);

        CompteRendu updatedCompteRendu = compteRenduRepository.save(compteRendu);
        log.info("Statut mis à jour avec succès pour le compte rendu: {}", updatedCompteRendu.getNumCompteRendu());

        return updatedCompteRendu;
    }

    @Transactional
    public CompteRendu marquerEnCours(Long id) {
        return updateStatut(id, CompteRendu.StatutCompteRendu.EN_COURS);
    }

    @Transactional
    public CompteRendu marquerTermine(Long id) {
        return updateStatut(id, CompteRendu.StatutCompteRendu.TERMINE);
    }

    // === UTILITAIRES ===

    public String generateNextNumCompteRendu() {
        // Trouver le dernier compte rendu créé
        return compteRenduRepository.findLastCreated()
                .map(dernier -> {
                    String dernierNum = dernier.getNumCompteRendu();
                    try {
                        // Extraire le numéro de la chaîne "CR-XXX"
                        int numero = Integer.parseInt(dernierNum.substring(3));
                        return String.format("CR-%03d", numero + 1);
                    } catch (Exception e) {
                        log.warn("Impossible d'extraire le numéro de: {}. Génération d'un nouveau numéro.", dernierNum);
                        return "CR-001";
                    }
                })
                .orElse("CR-001"); // Premier numéro si aucun compte rendu n'existe
    }

    public CompteRendu createFromPatient(Long patientId) {
        log.info("Création d'un compte rendu à partir du patient ID: {}", patientId);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + patientId));

        CompteRendu compteRendu = CompteRendu.builder()
                .numCompteRendu(generateNextNumCompteRendu())
                .nomPatient(patient.getPrenom() + " " + patient.getNom())
                .dateNaissance(patient.getDateNaissance())
                .dateBilan(LocalDate.now())
                .niveauScolaire("") // À remplir
                .patient(patient)
                .statut(CompteRendu.StatutCompteRendu.EN_COURS) // Statut par défaut
                .testsUtilises(new ArrayList<>())
                .contenu(new CompteRendu.ContenuCompteRendu())
                .bilan(new CompteRendu.BilanPsychomoteur())
                .build();

        return compteRenduRepository.save(compteRendu);
    }

    // === VALIDATION ===

    private void validateCompteRendu(CompteRendu compteRendu) {
        if (compteRendu.getNomPatient() == null || compteRendu.getNomPatient().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du patient est obligatoire");
        }

        if (compteRendu.getDateNaissance() == null) {
            throw new IllegalArgumentException("La date de naissance est obligatoire");
        }

        if (compteRendu.getDateBilan() == null) {
            throw new IllegalArgumentException("La date du bilan est obligatoire");
        }

        if (compteRendu.getNiveauScolaire() == null || compteRendu.getNiveauScolaire().trim().isEmpty()) {
            throw new IllegalArgumentException("Le niveau scolaire est obligatoire");
        }

        // Vérifier que la date de naissance est cohérente
        if (compteRendu.getDateNaissance().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de naissance ne peut pas être dans le futur");
        }

        if (compteRendu.getDateNaissance().isAfter(compteRendu.getDateBilan())) {
            throw new IllegalArgumentException("La date de naissance ne peut pas être postérieure à la date du bilan");
        }

        // Vérifier l'âge minimum (doit être logique pour un bilan psychomoteur)
        int age = LocalDate.now().getYear() - compteRendu.getDateNaissance().getYear();
        if (age > 100) {
            throw new IllegalArgumentException("L'âge du patient semble incohérent");
        }
    }

    // === MÉTHODES D'EXPORT/IMPORT ===

    public List<CompteRendu> getComptesRendusToExport(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut != null && dateFin != null) {
            return getByDateRange(dateDebut, dateFin);
        } else {
            return getAll();
        }
    }

    public Map<String, Object> getCompteRenduStatistiques() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("total", countTotal());
        stats.put("enCours", countByStatut(CompteRendu.StatutCompteRendu.EN_COURS));
        stats.put("termines", countByStatut(CompteRendu.StatutCompteRendu.TERMINE));
        stats.put("parStatut", getStatistiquesByStatut());
        stats.put("recents", getRecentComptesRendus().size());
        stats.put("incomplets", getIncompleteComptesRendus().size());
        stats.put("enRetard", getComptesRendusEnRetard(30).size());
        stats.put("aTerminerCetteSemaine", getATerminerCetteSemaine().size());
        stats.put("distributionNiveauScolaire", getDistributionParNiveauScolaire());
        stats.put("testsLesPlusUtilises", getTestsLesPlusUtilises());
        stats.put("moyenneAge", getMoyenneAgePatients());

        log.info("Statistiques générées: {}", stats);
        return stats;
    }

    // === MÉTHODES DE DUPLICATION ===

    @Transactional
    public CompteRendu dupliquer(Long id) {
        log.info("Duplication du compte rendu ID: {}", id);

        CompteRendu original = getById(id);

        CompteRendu copie = CompteRendu.builder()
                .numCompteRendu(generateNextNumCompteRendu())
                .nomPatient(original.getNomPatient())
                .dateNaissance(original.getDateNaissance())
                .dateBilan(LocalDate.now())
                .niveauScolaire(original.getNiveauScolaire())
                .statut(CompteRendu.StatutCompteRendu.EN_COURS) // Nouveau statut par défaut
                .patient(original.getPatient())
                .testsUtilises(new ArrayList<>(original.getTestsUtilises() != null ? original.getTestsUtilises() : new ArrayList<>()))
                .contenu(cloneContenu(original.getContenu()))
                .bilan(cloneBilan(original.getBilan()))
                .observations("Copie du compte rendu " + original.getNumCompteRendu() +
                        (original.getObservations() != null ? "\n\n" + original.getObservations() : ""))
                .build();

        CompteRendu nouvelleCopie = compteRenduRepository.save(copie);
        log.info("Compte rendu dupliqué avec succès: {} -> {}", original.getNumCompteRendu(), nouvelleCopie.getNumCompteRendu());

        return nouvelleCopie;
    }

    private CompteRendu.ContenuCompteRendu cloneContenu(CompteRendu.ContenuCompteRendu original) {
        if (original == null) {
            return new CompteRendu.ContenuCompteRendu();
        }

        CompteRendu.ContenuCompteRendu copie = new CompteRendu.ContenuCompteRendu();
        copie.setPresentation(original.getPresentation());
        copie.setAnamnese(original.getAnamnese());
        copie.setComportement(original.getComportement());
        copie.setConclusion(original.getConclusion());
        copie.setProjetTherapeutique(original.getProjetTherapeutique());

        return copie;
    }

    private CompteRendu.BilanPsychomoteur cloneBilan(CompteRendu.BilanPsychomoteur original) {
        if (original == null) {
            return new CompteRendu.BilanPsychomoteur();
        }

        CompteRendu.BilanPsychomoteur copie = new CompteRendu.BilanPsychomoteur();
        copie.setSchemaCorporel(original.getSchemaCorporel());
        copie.setEspace(original.getEspace());
        copie.setTempsRythmes(original.getTempsRythmes());
        copie.setLateralite(original.getLateralite());
        copie.setGraphisme(original.getGraphisme());
        copie.setFonctionCognitive(original.getFonctionCognitive());
        copie.setEquipementMoteur(original.getEquipementMoteur());

        return copie;
    }

    // === MÉTHODES D'ARCHIVAGE ===

    public List<CompteRendu> getComptesRendusArchivables(int nombreJours) {
        LocalDate dateLimite = LocalDate.now().minusDays(nombreJours);
        return compteRenduRepository.findByDateBilanBetweenOrderByDateBilanDesc(
                        LocalDate.of(2000, 1, 1),
                        dateLimite
                ).stream()
                .filter(cr -> cr.getStatut() == CompteRendu.StatutCompteRendu.TERMINE)
                .collect(Collectors.toList());
    }

    // === ASSOCIATION AUTOMATIQUE AVEC PATIENT ===

    @Transactional
    public CompteRendu associerPatient(Long compteRenduId, Long patientId) {
        log.info("Association du compte rendu ID: {} avec le patient ID: {}", compteRenduId, patientId);

        CompteRendu compteRendu = getById(compteRenduId);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable avec l'ID: " + patientId));

        compteRendu.setPatient(patient);

        // Synchroniser les informations si nécessaire
        if (compteRendu.getNomPatient() == null || compteRendu.getNomPatient().trim().isEmpty()) {
            compteRendu.setNomPatient(patient.getPrenom() + " " + patient.getNom());
        }
        if (compteRendu.getDateNaissance() == null) {
            compteRendu.setDateNaissance(patient.getDateNaissance());
        }

        CompteRendu updatedCompteRendu = compteRenduRepository.save(compteRendu);
        log.info("Association réussie: compte rendu {} avec patient {}",
                updatedCompteRendu.getNumCompteRendu(), patient.getPrenom() + " " + patient.getNom());

        return updatedCompteRendu;
    }

    @Transactional
    public CompteRendu dissocierPatient(Long compteRenduId) {
        log.info("Dissociation du compte rendu ID: {} du patient", compteRenduId);

        CompteRendu compteRendu = getById(compteRenduId);
        compteRendu.setPatient(null);

        CompteRendu updatedCompteRendu = compteRenduRepository.save(compteRendu);
        log.info("Dissociation réussie pour le compte rendu: {}", updatedCompteRendu.getNumCompteRendu());

        return updatedCompteRendu;
    }

    // === MÉTHODES POUR LES TESTS ===

    public List<String> getTestsDisponibles() {
        return Arrays.asList(
                "GOODENOUGH",
                "SOMATOGNOSIE DE BERGES",
                "Piaget",
                "l'image de Rey",
                "la figure de Rey",
                "Naville",
                "rythme de Mira Stimbak",
                "graphisme BHK",
                "des cloches",
                "d'attention et de concentration de STROOP",
                "latéralité de BERGES",
                "Charlop-Atwell"
        );
    }

    @Transactional
    public CompteRendu ajouterTest(Long id, String testName) {
        CompteRendu compteRendu = getById(id);

        if (compteRendu.getTestsUtilises() == null) {
            compteRendu.setTestsUtilises(new ArrayList<>());
        }

        if (!compteRendu.getTestsUtilises().contains(testName)) {
            compteRendu.getTestsUtilises().add(testName);
            compteRendu = compteRenduRepository.save(compteRendu);
        }

        return compteRendu;
    }

    @Transactional
    public CompteRendu retirerTest(Long id, String testName) {
        CompteRendu compteRendu = getById(id);

        if (compteRendu.getTestsUtilises() != null) {
            compteRendu.getTestsUtilises().remove(testName);
            compteRendu = compteRenduRepository.save(compteRendu);
        }

        return compteRendu;
    }
}