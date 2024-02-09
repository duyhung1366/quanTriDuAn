import unidecode from 'unidecode';

export function removeAccents(str: string) {
    if (!str) return "";
    return unidecode(str);
}
