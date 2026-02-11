/**
 * Server-side HTML Sanitization using isomorphic-dompurify
 * Can be used in both Server Components and Client Components
 */
import DOMPurify from "isomorphic-dompurify";

// Default safe tags (no script, no event handlers)
const DEFAULT_ALLOWED_TAGS = [
    "a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote",
    "br", "caption", "cite", "code", "col", "colgroup", "data", "dd", "del",
    "details", "dfn", "div", "dl", "dt", "em", "figcaption", "figure", "footer",
    "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "i", "img",
    "ins", "kbd", "li", "main", "mark", "nav", "ol", "p", "pre", "q", "rp", "rt",
    "ruby", "s", "samp", "section", "small", "span", "strong", "sub", "summary",
    "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u",
    "ul", "var", "wbr"
];

// Safe attributes
const DEFAULT_ALLOWED_ATTR = [
    "href", "src", "alt", "title", "class", "id", "name", "target", "rel",
    "width", "height", "style", "colspan", "rowspan", "headers", "scope",
    "datetime", "cite", "lang", "dir"
];

interface SanitizeOptions {
    allowIframes?: boolean;
    allowedIframeSources?: string[];
}

/**
 * Sanitize HTML string for safe rendering
 * Works on both server and client side
 * 
 * @example
 * // In Server Component
 * const safeContent = sanitize(unsafeHTML);
 * <div dangerouslySetInnerHTML={{ __html: safeContent }} />
 */
export function sanitize(html: string, options: SanitizeOptions = {}): string {
    if (!html) return "";

    const { allowIframes = false, allowedIframeSources = [] } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
        ALLOWED_TAGS: allowIframes
            ? [...DEFAULT_ALLOWED_TAGS, "iframe"]
            : DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: allowIframes
            ? [...DEFAULT_ALLOWED_ATTR, "allowfullscreen", "frameborder", "loading", "referrerpolicy"]
            : DEFAULT_ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ["script", "style", "noscript", "object", "embed", "form", "input", "button"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onsubmit"],
    };

    let sanitized = String(DOMPurify.sanitize(html, config));

    // Additional check for iframes - validate sources
    if (allowIframes && allowedIframeSources.length > 0) {
        // Remove iframes that don't match allowed sources
        sanitized = sanitized.replace(
            /<iframe[^>]*src=["']([^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi,
            (match, src) => {
                const isAllowed = allowedIframeSources.some(source => src.includes(source));
                return isAllowed ? match : "";
            }
        );
    }

    return sanitized;
}

/**
 * Component for rendering sanitized HTML in Server Components
 */
interface ServerSafeHTMLProps {
    html: string;
    className?: string;
    allowIframes?: boolean;
    allowedIframeSources?: string[];
}

export function ServerSafeHTML({
    html,
    className,
    allowIframes = false,
    allowedIframeSources = [],
}: ServerSafeHTMLProps) {
    const sanitized = sanitize(html, { allowIframes, allowedIframeSources });

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}
