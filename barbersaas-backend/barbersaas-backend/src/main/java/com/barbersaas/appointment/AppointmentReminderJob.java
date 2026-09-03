package com.barbersaas.appointment;

import com.barbersaas.domain.entity.Appointment;
import com.barbersaas.domain.entity.Notification;
import com.barbersaas.domain.enums.AppointmentStatus;
import com.barbersaas.domain.repository.AppointmentRepository;
import com.barbersaas.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Job programado que envia recordatorios de citas CONFIRMED que ocurriran
 * el dia siguiente. Corre todos los dias a las 6:00pm.
 *
 * NOTA: para esto se agrega un nuevo metodo de repositorio
 * findByAppointmentDateAndStatus (ver mas abajo).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderJob {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 18 * * *") // todos los dias a las 18:00
    public void sendTomorrowReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Appointment> appointments = appointmentRepository
                .findByAppointmentDateAndStatus(tomorrow, AppointmentStatus.CONFIRMED);

        log.info("Enviando {} recordatorios de citas para {}", appointments.size(), tomorrow);

        for (Appointment appt : appointments) {
            notificationService.notify(
                    appt.getClient().getId(),
                    "Recordatorio de cita",
                    "Recuerda tu cita manana " + appt.getAppointmentDate()
                            + " a las " + appt.getStartTime() + " en "
                            + appt.getBarbershop().getName() + ".",
                    Notification.Type.REMINDER
            );
        }
    }

    /**
     * Job adicional: marca como NO_SHOW las citas CONFIRMED cuya fecha ya paso
     * y nunca se completaron. Corre cada noche a la 1:00am.
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void markPastAppointmentsAsNoShow() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        List<Appointment> pastConfirmed = appointmentRepository
                .findByAppointmentDateAndStatus(yesterday, AppointmentStatus.CONFIRMED);

        log.info("Marcando {} citas vencidas del {} como NO_SHOW", pastConfirmed.size(), yesterday);

        for (Appointment appt : pastConfirmed) {
            appt.setStatus(AppointmentStatus.NO_SHOW);
            appointmentRepository.save(appt);
        }
    }
}