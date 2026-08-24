import os
import sys

def main():
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("installing fitz")
        os.system(sys.executable + " -m pip install pymupdf")
        import fitz

    doc = fitz.open("Miraya Brand Identity.pdf")
    page = doc.load_page(0)  # first page
    pix = page.get_pixmap(dpi=300)
    pix.save("public/logo.png")
    print("Logo saved as public/logo.png")

if __name__ == "__main__":
    main()
