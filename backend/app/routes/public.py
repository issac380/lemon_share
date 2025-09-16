from fastapi import APIRouter, Depends, HTTPException, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Album, Asset, SiteSettings
from ..auth import verify_password
import zipfile
import io
import os
from pathlib import Path
import json

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
    List all published albums ordered by display_order.
    Always include is_protected flag, but never include assets.
    """
    albums = db.query(Album).filter(Album.is_published == True).order_by(Album.display_order.asc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "cover_image": a.cover_image,
            "is_protected": bool(a.password_hash),
        }
        for a in albums
    ]

@router.get("/site-settings")
def get_public_site_settings(db: Session = Depends(get_db)):
    """
    Get published site settings for public display.
    """
    settings = db.query(SiteSettings).filter(SiteSettings.is_published == True).first()
    if not settings:
        # Return default settings if none published
        return {
            "site_title": "PORTRAITS BY KT MERRY",
            "site_subtitle": "PHOTO GALLERIES",
            "hero_text": None,
            "footer_text": None,
            "theme_color": "#000000",
            "background_color": "#ffffff",
            "layout_settings": {}
        }
    
    return {
        "site_title": settings.site_title,
        "site_subtitle": settings.site_subtitle,
        "hero_text": settings.hero_text,
        "footer_text": settings.footer_text,
        "theme_color": settings.theme_color,
        "background_color": settings.background_color,
        "layout_settings": settings.layout_settings or {}
    }


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


@router.get("/albums/{album_id}/download")
def download_album(album_id: str, db: Session = Depends(get_db)):
    """
    Download entire album as a ZIP file.
    """
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    if not album.assets:
        raise HTTPException(status_code=400, detail="No images in album")
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for asset in album.assets:
            file_path = Path(asset.file_path)
            if file_path.exists():
                # Add file to zip with original filename
                zip_file.write(file_path, file_path.name)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={album.title.replace(' ', '_')}_full_album.zip"}
    )


@router.post("/albums/{album_id}/download-liked")
def download_liked_images(album_id: str, liked_ids: str = Form(...), db: Session = Depends(get_db)):
    """
    Download only liked images as a ZIP file.
    """
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    try:
        liked_asset_ids = json.loads(liked_ids)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid liked_ids format")
    
    if not liked_asset_ids:
        raise HTTPException(status_code=400, detail="No liked images to download")
    
    # Get liked assets
    liked_assets = db.query(Asset).filter(
        Asset.album_id == album_id,
        Asset.id.in_(liked_asset_ids)
    ).all()
    
    if not liked_assets:
        raise HTTPException(status_code=400, detail="No valid liked images found")
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for asset in liked_assets:
            file_path = Path(asset.file_path)
            if file_path.exists():
                # Add file to zip with original filename
                zip_file.write(file_path, file_path.name)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={album.title.replace(' ', '_')}_liked_images.zip"}
    )
