import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, Form, HTTPException, File
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List
from ..db import SessionLocal
from ..models import Album, Asset, SiteSettings
from ..auth import hash_password

router = APIRouter(prefix="/api/admin")
MEDIA_ROOT = Path("media/albums")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/albums")
def list_albums_admin(db: Session = Depends(get_db)):
    """
    List all albums for admin (including unpublished).
    """
    albums = db.query(Album).order_by(Album.display_order.asc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "cover_image": a.cover_image,
            "is_protected": bool(a.password_hash),
            "is_published": a.is_published,
            "display_order": a.display_order,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in albums
    ]

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

# Site Settings Management
@router.get("/site-settings")
def get_site_settings(db: Session = Depends(get_db)):
    settings = db.query(SiteSettings).first()
    if not settings:
        # Create default settings
        settings = SiteSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "id": settings.id,
        "site_title": settings.site_title,
        "site_subtitle": settings.site_subtitle,
        "hero_text": settings.hero_text,
        "footer_text": settings.footer_text,
        "theme_color": settings.theme_color,
        "background_color": settings.background_color,
        "layout_settings": settings.layout_settings or {},
        "is_published": settings.is_published
    }

@router.put("/site-settings")
def update_site_settings(
    site_title: str = Form(None),
    site_subtitle: str = Form(None),
    hero_text: str = Form(None),
    footer_text: str = Form(None),
    theme_color: str = Form(None),
    background_color: str = Form(None),
    db: Session = Depends(get_db)
):
    settings = db.query(SiteSettings).first()
    if not settings:
        settings = SiteSettings()
        db.add(settings)
    
    if site_title is not None:
        settings.site_title = site_title
    if site_subtitle is not None:
        settings.site_subtitle = site_subtitle
    if hero_text is not None:
        settings.hero_text = hero_text
    if footer_text is not None:
        settings.footer_text = footer_text
    if theme_color is not None:
        settings.theme_color = theme_color
    if background_color is not None:
        settings.background_color = background_color
    
    db.commit()
    db.refresh(settings)
    return {"message": "Site settings updated successfully"}

# Album Reordering
@router.put("/albums/reorder")
def reorder_albums(album_orders: List[dict], db: Session = Depends(get_db)):
    """
    Reorder albums based on provided order
    album_orders should be: [{"id": "album_id", "order": 0}, ...]
    """
    for item in album_orders:
        album = db.query(Album).filter(Album.id == item["id"]).first()
        if album:
            album.display_order = item["order"]
    
    db.commit()
    return {"message": "Albums reordered successfully"}

# Album Publish/Unpublish
@router.put("/albums/{album_id}/publish")
def toggle_album_publish(album_id: str, is_published: bool = Form(...), db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    album.is_published = is_published
    db.commit()
    return {"id": album.id, "is_published": album.is_published}
