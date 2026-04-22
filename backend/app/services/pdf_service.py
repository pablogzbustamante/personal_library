import os
from typing import Optional, Tuple


def extract_pdf_metadata(
    file_path: str, user_id: str, file_id: str
) -> Tuple[Optional[int], Optional[str]]:
    """Extract page count and optionally generate a cover image from a PDF.

    Cover generation requires poppler (pdf2image). If not available, cover_path
    will be None and the client can display a placeholder instead.
    """
    page_count: Optional[int] = None
    cover_path: Optional[str] = None

    # Extract page count using pypdf (pure Python, no system deps)
    try:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        page_count = len(reader.pages)
    except Exception:
        pass

    # Generate cover image from the first page (requires poppler installed)
    try:
        from pdf2image import convert_from_path

        covers_dir = os.path.join("storage", "covers", user_id)
        os.makedirs(covers_dir, exist_ok=True)
        images = convert_from_path(file_path, first_page=1, last_page=1, dpi=150)
        if images:
            cover_filename = f"{file_id}_cover.jpg"
            cover_path = os.path.join(covers_dir, cover_filename)
            images[0].save(cover_path, "JPEG")
    except Exception:
        pass

    return page_count, cover_path
