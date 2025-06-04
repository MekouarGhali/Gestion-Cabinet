package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Facture;
import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.entity.Prestation;
import com.example.gestion_de_cabinet_medical.repository.FactureRepository;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FactureService {

    private final FactureRepository factureRepository;
    private final PatientRepository patientRepository;
    private final RevenuService revenuService; // Ajout de la dépendance

    // CRUD Operations
    public List<Facture> getAll() {
        return factureRepository.findAllByOrderByDateDescIdDesc();
    }

    public Facture getById(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facture introuvable avec l'ID: " + id));
    }

    public Facture getByNumero(String numero) {
        return factureRepository.findByNumero(numero)
                .orElseThrow(() -> new RuntimeException("Facture introuvable avec le numéro: " + numero));
    }

    public Facture create(Facture facture) {
        // Valider les données
        validateFacture(facture);

        // Récupérer le patient complet
        Patient patient = patientRepository.findById(facture.getPatient().getId())
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        facture.setPatient(patient);

        // Générer un numéro automatique si vide
        if (facture.getNumero() == null || facture.getNumero().isEmpty()) {
            facture.setNumero(generateFactureNumber());
        } else {
            // Vérifier l'unicité du numéro si fourni
            if (factureRepository.existsByNumero(facture.getNumero())) {
                throw new RuntimeException("Le numéro de facture " + facture.getNumero() + " existe déjà");
            }
        }

        // Associer chaque prestation à la facture et calculer les totaux
        if (facture.getPrestations() != null) {
            facture.getPrestations().forEach(prestation -> {
                prestation.setFacture(facture);
                prestation.setTotal(prestation.getQuantite() * prestation.getPrixUnitaire());
            });
        }

        // Calculer le montant total
        double montantTotal = facture.getPrestations().stream()
                .mapToDouble(Prestation::getTotal)
                .sum();
        facture.setMontantTotal(montantTotal);

        // Valeurs par défaut pour les informations du cabinet
        if (facture.getAdresse() == null || facture.getAdresse().isEmpty()) {
            facture.setAdresse("Centre Multi-dys, Lot Perla N° 138, Bouskoura");
        }
        if (facture.getGsm() == null || facture.getGsm().isEmpty()) {
            facture.setGsm("06 49 60 26 47");
        }
        if (facture.getIce() == null || facture.getIce().isEmpty()) {
            facture.setIce("003663065000094");
        }

        // Sauvegarder la facture
        Facture savedFacture = factureRepository.save(facture);

        // Créer automatiquement un revenu associé
        try {
            revenuService.createFromFacture(savedFacture);
            log.info("Revenu créé automatiquement pour la facture {}", savedFacture.getNumero());
        } catch (Exception e) {
            log.error("Erreur lors de la création automatique du revenu pour la facture {}: {}",
                    savedFacture.getNumero(), e.getMessage());
        }

        log.info("Création facture {} pour patient {}", savedFacture.getNumero(), patient.getNom());
        return savedFacture;
    }

    public Facture update(Long id, Facture factureDetails) {
        Facture facture = getById(id);

        // Valider les données
        validateFacture(factureDetails);

        // Mettre à jour le patient si changé
        if (factureDetails.getPatient() != null &&
                !facture.getPatient().getId().equals(factureDetails.getPatient().getId())) {
            Patient patient = patientRepository.findById(factureDetails.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient introuvable"));
            facture.setPatient(patient);
        }

        // Vérifier l'unicité du numéro si modifié
        if (!facture.getNumero().equals(factureDetails.getNumero())) {
            if (factureRepository.existsByNumero(factureDetails.getNumero())) {
                throw new RuntimeException("Le numéro de facture " + factureDetails.getNumero() + " existe déjà");
            }
            facture.setNumero(factureDetails.getNumero());
        }

        // Mettre à jour les champs
        facture.setDate(factureDetails.getDate());
        facture.setModePaiement(factureDetails.getModePaiement());
        facture.setMutuelle(factureDetails.getMutuelle());
        facture.setAdresse(factureDetails.getAdresse());
        facture.setGsm(factureDetails.getGsm());
        facture.setIce(factureDetails.getIce());

        // Mettre à jour les prestations
        if (factureDetails.getPrestations() != null) {
            // Supprimer les anciennes prestations
            facture.getPrestations().clear();

            // Ajouter les nouvelles prestations
            factureDetails.getPrestations().forEach(prestation -> {
                prestation.setFacture(facture);
                prestation.setTotal(prestation.getQuantite() * prestation.getPrixUnitaire());
                facture.getPrestations().add(prestation);
            });
        }

        // Recalculer le montant total
        double montantTotal = facture.getPrestations().stream()
                .mapToDouble(Prestation::getTotal)
                .sum();
        facture.setMontantTotal(montantTotal);

        // Sauvegarder la facture mise à jour
        Facture updatedFacture = factureRepository.save(facture);

        // Mettre à jour le revenu associé si nécessaire
        try {
            revenuService.createFromFacture(updatedFacture); // Cette méthode gère déjà l'existence
            log.info("Revenu mis à jour pour la facture {}", updatedFacture.getNumero());
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du revenu pour la facture {}: {}",
                    updatedFacture.getNumero(), e.getMessage());
        }

        log.info("Modification facture {} pour patient {}", facture.getNumero(), facture.getPatient().getNom());
        return updatedFacture;
    }

    public void delete(Long id) {
        Facture facture = getById(id);
        log.info("Suppression facture {} pour patient {}", facture.getNumero(), facture.getPatient().getNom());
        factureRepository.delete(facture);
        // Note: Le revenu associé sera supprimé automatiquement par la contrainte CASCADE
    }

    // Recherche et filtrage
    public List<Facture> search(String query) {
        return factureRepository.searchFactures(query);
    }

    public List<Facture> getByPatient(Long patientId) {
        return factureRepository.findByPatientIdOrderByDateDescIdDesc(patientId);
    }

    public List<Facture> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return factureRepository.findByDateBetweenOrderByDateDescIdDesc(dateDebut, dateFin);
    }

    public List<Facture> getByModePaiement(String modePaiement) {
        return factureRepository.findByModePaiementOrderByDateDescIdDesc(modePaiement);
    }

    public List<Facture> getByMutuelle(String mutuelle) {
        return factureRepository.findByMutuelleOrderByDateDescIdDesc(mutuelle);
    }

    public List<Facture> getTodayFactures() {
        return factureRepository.findTodayFactures();
    }

    public List<Facture> getByYearAndMonth(int year, int month) {
        return factureRepository.findByYearAndMonth(year, month);
    }

    // Statistiques
    public Double getTotalRevenue(int year, int month) {
        Double total = factureRepository.getTotalRevenue(year, month);
        return total != null ? total : 0.0;
    }

    public List<Object[]> getStatsByModePaiement() {
        return factureRepository.countByModePaiement();
    }

    // Utilitaires
    private void validateFacture(Facture facture) {
        if (facture.getPatient() == null || facture.getPatient().getId() == null) {
            throw new RuntimeException("Le patient est obligatoire");
        }

        if (facture.getDate() == null) {
            throw new RuntimeException("La date est obligatoire");
        }

        if (facture.getModePaiement() == null || facture.getModePaiement().trim().isEmpty()) {
            throw new RuntimeException("Le mode de paiement est obligatoire");
        }

        if (facture.getMutuelle() == null || facture.getMutuelle().trim().isEmpty()) {
            throw new RuntimeException("L'information sur la mutuelle est obligatoire");
        }

        if (facture.getPrestations() == null || facture.getPrestations().isEmpty()) {
            throw new RuntimeException("Au moins une prestation est obligatoire");
        }

        // Valider chaque prestation
        for (Prestation prestation : facture.getPrestations()) {
            if (prestation.getDesignation() == null || prestation.getDesignation().trim().isEmpty()) {
                throw new RuntimeException("La désignation de la prestation est obligatoire");
            }
            if (prestation.getQuantite() <= 0) {
                throw new RuntimeException("La quantité doit être positive");
            }
            if (prestation.getPrixUnitaire() <= 0) {
                throw new RuntimeException("Le prix unitaire doit être positif");
            }
        }
    }

    private String generateFactureNumber() {
        // Format simple: F-001, F-002, F-003 (sans année)
        List<Facture> allFactures = factureRepository.findAll();
        int nextNumber = allFactures.size() + 1;

        return "F-" + String.format("%03d", nextNumber);
    }

    // Méthodes spécialisées pour l'interface
    public String getNextFactureNumber() {
        // Même logique pour l'aperçu
        List<Facture> allFactures = factureRepository.findAll();
        int nextNumber = allFactures.size() + 1;

        return "F-" + String.format("%03d", nextNumber);
    }

    public boolean isNumeroExists(String numero) {
        return factureRepository.existsByNumero(numero);
    }

    // Méthode pour synchroniser les revenus avec les factures existantes
    @Transactional
    public void synchroniserRevenus() {
        List<Facture> allFactures = factureRepository.findAll();
        revenuService.synchroniserRevenus(allFactures);
    }
}