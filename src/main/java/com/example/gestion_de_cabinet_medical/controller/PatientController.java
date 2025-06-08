package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.service.PatientService;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService service;
    private final PatientRepository repository; // ✅ Injection directe du repository

    @GetMapping
    public List<Patient> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Patient getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/statut/{statut}")
    public List<Patient> getByStatus(@PathVariable String statut) {
        return service.getByStatus(statut);
    }

    @GetMapping("/search")
    public List<Patient> search(@RequestParam String q) {
        return service.search(q);
    }

    @PostMapping
    public Patient create(@RequestBody Patient patient) {
        return service.create(patient);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id, @RequestBody Patient patient) {
        return service.update(id, patient);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // ✅ NOUVELLE MÉTHODE SIMPLE : Mise à jour dernière visite
    @PutMapping("/{id}/derniere-visite")
    public ResponseEntity<Patient> updateDerniereVisite(@PathVariable Long id) {
        try {
            log.info("Mise à jour dernière visite pour patient ID: {}", id);

            // Récupérer le patient
            Patient patient = service.getById(id);
            if (patient == null) {
                log.warn("Patient introuvable avec l'ID: {}", id);
                return ResponseEntity.notFound().build();
            }

            // ✅ AMÉLIORATION : Mettre à jour avec l'heure actuelle
            LocalDate maintenant = LocalDate.now();
            patient.setDerniereVisite(maintenant);

            // ✅ AMÉLIORATION : Sauvegarde directe optimisée
            Patient updated = repository.save(patient);

            log.info("✅ Patient {} {} mis à jour avec dernière visite: {}",
                    updated.getPrenom(), updated.getNom(), updated.getDerniereVisite());

            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la mise à jour de la dernière visite pour patient ID: " + id, e);
            return ResponseEntity.status(500).build();
        }
    }

    // ✅ NOUVEAU : Endpoint pour récupérer les patients récents triés
    @GetMapping("/recents")
    public ResponseEntity<List<Patient>> getRecentPatients(@RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Récupération des {} patients les plus récents", limit);

            List<Patient> allPatients = repository.findAll();

            // ✅ CORRECTION : Tri par dernière visite décroissante (plus récent en premier)
            List<Patient> recentPatients = allPatients.stream()
                    .filter(p -> p.getDerniereVisite() != null)
                    .sorted((a, b) -> {
                        LocalDate dateA = a.getDerniereVisite();
                        LocalDate dateB = b.getDerniereVisite();

                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;  // Mettre les null à la fin
                        if (dateB == null) return -1; // Mettre les null à la fin

                        return dateB.compareTo(dateA); // ✅ ORDRE DÉCROISSANT (plus récent en premier)
                    })
                    .limit(limit)
                    .collect(Collectors.toList());

            log.info("✅ {} patients récents retournés", recentPatients.size());
            return ResponseEntity.ok(recentPatients);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des patients récents", e);
            return ResponseEntity.status(500).build();
        }
    }
}