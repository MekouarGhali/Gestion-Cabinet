package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Patient;
import com.example.gestion_de_cabinet_medical.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor

public class PatientService {
    private final PatientRepository repository;

    public List<Patient> getAll() {
        return repository.findAll();
    }

    public List<Patient> getByStatus(String status) {
        return repository.findByStatut(status);
    }

    public List<Patient> search(String query) {
        return repository.searchPatients(query); // ✅ Utilise la méthode searchPatients
    }

    public Patient create(Patient patient) {
        // Générer les initiales pour l'avatar
        String initials = (patient.getPrenom().charAt(0) + "" + patient.getNom().charAt(0));
        patient.setAvatar(initials.toUpperCase());

        // Définir le statut initial
        patient.setStatut("nouveau");
        patient.setDerniereVisite(LocalDate.now());
        patient.setSeancesEffectuees(0);

        return repository.save(patient);
    }

    public Patient update(Long id, Patient patientDetails) {
        Patient patient = repository.findById(id).orElseThrow(() ->
                new RuntimeException("Patient introuvable avec l'ID: " + id));

        // ✅ Mise à jour sécurisée
        patient.setNom(patientDetails.getNom());
        patient.setPrenom(patientDetails.getPrenom());
        patient.setSexe(patientDetails.getSexe());
        patient.setTelephone(patientDetails.getTelephone());
        patient.setPathologie(patientDetails.getPathologie());
        patient.setDateNaissance(patientDetails.getDateNaissance());

        // ✅ CORRECTION : Gestion des null pour les séances
        patient.setSeancesPrevues(patientDetails.getSeancesPrevues() != null ? patientDetails.getSeancesPrevues() : patient.getSeancesPrevues());
        patient.setSeancesEffectuees(patientDetails.getSeancesEffectuees() != null ? patientDetails.getSeancesEffectuees() : patient.getSeancesEffectuees());

        // ✅ CORRECTION : Initialiser à 0 si null
        if (patient.getSeancesEffectuees() == null) {
            patient.setSeancesEffectuees(0);
        }
        if (patient.getSeancesPrevues() == null) {
            patient.setSeancesPrevues(0);
        }

        // Mise à jour de la dernière visite
        if (patientDetails.getDerniereVisite() != null) {
            patient.setDerniereVisite(patientDetails.getDerniereVisite());
        }

        // ✅ LOGIQUE COMBINÉE : Switch + Séances (comme dans le code original)
        if (patientDetails.getStatut() != null && patientDetails.getStatut().equals("inactif")) {
            // Si le statut envoyé est "inactif" (switch activé), on respecte ce choix
            patient.setStatut("inactif");
        } else if (patient.getSeancesEffectuees() >= patient.getSeancesPrevues()) {
            // Si les séances sont terminées, forcer inactif même si le switch n'est pas activé
            patient.setStatut("inactif");
        } else if (patient.getSeancesEffectuees() > 0) {
            patient.setStatut("actif");
        } else {
            patient.setStatut("nouveau");
        }

        return repository.save(patient);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Patient getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    private void updatePatientStatus(Patient patient) {
        // ✅ CORRECTION : Gestion des valeurs null
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
}