package com.example.gestion_de_cabinet_medical.controller;

import com.example.gestion_de_cabinet_medical.entity.Profil;
import com.example.gestion_de_cabinet_medical.service.ProfilService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/profil")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProfilController {

    private final ProfilService profilService;

    @GetMapping("/me")
    public ResponseEntity<Profil> getCurrentProfil() {
        try {
            Profil profil = profilService.getCurrentProfil();
            return ResponseEntity.ok(profil);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil actuel", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profil> getProfil(@PathVariable Long id) {
        try {
            Profil profil = profilService.getProfil(id);
            return ResponseEntity.ok(profil);
        } catch (RuntimeException e) {
            log.error("Profil non trouvé avec l'ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfil(@PathVariable Long id, @RequestBody Profil profil) {
        try {
            Profil updatedProfil = profilService.updateProfil(id, profil);
            return ResponseEntity.ok(updatedProfil);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation lors de la mise à jour du profil: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du profil", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // Upload d'avatar avec MultipartFile (recommandé)
    @PostMapping("/photo/{id}")
    public ResponseEntity<?> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Fichier vide"));
            }

            // Vérification du type de fichier
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le fichier doit être une image"));
            }

            profilService.updateAvatar(id, file.getBytes());
            return ResponseEntity.ok(Map.of("message", "Avatar mis à jour avec succès"));

        } catch (IOException e) {
            log.error("Erreur lors de la lecture du fichier", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la lecture du fichier"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de l'upload de l'avatar", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    // Upload d'avatar avec Base64 (pour votre interface web)
    @PostMapping("/{id}/upload-photo")
    public ResponseEntity<?> uploadPhotoBase64(
            @PathVariable Long id,
            @RequestBody Map<String, String> photoData) {

        try {
            String photoBase64 = photoData.get("photo");
            if (photoBase64 == null || photoBase64.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Photo Base64 requise"));
            }

            profilService.updateAvatarFromBase64(id, photoBase64);
            return ResponseEntity.ok(Map.of("message", "Photo mise à jour avec succès"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de l'upload de la photo Base64", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @GetMapping("/photo/{id}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id) {
        try {
            byte[] image = profilService.getAvatar(id);
            if (image == null || image.length == 0) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG); // Ou IMAGE_JPEG selon le format
            headers.setContentLength(image.length);
            headers.setCacheControl("max-age=3600"); // Cache 1 heure

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(image);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de la photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/theme")
    public ResponseEntity<?> updateTheme(
            @PathVariable Long id,
            @RequestBody Map<String, String> themeData) {
        try {
            String theme = themeData.get("theme");
            if (theme == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Thème requis"));
            }

            profilService.updateTheme(id, theme);
            return ResponseEntity.ok(Map.of("message", "Thème mis à jour avec succès"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du thème", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changerMotDePasse(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwords) {

        try {
            String currentPassword = passwords.get("currentPassword");
            String newPassword = passwords.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Mot de passe actuel et nouveau mot de passe requis"));
            }

            profilService.changerMotDePasse(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors du changement de mot de passe", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @PostMapping("/{id}/activer-2fa")
    public ResponseEntity<?> activer2FA(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        try {
            String secret = data.get("secret");
            if (secret == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Secret 2FA requis"));
            }

            profilService.activer2FA(id, secret);
            return ResponseEntity.ok(Map.of("message", "2FA activé avec succès"));

        } catch (Exception e) {
            log.error("Erreur lors de l'activation 2FA", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    @DeleteMapping("/{id}/desactiver-2fa")
    public ResponseEntity<?> desactiver2FA(@PathVariable Long id) {
        try {
            profilService.desactiver2FA(id);
            return ResponseEntity.ok(Map.of("message", "2FA désactivé avec succès"));
        } catch (Exception e) {
            log.error("Erreur lors de la désactivation 2FA", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }
}