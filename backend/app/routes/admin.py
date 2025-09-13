import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, Form, HTTPException, File
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
from ..db import SessionLocal
from ..models import Album, Asset
from ..auth import hash_password

router = APIRouter(prefix="/api/admin")
MEDIA_ROOT = Path("media/albums")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/albums/{album_id}")
def get_album_admin(album_id: str, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    return {
        "id": album.id,
        "title": album.title,
        "description": album.description,
        "is_protected": bool(album.password_hash),
        "assets": [
            {"id": a.id, "file_path": a.file_path, "thumb_path": a.thumb_path}
            for a in album.assets
        ],
    }

@router.post("/albums")
def create_album(
    title: str = Form(...),
    description: str = Form(None),
    password: str = Form(None),
    db: Session = Depends(get_db)
):
    album = Album(
        title=title,
        description=description,
        password_hash=hash_password(password) if password else None,
    )
    db.add(album)
    db.commit()
    db.refresh(album)
    return {"id": album.id, "title": album.title, "is_protected": bool(album.password_hash)}

@router.post("/albums/{album_id}/upload")
def upload_asset(album_id: str, file: UploadFile, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    album_dir = MEDIA_ROOT / album_id
    album_dir.mkdir(parents=True, exist_ok=True)
    file_path = album_dir / file.filename

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    asset = Asset(album_id=album_id, file_path=str(file_path))
    db.add(asset)
    db.commit()
    db.refresh(asset)

    if not album.cover_image:
        album.cover_image = str(file_path)
        db.commit()

    return {"id": asset.id, "file_path": asset.file_path}

@router.post("/albums/{album_id}/upload-multiple")
def upload_multiple_assets(album_id: str, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    album_dir = MEDIA_ROOT / album_id
    album_dir.mkdir(parents=True, exist_ok=True)

    uploaded_assets = []
    for file in files:
        file_path = album_dir / file.filename
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        asset = Asset(album_id=album_id, file_path=str(file_path))
        db.add(asset)
        db.commit()
        db.refresh(asset)
        uploaded_assets.append({"id": asset.id, "file_path": asset.file_path})

        if not album.cover_image:
            album.cover_image = str(file_path)
            db.commit()

    return {"uploaded": uploaded_assets}

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.file_path and os.path.exists(asset.file_path):
        os.remove(asset.file_path)

    db.delete(asset)
    db.commit()
    return {"deleted": asset_id}

@router.delete("/albums/{album_id}")
def delete_album(album_id: str, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    album_dir = MEDIA_ROOT / album_id
    if album_dir.exists():
        shutil.rmtree(album_dir)

    db.delete(album)
    db.commit()
    return {"deleted": album_id}

# Optional: update album password
@router.put("/albums/{album_id}/password")
def update_album_password(album_id: str, password: str = Form(None), db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    album.password_hash = hash_password(password) if password else None
    db.commit()
    return {"id": album.id, "is_protected": bool(album.password_hash)}
