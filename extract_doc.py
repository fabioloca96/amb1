from docx import Document

doc = Document("08-07 Ispettorato Micologico 2026.doc")
for p in doc.paragraphs:
    if p.text.strip():
        print(p.text)
