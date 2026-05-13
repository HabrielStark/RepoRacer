def normalize_title(value: str) -> str:
    return " ".join(value.strip().split()).title()
