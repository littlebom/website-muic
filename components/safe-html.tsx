"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface SafeHTMLProps {
    html: string;
    className?: string;
    /**
     * Allowed tags - if not specified, uses default safe tags
     */
    allowedTags?: string[];
    /**
     * Allow iframes (for maps, videos) - default false for maximum security
     */
    allowIframes?: boolean;
    /**
     * Allow only specific iframe sources (e.g., google.com/maps)
     */
    allowedIframeSources?: string[];
}

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

/**
 * SafeHTML Component - Renders HTML content safely by sanitizing it with DOMPurify
 * 
 * This protects against XSS attacks by removing:
 * - <script> tags
 * - Event handlers (onclick, onerror, etc.)
 * - JavaScript URLs (javascript:)
 * - Data URLs that could execute code
 * 
 * @example
 * // Basic usage
 * <SafeHTML html={content} className="prose" />
 * 
 * @example
 * // Allow iframes for Google Maps
 * <SafeHTML 
 *   html={mapContent} 
 *   allowIframes 
 *   allowedIframeSources={["google.com", "youtube.com"]} 
 * />
 */
export function SafeHTML({
    html,
    className,
    allowedTags,
    allowIframes = false,
    allowedIframeSources = [],
}: SafeHTMLProps) {
    const sanitizedHTML = useMemo(() => {
        if (!html) return "";

        // Configure DOMPurify - using any to avoid type conflicts with different DOMPurify versions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
            ALLOWED_TAGS: allowedTags || DEFAULT_ALLOWED_TAGS,
            ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
            ALLOW_DATA_ATTR: false, // Prevent data-* attributes that could be used maliciously
            FORBID_TAGS: ["script", "style", "noscript", "object", "embed", "form", "input", "button"],
            FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
        };

        // Add iframe support if allowed
        if (allowIframes) {
            config.ALLOWED_TAGS = [...(config.ALLOWED_TAGS as string[]), "iframe"];
            config.ADD_ATTR = ["allowfullscreen", "frameborder", "loading", "referrerpolicy"];

            // Hook to validate iframe sources
            if (allowedIframeSources.length > 0) {
                DOMPurify.addHook("uponSanitizeElement", (node, data) => {
                    if (data.tagName === "iframe") {
                        const element = node as Element;
                        const src = element.getAttribute?.("src") || "";
                        const isAllowed = allowedIframeSources.some(
                            (source) => src.includes(source)
                        );
                        if (!isAllowed && element.parentNode) {
                            element.parentNode.removeChild(element);
                        }
                    }
                });
            }
        }

        // Sanitize the HTML
        const clean = DOMPurify.sanitize(html, config);

        // Remove the hook after use to prevent memory leaks
        if (allowIframes && allowedIframeSources.length > 0) {
            DOMPurify.removeHook("uponSanitizeElement");
        }

        return clean;
    }, [html, allowedTags, allowIframes, allowedIframeSources]);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
    );
}

/**
 * SafeIframe Component - Renders only allowed iframes safely
 * Specifically for Google Maps, YouTube, etc.
 */
interface SafeIframeProps {
    html: string;
    className?: string;
    allowedSources?: string[];
}

const DEFAULT_ALLOWED_IFRAME_SOURCES = [
    "google.com/maps",
    "youtube.com",
    "youtube-nocookie.com",
    "vimeo.com",
    "player.vimeo.com",
];

export function SafeIframe({
    html,
    className,
    allowedSources = DEFAULT_ALLOWED_IFRAME_SOURCES,
}: SafeIframeProps) {
    return (
        <SafeHTML
            html={html}
            className={className}
            allowIframes
            allowedIframeSources={allowedSources}
            allowedTags={["iframe", "div"]}
        />
    );
}

/**
 * Utility function to sanitize HTML string without React component
 * Useful for APIs or server-side validation
 */
export function sanitizeHTML(html: string, allowIframes = false): string {
    if (typeof window === "undefined") {
        // Server-side: Return empty or use server-side sanitizer
        // DOMPurify requires DOM, so on server we strip all HTML
        return html.replace(/<[^>]*>/g, "");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
        ALLOWED_TAGS: allowIframes
            ? [...DEFAULT_ALLOWED_TAGS, "iframe"]
            : DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
        FORBID_TAGS: ["script", "style", "noscript", "object", "embed", "form", "input", "button"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    };

    return String(DOMPurify.sanitize(html, config));
}
