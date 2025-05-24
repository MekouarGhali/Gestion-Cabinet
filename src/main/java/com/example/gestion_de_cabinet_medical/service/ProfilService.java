package com.example.gestion_de_cabinet_medical.service;

import com.example.gestion_de_cabinet_medical.entity.Profil;
import com.example.gestion_de_cabinet_medical.repository.ProfilRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// import org.springframework.security.crypto.password.PasswordEncoder; // TODO: Décommenter quand Spring Security sera ajouté
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProfilService {

    private final ProfilRepository profilRepository;
    // TODO: Décommenter quand Spring Security sera ajouté
    // private final PasswordEncoder passwordEncoder;

    // ========== GESTION DU PROFIL ==========

    public Profil getCurrentProfil() {
        // TODO: Récupérer l'utilisateur depuis le contexte de sécurité quand Spring Security sera ajouté
        // Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // String email = authentication.getName();
        // return profilRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Profil non trouvé"));

        // TEMPORAIRE: Retourner l'utilisateur avec ID 1
        Optional<Profil> profil = profilRepository.findById(1L);
        return profil.orElseGet(this::createDefaultProfil);
    }

    public Profil getProfil(Long id) {
        return profilRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profil introuvable avec l'ID: " + id));
    }

    public Profil updateProfil(Long id, Profil updated) {
        Profil profil = getProfil(id);

        // Validation des données
        validateProfilData(updated, id);

        // Mettre à jour les champs
        profil.setPrenom(updated.getPrenom().trim());
        profil.setNom(updated.getNom().trim());
        profil.setEmail(updated.getEmail().trim().toLowerCase());
        profil.setTelephone(updated.getTelephone());
        profil.setSpecialite(updated.getSpecialite());

        if (updated.getTheme() != null) {
            profil.setTheme(updated.getTheme());
        }

        profil.setTwoFactorEnabled(updated.isTwoFactorEnabled());

        log.info("Profil mis à jour pour l'ID: {}", id);
        return profilRepository.save(profil);
    }

    // ========== GESTION DE L'AVATAR ==========

    public void updateAvatar(Long id, byte[] avatar) {
        Profil profil = getProfil(id);

        // Validation de la taille (max 5MB)
        if (avatar != null && avatar.length > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("La taille de l'image ne doit pas dépasser 5MB");
        }

        profil.setAvatar(avatar);
        profilRepository.save(profil);
        log.info("Avatar mis à jour pour le profil ID: {}", id);
    }

    public void updateAvatarFromBase64(Long id, String base64Image) {
        if (base64Image == null || base64Image.isEmpty()) {
            throw new IllegalArgumentException("Image Base64 requise");
        }

        try {
            // Supprimer le préfixe data:image/...;base64, si présent
            String imageData = base64Image;
            if (base64Image.contains(",")) {
                imageData = base64Image.split(",")[1];
            }

            byte[] imageBytes = Base64.getDecoder().decode(imageData);
            updateAvatar(id, imageBytes);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Format Base64 invalide", e);
        }
    }

    public byte[] getAvatar(Long id) {
        Profil profil = getProfil(id);
        return profil.getAvatar();
    }

    // ========== PARAMÈTRES ==========

    public void updateTheme(Long id, String theme) {
        if (!isValidTheme(theme)) {
            throw new IllegalArgumentException("Thème invalide. Valeurs acceptées: light, dark, auto");
        }

        Profil profil = getProfil(id);
        profil.setTheme(theme);
        profilRepository.save(profil);
        log.info("Thème mis à jour pour le profil ID: {} - Nouveau thème: {}", id, theme);
    }

    // ========== SÉCURITÉ ==========

    public boolean verifierMotDePasse(Long id, String motDePasse) {
        Profil profil = getProfil(id);

        // TODO: Décommenter quand Spring Security sera ajouté
        // return passwordEncoder.matches(motDePasse, profil.getMotDePasseHash());

        // TEMPORAIRE: Comparaison simple en texte brut
        return motDePasse.equals(profil.getMotDePasseHash());
    }

    public void changerMotDePasse(Long id, String ancienMotDePasse, String nouveauMotDePasse) {
        if (!verifierMotDePasse(id, ancienMotDePasse)) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }

        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < 6) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit faire au moins 6 caractères");
        }

        Profil profil = getProfil(id);

        // TODO: Décommenter quand Spring Security sera ajouté
        // profil.setMotDePasseHash(passwordEncoder.encode(nouveauMotDePasse));

        // TEMPORAIRE: Stockage en texte brut
        profil.setMotDePasseHash(nouveauMotDePasse);

        profilRepository.save(profil);
        log.info("Mot de passe changé pour le profil ID: {}", id);
    }

    // ========== AUTHENTIFICATION 2FA ==========

    public void activer2FA(Long id, String secret) {
        Profil profil = getProfil(id);
        profil.setTwoFactorEnabled(true);
        profil.setSecret2FA(secret);
        profilRepository.save(profil);
        log.info("2FA activé pour le profil ID: {}", id);
    }

    public void desactiver2FA(Long id) {
        Profil profil = getProfil(id);
        profil.setTwoFactorEnabled(false);
        profil.setSecret2FA(null);
        profilRepository.save(profil);
        log.info("2FA désactivé pour le profil ID: {}", id);
    }

    public boolean verifier2FA(Long id, String code) {
        // TODO: Implémenter la vérification TOTP avec GoogleAuthenticator quand vous ajouterez la dépendance
        // Profil profil = getProfil(id);
        // GoogleAuthenticator gAuth = new GoogleAuthenticator();
        // return gAuth.authorize(profil.getSecret2FA(), Integer.parseInt(code));
        return false;
    }

    // ========== UTILITAIRES ==========

    public void updateLastLogin(Long id) {
        Profil profil = getProfil(id);
        profil.setDerniereConnexion(LocalDateTime.now());
        profilRepository.save(profil);
    }

    public Profil createDefaultProfil() {
        Profil defaultProfil = Profil.builder()
                .prenom("Mekouar")
                .nom("Zineb")
                .email("mekouar.zineb@example.com")
                .telephone("06 12 34 56 78")
                .specialite("psychomotricienne")
                .theme("light")
                .twoFactorEnabled(false)
                // TODO: Remplacer par passwordEncoder.encode("password123") quand Spring Security sera ajouté
                .motDePasseHash("password123") // TEMPORAIRE: Mot de passe en texte brut
                .build();

        log.info("Création d'un profil par défaut");
        return profilRepository.save(defaultProfil);
    }

    // ========== MÉTHODES PRIVÉES DE VALIDATION ==========

    private void validateProfilData(Profil updated, Long currentProfilId) {
        if (updated.getPrenom() == null || updated.getPrenom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le prénom est obligatoire");
        }
        if (updated.getNom() == null || updated.getNom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom est obligatoire");
        }
        if (updated.getEmail() == null || !isValidEmail(updated.getEmail())) {
            throw new IllegalArgumentException("Email valide requis");
        }

        // Vérifier que l'email n'est pas déjà utilisé par un autre profil
        Optional<Profil> existingProfil = profilRepository.findByEmail(updated.getEmail());
        if (existingProfil.isPresent() && !existingProfil.get().getId().equals(currentProfilId)) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    private boolean isValidTheme(String theme) {
        return theme != null && (theme.equals("light") || theme.equals("dark") || theme.equals("auto"));
    }
}