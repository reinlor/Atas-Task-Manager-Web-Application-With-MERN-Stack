export function getTaskSnippet(markdown = "", maxLength = 120) {
    const plain = markdown
        .replace(/[#*_`>~-]/g, "")       
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
    if (plain.length <= maxLength) return plain;
    return plain.slice(0, maxLength).trimEnd() + "…";
}
