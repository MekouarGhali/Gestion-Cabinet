package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Facture;
import com.example.gestion_de_cabinet_medical.entity.Revenu;
import com.example.gestion_de_cabinet_medical.repository.RevenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RevenuService {

    private final RevenuRepository revenuRepository;

    // CRUD Operations
    public List<Revenu> getAll() {
        return revenuRepository.findAllByOrderByDateTransactionDescIdDesc();
    }

    public Revenu getById(Long id) {
        return revenuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Revenu introuvable avec l'ID: " + id));
    }

    public Revenu createFromFacture(Facture facture) {
        // Vérifier si un revenu existe déjà pour cette facture
        if (revenuRepository.existsByFactureId(facture.getId())) {
            log.warn("Un revenu existe déjà pour la facture {}", facture.getNumero());
            return revenuRepository.findByFactureId(facture.getId());
        }

        // Déterminer le type de prestation principal
        String typePrestationPrincipal = determinerTypePrestationPrincipal(facture);

        // Créer le revenu
        Revenu revenu = Revenu.builder()
                .facture(facture)
                .patient(facture.getPatient())
                .dateTransaction(facture.getDate())
                .createdAt(LocalDateTime.now())
                .montant(facture.getMontantTotal())
                .modePaiement(facture.getModePaiement())
                .mutuelle(facture.getMutuelle())
                .statut(Revenu.StatutRevenu.PAYE) // Par défaut, considéré comme payé
                .numeroFacture(facture.getNumero())
                .nomCompletPatient(facture.getNomCompletPatient())
                .typePrestationPrincipal(typePrestationPrincipal)
                .build();

        log.info("Création d'un revenu pour la facture {} - Montant: {} DH",
                facture.getNumero(), facture.getMontantTotal());

        return revenuRepository.save(revenu);
    }

    public Revenu updateStatut(Long id, Revenu.StatutRevenu nouveauStatut) {
        Revenu revenu = getById(id);
        revenu.setStatut(nouveauStatut);

        log.info("Mise à jour du statut du revenu {} vers {}", id, nouveauStatut);
        return revenuRepository.save(revenu);
    }

    public void delete(Long id) {
        Revenu revenu = getById(id);
        log.info("Suppression du revenu {} (Facture: {})", id, revenu.getNumeroFacture());
        revenuRepository.delete(revenu);
    }

    // Recherche et filtrage
    public List<Revenu> search(String query) {
        return revenuRepository.searchRevenus(query);
    }

    public List<Revenu> getByPatient(Long patientId) {
        return revenuRepository.findByPatientIdOrderByDateTransactionDescIdDesc(patientId);
    }

    public List<Revenu> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return revenuRepository.findByDateTransactionBetweenOrderByDateTransactionDescIdDesc(dateDebut, dateFin);
    }

    public List<Revenu> getByModePaiement(String modePaiement) {
        return revenuRepository.findByModePaiementOrderByDateTransactionDescIdDesc(modePaiement);
    }

    public List<Revenu> getByMutuelle(String mutuelle) {
        return revenuRepository.findByMutuelleOrderByDateTransactionDescIdDesc(mutuelle);
    }

    public List<Revenu> getByStatut(Revenu.StatutRevenu statut) {
        return revenuRepository.findByStatutOrderByDateTransactionDescIdDesc(statut);
    }

    public List<Revenu> getTodayRevenus() {
        return revenuRepository.findTodayRevenus();
    }

    public List<Revenu> getByYearAndMonth(int year, int month) {
        return revenuRepository.findByYearAndMonth(year, month);
    }

    public List<Revenu> getByYear(int year) {
        return revenuRepository.findByYear(year);
    }

    // Statistiques
    public Map<String, Object> getStatistics() {
        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();
        int previousMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int previousMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        Map<String, Object> stats = new HashMap<>();

        // Revenus du mois
        Double revenusCurrentMonth = revenuRepository.getTotalRevenue(currentYear, currentMonth);
        Double revenusPreviousMonth = revenuRepository.getTotalRevenue(previousMonthYear, previousMonth);
        stats.put("revenusCurrentMonth", revenusCurrentMonth != null ? revenusCurrentMonth : 0.0);
        stats.put("revenusPreviousMonth", revenusPreviousMonth != null ? revenusPreviousMonth : 0.0);

        // Calcul du pourcentage d'évolution mensuelle
        if (revenusPreviousMonth != null && revenusPreviousMonth > 0) {
            double evolutionMensuelle = ((revenusCurrentMonth - revenusPreviousMonth) / revenusPreviousMonth) * 100;
            stats.put("evolutionMensuelle", Math.round(evolutionMensuelle * 100.0) / 100.0);
        } else {
            stats.put("evolutionMensuelle", 0.0);
        }

        // Revenus de l'année
        Double revenusCurrentYear = revenuRepository.getTotalRevenueByYear(currentYear);
        Double revenusPreviousYear = revenuRepository.getTotalRevenueByYear(currentYear - 1);
        stats.put("revenusCurrentYear", revenusCurrentYear != null ? revenusCurrentYear : 0.0);
        stats.put("revenusPreviousYear", revenusPreviousYear != null ? revenusPreviousYear : 0.0);

        // Calcul du pourcentage d'évolution annuelle
        if (revenusPreviousYear != null && revenusPreviousYear > 0) {
            double evolutionAnnuelle = ((revenusCurrentYear - revenusPreviousYear) / revenusPreviousYear) * 100;
            stats.put("evolutionAnnuelle", Math.round(evolutionAnnuelle * 100.0) / 100.0);
        } else {
            stats.put("evolutionAnnuelle", 0.0);
        }

        // Séances du mois
        Long seancesCurrentMonth = revenuRepository.countSessionsByMonth(currentYear, currentMonth);
        Long seancesPreviousMonth = revenuRepository.countSessionsByMonth(previousMonthYear, previousMonth);
        stats.put("seancesCurrentMonth", seancesCurrentMonth != null ? seancesCurrentMonth : 0L);
        stats.put("seancesPreviousMonth", seancesPreviousMonth != null ? seancesPreviousMonth : 0L);

        // Calcul du pourcentage d'évolution des séances
        if (seancesPreviousMonth != null && seancesPreviousMonth > 0) {
            double evolutionSeances = ((double)(seancesCurrentMonth - seancesPreviousMonth) / seancesPreviousMonth) * 100;
            stats.put("evolutionSeances", Math.round(evolutionSeances * 100.0) / 100.0);
        } else {
            stats.put("evolutionSeances", 0.0);
        }

        // Paiements en attente
        Long paiementsEnAttente = revenuRepository.countPendingPayments();
        Double montantEnAttente = revenuRepository.getTotalPendingAmount();
        stats.put("paiementsEnAttente", paiementsEnAttente != null ? paiementsEnAttente : 0L);
        stats.put("montantEnAttente", montantEnAttente != null ? montantEnAttente : 0.0);

        return stats;
    }

    public List<Object[]> getMonthlyRevenueByYear(int year) {
        return revenuRepository.getMonthlyRevenueByYear(year);
    }

    public List<Object[]> getYearlyRevenue() {
        return revenuRepository.getYearlyRevenue();
    }

    public List<Object[]> getRevenueByPrestationType(int year, int month) {
        return revenuRepository.getRevenueByPrestationType(year, month);
    }

    public List<Object[]> getStatsByModePaiement() {
        return revenuRepository.getStatsByModePaiement();
    }

    // Méthodes utilitaires
    private String determinerTypePrestationPrincipal(Facture facture) {
        if (facture.getPrestations() == null || facture.getPrestations().isEmpty()) {
            return "Séance";
        }

        // Compter les types de prestations
        Map<String, Integer> typeCounts = new HashMap<>();
        facture.getPrestations().forEach(prestation -> {
            String type = categoriserPrestation(prestation.getDesignation());
            typeCounts.put(type, typeCounts.getOrDefault(type, 0) + prestation.getQuantite());
        });

        // Retourner le type le plus fréquent
        return typeCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Séance");
    }

    private String categoriserPrestation(String designation) {
        if (designation.toLowerCase().contains("bilan") ||
                designation.toLowerCase().contains("évaluation")) {
            return "Bilan";
        } else if (designation.toLowerCase().contains("anamnèse") ||
                designation.toLowerCase().contains("anamnese")) {
            return "Anamnèse";
        } else {
            return "Séance";
        }
    }

    // Méthode pour synchroniser les revenus avec les factures existantes
    @Transactional
    public void synchroniserRevenus(List<Facture> factures) {
        log.info("Synchronisation des revenus avec {} factures", factures.size());

        for (Facture facture : factures) {
            if (!revenuRepository.existsByFactureId(facture.getId())) {
                createFromFacture(facture);
            }
        }

        log.info("Synchronisation des revenus terminée");
    }
}