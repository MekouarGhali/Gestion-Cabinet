package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Devis;
import com.example.gestion_de_cabinet_medical.entity.Prestation;
import com.example.gestion_de_cabinet_medical.repository.DevisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DevisService {

    private final DevisRepository devisRepository;

    // CRUD Operations
    public List<Devis> getAll() {
        return devisRepository.findAllByOrderByDateDescIdDesc();
    }

    public Devis getById(Long id) {
        return devisRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Devis introuvable avec l'ID: " + id));
    }

    public Devis getByNumero(String numero) {
        return devisRepository.findByNumero(numero)
                .orElseThrow(() -> new RuntimeException("Devis introuvable avec le numéro: " + numero));
    }

    public Devis create(Devis devis) {
        // Valider les données
        validateDevis(devis);

        // Générer un numéro automatique si vide
        if (devis.getNumero() == null || devis.getNumero().isEmpty()) {
            devis.setNumero(generateDevisNumber());
        } else {
            // Vérifier l'unicité du numéro si fourni
            if (devisRepository.existsByNumero(devis.getNumero())) {
                throw new RuntimeException("Le numéro de devis " + devis.getNumero() + " existe déjà");
            }
        }

        // Associer chaque prestation au devis et calculer les totaux
        if (devis.getPrestations() != null) {
            devis.getPrestations().forEach(prestation -> {
                prestation.setDevis(devis);
                prestation.setTotal(prestation.getQuantite() * prestation.getPrixUnitaire());
            });
        }

        // Calculer le montant total
        double montantTotal = devis.getPrestations().stream()
                .mapToDouble(Prestation::getTotal)
                .sum();
        devis.setMontantTotal(montantTotal);

        // Valeurs par défaut pour les informations du cabinet
        if (devis.getAdresse() == null || devis.getAdresse().isEmpty()) {
            devis.setAdresse("Centre Multi-dys, Lot Perla N° 138, Bouskoura");
        }
        if (devis.getGsm() == null || devis.getGsm().isEmpty()) {
            devis.setGsm("06 49 60 26 47");
        }
        if (devis.getIce() == null || devis.getIce().isEmpty()) {
            devis.setIce("003663065000094");
        }

        log.info("Création devis {} pour {}", devis.getNumero(), devis.getNomPatient());
        return devisRepository.save(devis);
    }

    public void delete(Long id) {
        Devis devis = getById(id);
        log.info("Suppression devis {} pour {}", devis.getNumero(), devis.getNomPatient());
        devisRepository.delete(devis);
    }

    // Recherche et filtrage
    public List<Devis> search(String query) {
        return devisRepository.searchDevis(query);
    }

    public List<Devis> getByNomPatient(String nomPatient) {
        return devisRepository.findByNomPatientContainingIgnoreCaseOrderByDateDescIdDesc(nomPatient);
    }

    public List<Devis> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return devisRepository.findByDateBetweenOrderByDateDescIdDesc(dateDebut, dateFin);
    }

    public List<Devis> getByMutuelle(String mutuelle) {
        return devisRepository.findByMutuelleOrderByDateDescIdDesc(mutuelle);
    }

    public List<Devis> getTodayDevis() {
        return devisRepository.findTodayDevis();
    }

    public List<Devis> getByYearAndMonth(int year, int month) {
        return devisRepository.findByYearAndMonth(year, month);
    }

    // Statistiques
    public Double getTotalRevenue(int year, int month) {
        Double total = devisRepository.getTotalRevenue(year, month);
        return total != null ? total : 0.0;
    }

    public List<Object[]> getStatsByMutuelle() {
        return devisRepository.countByMutuelle();
    }

    // Utilitaires
    private void validateDevis(Devis devis) {
        if (devis.getNomPatient() == null || devis.getNomPatient().trim().isEmpty()) {
            throw new RuntimeException("Le nom du patient est obligatoire");
        }

        if (devis.getDate() == null) {
            throw new RuntimeException("La date est obligatoire");
        }

        if (devis.getMutuelle() == null || devis.getMutuelle().trim().isEmpty()) {
            throw new RuntimeException("L'information sur la mutuelle est obligatoire");
        }

        if (devis.getPrestations() == null || devis.getPrestations().isEmpty()) {
            throw new RuntimeException("Au moins une prestation est obligatoire");
        }

        // Valider chaque prestation
        for (Prestation prestation : devis.getPrestations()) {
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

    private String generateDevisNumber() {
        // Format simple: DV-001, DV-002, DV-003
        List<Devis> allDevis = devisRepository.findAll();
        int nextNumber = allDevis.size() + 1;

        return "DV-" + String.format("%03d", nextNumber);
    }

    // Méthodes spécialisées pour l'interface
    public String getNextDevisNumber() {
        // Même logique pour l'aperçu
        List<Devis> allDevis = devisRepository.findAll();
        int nextNumber = allDevis.size() + 1;

        return "DV-" + String.format("%03d", nextNumber);
    }

    public boolean isNumeroExists(String numero) {
        return devisRepository.existsByNumero(numero);
    }
}