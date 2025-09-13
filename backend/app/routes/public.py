from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Album
from ..auth import verify_password

router = APIRouter(prefix="/api")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/albums")
def list_albums(db: Session = Depends(get_db)):
    """
    List all albums (public + protected).
    Always include is_protected flag, but never include assets.
    """
    albums = db.query(Album).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "cover_image": a.cover_image,
            "is_protected": bool(a.password_hash),
        }
        for a in albums
    ]


@router.get("/albums/{album_id}")
def get_album(album_id: str, db: Session = Depends(get_db)):
    """
    Fetch metadata for a single album.
    If protected → do NOT return assets.
    If public → return assets inline.
    """
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    is_protected = bool(album.password_hash)
    response = {
        "id": album.id,
        "title": album.title,
        "description": album.description,
        "is_protected": is_protected,
    }

    if not is_protected:
        response["assets"] = [
            {"id": asset.id, "file_path": asset.file_path, "thumb_path": asset.thumb_path}
            for asset in album.assets
        ]
    else:
        response["assets"] = []  # must unlock first

    return response


@router.post("/albums/{album_id}/unlock")
def unlock_album(album_id: str, password: str = Form(...), db: Session = Depends(get_db)):
    """
    Unlock a password-protected album.
    If password is correct → return full album with assets.
    If album is public → return full album directly.
    """
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Public album
    if not album.password_hash:
        return {
            "unlocked": True,
            "id": album.id,
            "title": album.title,
            "description": album.description,
            "assets": [
                {"id": asset.id, "file_path": asset.file_path, "thumb_path": asset.thumb_path}
                for asset in album.assets
            ],
        }

    # Protected album → check password
    if verify_password(password, album.password_hash):
        return {
            "unlocked": True,
            "id": album.id,
            "title": album.title,
            "description": album.description,
            "assets": [
                {"id": asset.id, "file_path": asset.file_path, "thumb_path": asset.thumb_path}
                for asset in album.assets
            ],
        }

    raise HTTPException(status_code=403, detail="Invalid password")
