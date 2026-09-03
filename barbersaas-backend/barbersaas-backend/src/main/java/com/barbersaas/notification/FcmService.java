package com.barbersaas.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;

/**
 * Encapsula el envio de notificaciones push via Firebase Cloud Messaging.
 *
 * IMPORTANTE: requiere un archivo de credenciales de servicio de Firebase
 * (serviceAccountKey.json), descargado desde la consola de Firebase
 * (Project Settings > Service Accounts > Generate new private key).
 *
 * Si el archivo no existe o FCM no esta configurado, el servicio NO lanza
 * excepcion: solo registra un warning. Esto permite que el resto de la
 * aplicacion funcione normalmente en ambientes de desarrollo sin FCM.
 *
 * NOTA: usamos nombres completamente calificados (FQN) para
 * com.google.firebase.messaging.Message y com.google.firebase.messaging.Notification
 * porque sus nombres simples ("Message", "Notification") chocan con otras
 * clases del proyecto (ReactiveSubscription.Message de Redis y
 * com.barbersaas.domain.entity.Notification respectivamente).
 */
@Service
@Slf4j
public class FcmService {

    @Value("${fcm.credentials-path:#{null}}")
    private String credentialsPath;

    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("FCM no configurado (fcm.credentials-path vacio). Las notificaciones push estaran deshabilitadas.");
            return;
        }

        try (FileInputStream serviceAccount = new FileInputStream(credentialsPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            initialized = true;
            log.info("FCM inicializado correctamente.");
        } catch (IOException e) {
            log.warn("No se pudo inicializar FCM: {}. Las notificaciones push estaran deshabilitadas.", e.getMessage());
        }
    }

    /**
     * Envia una notificacion push a un token de dispositivo especifico.
     * Si FCM no esta inicializado o el envio falla, registra el error
     * pero NO lanza excepcion -- el registro en BD ya fue creado
     * por NotificationService antes de llamar a este metodo.
     */
    public void sendToToken(String token, String title, String body) {
        if (!initialized) {
            log.debug("FCM deshabilitado: notificacion '{}' no enviada a token {}", title, token);
            return;
        }

        com.google.firebase.messaging.Message message = com.google.firebase.messaging.Message.builder()
                .setToken(token)
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .build();

        try {
            FirebaseMessaging.getInstance().send(message);
            log.debug("Notificacion push enviada correctamente a token {}", token);
        } catch (FirebaseMessagingException e) {
            log.warn("Error enviando notificacion push a token {}: {}", token, e.getMessage());
        }
    }
}