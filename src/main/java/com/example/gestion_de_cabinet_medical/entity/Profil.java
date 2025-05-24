package com.example.gestion_de_cabinet_medical.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "profil")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profil {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    @Column(unique = true, nullable = false)
    private String email;

    private String telephone;
    private String specialite;

    // Photo stockée en byte[] (plus efficace que Base64)
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] avatar;

    // Initiales générées automatiquement
    private String initiales;

    // Paramètres d'affichage
    @Column(nullable = false)
    @Builder.Default
    private String theme = "light"; // "light", "dark", "auto"

    // Sécurité
    @Column(nullable = false)
    private String motDePasseHash; // TEMPORAIRE: texte brut, TODO: hasher avec Spring Security

    @Builder.Default
    private boolean twoFactorEnabled = false;
    private String secret2FA; // pour le TOTP (QR Code)

    // Métadonnées
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime derniereConnexion;

    // TODO: Quand vous ajouterez Spring Security, vous pourrez ajouter ces champs :
    // @Enumerated(EnumType.STRING)
    // private Role role; // ADMIN, USER, etc.
    // private boolean accountNonExpired = true;
    // private boolean accountNonLocked = true;
    // private boolean credentialsNonExpired = true;
    // private boolean enabled = true;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        generateInitiales();
        if (theme == null) {
            theme = "light";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        generateInitiales();
    }

    private void generateInitiales() {
        if (prenom != null && nom != null && !prenom.isEmpty() && !nom.isEmpty()) {
            initiales = (prenom.charAt(0) + "" + nom.charAt(0)).toUpperCase();
        }
    }

    // Méthode utilitaire pour obtenir le nom complet
    public String getNomComplet() {
        return (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
    }

    // TODO: Quand vous ajouterez Spring Security, implémentez UserDetails :
    /*
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return motDePasseHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
    */
}