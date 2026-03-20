from langchain_text_splitters import RecursiveCharacterTextSplitter
from pdfminer.high_level import extract_text

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, 
    chunk_overlap=200)

def parse_pdf(file_path: str) -> str:
    """Parse a PDF file and return the text."""
    with open(file_path, 'rb') as file:
        content = extract_text(file)
        return content


def chunk_file(file_path: str) -> list[str]:
    content = parse_pdf(file_path)
    chunks = splitter.split_text(content)
    return chunks