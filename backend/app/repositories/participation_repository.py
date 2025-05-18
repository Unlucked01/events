from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..models import EventParticipant, Invitation, User, Subscription, Event

class ParticipationRepository:
    @staticmethod
    def add_participant(db: Session, event_id: int, user_id: int):
        """Add a participant to an event."""
        # Check if the user is already a participant
        existing = db.query(EventParticipant).filter(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id
        ).first()
        
        if existing:
            return existing
        
        # Add the participant
        db_participant = EventParticipant(
            event_id=event_id,
            user_id=user_id
        )
        db.add(db_participant)
        db.commit()
        db.refresh(db_participant)
        return db_participant

    @staticmethod
    def remove_participant(db: Session, event_id: int, user_id: int):
        """Remove a participant from an event."""
        db_participant = db.query(EventParticipant).filter(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id
        ).first()
        
        if db_participant:
            db.delete(db_participant)
            db.commit()
            return True
        return False

    @staticmethod
    def get_event_participants(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get all participants for an event."""
        return db.query(EventParticipant).filter(
            EventParticipant.event_id == event_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_participations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all events a user is participating in."""
        return db.query(EventParticipant).filter(
            EventParticipant.user_id == user_id
        ).offset(skip).limit(limit).all()

class InvitationRepository:
    @staticmethod
    def create_invitation(db: Session, event_id: int, user_id: int):
        """Create an invitation for a user to an event."""
        # Check if the user is already invited
        existing = db.query(Invitation).filter(
            Invitation.event_id == event_id,
            Invitation.user_id == user_id
        ).first()
        
        if existing:
            return existing
        
        # Create the invitation
        db_invitation = Invitation(
            event_id=event_id,
            user_id=user_id
        )
        db.add(db_invitation)
        db.commit()
        db.refresh(db_invitation)
        return db_invitation

    @staticmethod
    def delete_invitation(db: Session, invitation_id: int):
        """Delete an invitation."""
        db_invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
        if db_invitation:
            db.delete(db_invitation)
            db.commit()
            return True
        return False

    @staticmethod
    def get_by_id(db: Session, invitation_id: int):
        """Get invitation by ID."""
        return db.query(Invitation).filter(Invitation.id == invitation_id).first()

    @staticmethod
    def get_event_invitations(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get all invitations for an event."""
        return db.query(Invitation).filter(
            Invitation.event_id == event_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_invitations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all invitations for a user."""
        return db.query(Invitation).filter(
            Invitation.user_id == user_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def create_invitations_for_followers(db: Session, event_id: int, creator_id: int):
        """Create invitations for all followers of the event creator."""
        # Get all followers of the creator
        followers = db.query(Subscription).filter(
            Subscription.followed_id == creator_id
        ).all()
        
        # Create invitations for each follower
        invitations = []
        for follower in followers:
            invitation = InvitationRepository.create_invitation(db, event_id, follower.follower_id)
            invitations.append(invitation)
        
        return invitations 