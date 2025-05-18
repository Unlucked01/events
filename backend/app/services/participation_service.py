from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import User, Event
from ..repositories import ParticipationRepository, EventRepository

class ParticipationService:
    @staticmethod
    def join_event(db: Session, event_id: int, current_user: User):
        """Join an event as a participant."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if already a participant
        if EventRepository.is_user_participant(db, event_id, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже являетесь участником этого мероприятия"
            )
        
        # Add participant
        participant = ParticipationRepository.add_participant(db, event_id, current_user.id)
        return participant

    @staticmethod
    def leave_event(db: Session, event_id: int, current_user: User):
        """Leave an event as a participant."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if a participant
        if not EventRepository.is_user_participant(db, event_id, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы не являетесь участником этого мероприятия"
            )
        
        # Remove participant
        removed = ParticipationRepository.remove_participant(db, event_id, current_user.id)
        if not removed:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось покинуть мероприятие"
            )
        
        return {"status": "success", "message": "Вы успешно покинули мероприятие"}

    @staticmethod
    def get_event_participants(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get all participants for an event."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Get participants
        return ParticipationRepository.get_event_participants(db, event_id, skip, limit)

    @staticmethod
    def get_user_participations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all events a user is participating in."""
        # Check if user exists
        from ..repositories import UserRepository
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Get participations
        return ParticipationRepository.get_user_participations(db, user_id, skip, limit) 