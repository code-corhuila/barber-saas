package com.barbersaas.favorite;

import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.ClientFavorite;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.ClientFavoriteRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.favorite.dto.FavoriteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final ClientFavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;

    public List<FavoriteResponse> getMyFavorites(Long clientId) {
        return favoriteRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(f -> toResponse(f.getBarbershop()))
                .toList();
    }

    @Transactional
    public void addFavorite(Long clientId, Long barbershopId) {
        if (favoriteRepository.existsByClientIdAndBarbershopId(clientId, barbershopId)) {
            throw new BadRequestException("Esta barberia ya esta en sus favoritos");
        }

        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        favoriteRepository.save(ClientFavorite.builder()
                .client(client)
                .barbershop(barbershop)
                .build());
    }

    @Transactional
    public void removeFavorite(Long clientId, Long barbershopId) {
        favoriteRepository.deleteByClientIdAndBarbershopId(clientId, barbershopId);
    }

    private FavoriteResponse toResponse(Barbershop b) {
        return FavoriteResponse.builder()
                .barbershopId(b.getId())
                .barbershopName(b.getName())
                .city(b.getCity())
                .logoUrl(b.getLogoUrl())
                .build();
    }
}