from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import User, Event
from ..repositories import InvitationRepository, EventRepository, UserRepository

class InvitationService:
    @staticmethod
    def create_invitation(db: Session, event_id: int, user_id: int, current_user: User):
        """Create an invitation for a user to an event."""
        # Check if event exists and user is the creator
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только создатель может приглашать пользователей"
            )
        
        # Check if user exists
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Check if already invited
        if EventRepository.is_user_invited(db, event_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь уже приглашен"
            )
        
        # Create invitation
        invitation = InvitationRepository.create_invitation(db, event_id, user_id)
        return invitation

    @staticmethod
    def delete_invitation(db: Session, invitation_id: int, current_user: User):
        """Delete an invitation."""
        # Check if invitation exists
        invitation = InvitationRepository.get_by_id(db, invitation_id)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Приглашение не найдено"
            )
        
        # Check if user is the creator of the event
        event = EventRepository.get_by_id(db, invitation.event_id)
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только создатель может удалять приглашения"
            )
        
        # Delete invitation
        deleted = InvitationRepository.delete_invitation(db, invitation_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось удалить приглашение"
            )
        
        return {"status": "success", "message": "Приглашение успешно удалено"}

    @staticmethod
    def get_event_invitations(db: Session, event_id: int, current_user: User, skip: int = 0, limit: int = 100):
        """Get all invitations for an event."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только создатель может просматривать список приглашенных"
            )
        
        # Get invitations
        return InvitationRepository.get_event_invitations(db, event_id, skip, limit)

    @staticmethod
    def get_user_invitations(db: Session, current_user: User, skip: int = 0, limit: int = 100):
        """Get all invitations for the current user."""
        # Get invitations
        return InvitationRepository.get_user_invitations(db, current_user.id, skip, limit) 