from datetime import datetime, timedelta
import uuid

from sqlalchemy.orm import Session

from app.models.telegram import TelegramLinkToken


class TelegramLinkService:
    @staticmethod
    def create_link_token(db: Session, user_id: int) -> str:
        token = f"link_{uuid.uuid4().hex[:16]}"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        db_token = TelegramLinkToken(user_id=user_id, token=token, expires_at=expires_at)
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        return token

    @staticmethod
    def get_user_by_token(db: Session, token: str):
        db_token = db.query(TelegramLinkToken).filter(
            TelegramLinkToken.token == token,
            TelegramLinkToken.expires_at > datetime.utcnow()
        ).first()
        if db_token:
            user = db_token.user
            db.delete(db_token)
            db.commit()
            return user
        return None
