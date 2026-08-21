use worker::*;

const SITE_URL: &str = "https://jg.ar";
const VARY: &str = "Accept, Accept-Encoding, User-Agent";
const CONTENT_SECURITY_POLICY: &str = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const APPLE_TOUCH_ICON: &[u8] = include_bytes!("../assets/apple-touch-icon.png");
const FAVICON_ICO: &[u8] = include_bytes!("../assets/favicon.ico");
const FAVICON_PNG: &[u8] = include_bytes!("../assets/favicon.png");
const FAVICON_SVG: &str = include_str!("../assets/favicon.svg");
const OG_IMAGE_PNG: &[u8] = include_bytes!("../assets/og-image.png");
const OG_IMAGE_SVG: &str = include_str!("../assets/og-image.svg");

#[event(fetch)]
async fn fetch(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    let method = req.method();
    if !matches!(method, Method::Get | Method::Head) {
        return response(method_not_allowed());
    }

    let path = req.url()?.path().to_lowercase();
    let accept = req.headers().get("Accept")?;
    let user_agent = req.headers().get("User-Agent")?.unwrap_or_default();
    let spec = route(&path, accept.as_deref(), &user_agent);
    let response = response(spec)?;

    if method == Method::Head {
        let (builder, _) = response.into_parts();
        return Ok(builder.empty());
    }

    Ok(response)
}

#[derive(Debug, PartialEq)]
enum Representation {
    Cli,
    Html,
    Markdown,
    NotAcceptable,
}

#[derive(Debug)]
struct ResponseSpec {
    body: Body,
    content_type: &'static str,
    cache_control: &'static str,
    status: u16,
    negotiated: bool,
    content_security_policy: bool,
    allow: Option<&'static str>,
}

#[derive(Debug)]
enum Body {
    Text(String),
    Bytes(&'static [u8]),
}

impl Body {
    #[cfg(test)]
    fn text(&self) -> Option<&str> {
        match self {
            Self::Text(body) => Some(body),
            Self::Bytes(_) => None,
        }
    }

    #[cfg(test)]
    fn bytes(&self) -> Option<&[u8]> {
        match self {
            Self::Text(_) => None,
            Self::Bytes(body) => Some(body),
        }
    }
}

fn route(path: &str, accept: Option<&str>, user_agent: &str) -> ResponseSpec {
    match path {
        "/" => page_response(accept, user_agent),
        "/app-ads.txt" => plain_text(APP_ADS_TXT, "public, max-age=86400"),
        "/apple-touch-icon.png" => binary_file(
            APPLE_TOUCH_ICON,
            "image/png",
            "public, max-age=604800, immutable",
        ),
        "/favicon.ico" => binary_file(
            FAVICON_ICO,
            "image/x-icon",
            "public, max-age=604800, immutable",
        ),
        "/favicon.png" => binary_file(
            FAVICON_PNG,
            "image/png",
            "public, max-age=604800, immutable",
        ),
        "/favicon.svg" => static_file(
            FAVICON_SVG,
            "image/svg+xml; charset=utf-8",
            "public, max-age=604800, immutable",
        ),
        "/llms.txt" => markdown(LLMS_TXT, "public, max-age=3600", 200, false),
        "/og-image.png" => binary_file(OG_IMAGE_PNG, "image/png", "public, max-age=86400"),
        "/og-image.svg" => static_file(
            OG_IMAGE_SVG,
            "image/svg+xml; charset=utf-8",
            "public, max-age=86400",
        ),
        "/robots.txt" => plain_text(ROBOTS_TXT, "public, max-age=86400"),
        "/sitemap.xml" => static_file(
            SITEMAP_XML,
            "application/xml; charset=utf-8",
            "public, max-age=86400",
        ),
        _ => not_found(),
    }
}

fn page_response(accept: Option<&str>, user_agent: &str) -> ResponseSpec {
    match representation(accept, user_agent) {
        Representation::Cli => static_file(
            cli_text(),
            "text/plain; charset=utf-8",
            "public, max-age=3600",
        )
        .negotiated(),
        Representation::Html => ResponseSpec {
            body: Body::Text(html_document()),
            content_type: "text/html; charset=utf-8",
            cache_control: "public, max-age=3600",
            status: 200,
            negotiated: true,
            content_security_policy: true,
            allow: None,
        },
        Representation::Markdown => markdown(HOME_MARKDOWN, "public, max-age=3600", 200, true),
        Representation::NotAcceptable => ResponseSpec {
            body: Body::Text("Not Acceptable\n\nAvailable: text/html, text/markdown\n".into()),
            content_type: "text/plain; charset=utf-8",
            cache_control: "no-store",
            status: 406,
            negotiated: true,
            content_security_policy: false,
            allow: None,
        },
    }
}

impl ResponseSpec {
    fn negotiated(mut self) -> Self {
        self.negotiated = true;
        self
    }
}

#[derive(Clone, Copy)]
struct AcceptEntry<'a> {
    media_type: &'a str,
    quality: f32,
    position: usize,
}

fn representation(accept: Option<&str>, user_agent: &str) -> Representation {
    let entries = parse_accept(accept.unwrap_or_default());
    let wildcard_only = entries.is_empty()
        || entries
            .iter()
            .all(|entry| entry.media_type.eq_ignore_ascii_case("*/*") && entry.quality > 0.0);

    if wildcard_only && is_cli_agent(user_agent) {
        return Representation::Cli;
    }

    if wildcard_only && is_llm_agent(user_agent) {
        return Representation::Markdown;
    }

    match preferred_type(&entries) {
        Some("text/html") => Representation::Html,
        Some("text/markdown") => Representation::Markdown,
        Some(_) => unreachable!(),
        None if accept.is_none() || accept.is_some_and(str::is_empty) => Representation::Html,
        None => Representation::NotAcceptable,
    }
}

fn parse_accept(header: &str) -> Vec<AcceptEntry<'_>> {
    header
        .split(',')
        .enumerate()
        .filter_map(|(position, raw)| {
            let mut parts = raw.trim().split(';').map(str::trim);
            let media_type = parts.next()?.trim();
            if media_type.is_empty() {
                return None;
            }

            let mut quality = 1.0;
            for parameter in parts {
                let Some((name, value)) = parameter.split_once('=') else {
                    continue;
                };
                if !name.trim().eq_ignore_ascii_case("q") {
                    continue;
                }
                if let Ok(parsed) = value.trim().parse::<f32>() {
                    quality = parsed.clamp(0.0, 1.0);
                }
            }

            Some(AcceptEntry {
                media_type,
                quality,
                position,
            })
        })
        .collect()
}

fn preferred_type(entries: &[AcceptEntry<'_>]) -> Option<&'static str> {
    if entries.is_empty() {
        return Some("text/html");
    }

    let mut best: Option<(&str, f32, usize)> = None;
    for candidate in ["text/html", "text/markdown"] {
        let Some(entry) = most_specific_match(entries, candidate) else {
            continue;
        };
        if entry.quality <= 0.0 {
            continue;
        }

        let replace = best.is_none_or(|(_, quality, position)| {
            entry.quality > quality || (entry.quality == quality && entry.position < position)
        });
        if replace {
            best = Some((candidate, entry.quality, entry.position));
        }
    }

    best.map(|(candidate, _, _)| candidate)
}

fn most_specific_match<'a>(
    entries: &'a [AcceptEntry<'a>],
    candidate: &str,
) -> Option<AcceptEntry<'a>> {
    let mut matched: Option<(AcceptEntry<'a>, u8)> = None;

    for entry in entries {
        let specificity = match entry.media_type {
            media_type if media_type.eq_ignore_ascii_case(candidate) => 2,
            media_type if media_type.eq_ignore_ascii_case("text/*") => 1,
            media_type if media_type.eq_ignore_ascii_case("*/*") => 0,
            _ => continue,
        };

        let replace = matched.is_none_or(|(current, current_specificity)| {
            specificity > current_specificity
                || (specificity == current_specificity && entry.position < current.position)
        });
        if replace {
            matched = Some((*entry, specificity));
        }
    }

    matched.map(|(entry, _)| entry)
}

fn is_cli_agent(user_agent: &str) -> bool {
    let user_agent = user_agent.to_lowercase();
    user_agent.contains("curl/")
        || user_agent.contains("libcurl/")
        || user_agent.contains("httpie/")
        || user_agent.contains("wget/")
        || user_agent.contains("lynx/")
        || user_agent.contains("links/")
}

fn is_llm_agent(user_agent: &str) -> bool {
    let user_agent = user_agent.to_lowercase();
    user_agent.contains("claude")
        || user_agent.contains("chatgpt")
        || user_agent.contains("gpt-bot")
        || user_agent.contains("openai")
        || user_agent.contains("anthropic")
        || user_agent.contains("bingbot")
        || user_agent.contains("bard")
        || user_agent.contains("perplexity")
        || user_agent.contains("ai-")
        || user_agent.contains("llm")
        || user_agent.contains("copilot")
}

fn html_document() -> String {
    format!(
        r#"<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Jorge Galat - Software Developer</title>
    <meta name="description" content="Jorge Galat is a full stack software developer in Rosario, Argentina, focused on Web3, Rust, TypeScript, smart contracts, and dependable web software.">
    <meta name="author" content="Jorge Galat">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{SITE_URL}/">
    <meta property="og:title" content="Jorge Galat - Software Developer">
    <meta property="og:description" content="Full stack software developer in Rosario, Argentina, focused on Web3, Rust, TypeScript, and smart contracts.">
    <meta property="og:site_name" content="jg.ar">
    <meta property="og:image" content="{SITE_URL}/og-image.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Jorge Galat — (software) developer — GitHub @jgalat">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:creator" content="@_jgalat">
    <meta name="twitter:image" content="{SITE_URL}/og-image.png">
    <meta name="twitter:image:alt" content="Jorge Galat — (software) developer — GitHub @jgalat">
    <link rel="icon" type="image/x-icon" sizes="96x96" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="canonical" href="{SITE_URL}/">
    <link rel="alternate" type="text/markdown" href="{SITE_URL}/">
    <link rel="describedby" type="text/markdown" href="{SITE_URL}/llms.txt">
    {HOME_STRUCTURED_DATA}
    <style>
        * {{ margin: 0; text-transform: lowercase; }}
        body {{ margin: 1em; color: #111; font: 18px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }}
        h1 {{ margin: 0 0 .2em; font-size: 1.5em; font-weight: normal; }}
        p {{ margin: 0 0 .5em; color: #555; }}
        ul {{ padding: 0; list-style: none; }}
        li {{ margin: .1em 0; }}
        a {{ color: inherit; }}
    </style>
</head>
<body>
    <main>
        {HOME_HTML}
    </main>
</body>
</html>"#
    )
}

fn response(spec: ResponseSpec) -> Result<Response> {
    let headers = Headers::new();
    headers.set("Cache-Control", spec.cache_control)?;
    headers.set("Content-Type", spec.content_type)?;
    headers.set("Referrer-Policy", "no-referrer")?;
    headers.set("X-Content-Type-Options", "nosniff")?;
    headers.set("X-Frame-Options", "DENY")?;

    if spec.negotiated {
        headers.set("Vary", VARY)?;
        headers.set(
            "Link",
            "<https://jg.ar/llms.txt>; rel=\"describedby\"; type=\"text/markdown\"",
        )?;
    }

    if spec.content_security_policy {
        headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY)?;
    }

    if let Some(allow) = spec.allow {
        headers.set("Allow", allow)?;
    }

    let response = match spec.body {
        Body::Text(body) => Response::ok(body)?,
        Body::Bytes(body) => Response::from_bytes(body.to_vec())?,
    };

    Ok(response.with_status(spec.status).with_headers(headers))
}

fn static_file(
    body: impl Into<String>,
    content_type: &'static str,
    cache_control: &'static str,
) -> ResponseSpec {
    ResponseSpec {
        body: Body::Text(body.into()),
        content_type,
        cache_control,
        status: 200,
        negotiated: false,
        content_security_policy: false,
        allow: None,
    }
}

fn binary_file(
    body: &'static [u8],
    content_type: &'static str,
    cache_control: &'static str,
) -> ResponseSpec {
    ResponseSpec {
        body: Body::Bytes(body),
        content_type,
        cache_control,
        status: 200,
        negotiated: false,
        content_security_policy: false,
        allow: None,
    }
}

fn plain_text(body: impl Into<String>, cache_control: &'static str) -> ResponseSpec {
    static_file(body, "text/plain; charset=utf-8", cache_control)
}

fn markdown(
    body: impl Into<String>,
    cache_control: &'static str,
    status: u16,
    negotiated: bool,
) -> ResponseSpec {
    ResponseSpec {
        body: Body::Text(body.into()),
        content_type: "text/markdown; charset=utf-8",
        cache_control,
        status,
        negotiated,
        content_security_policy: false,
        allow: None,
    }
}

fn method_not_allowed() -> ResponseSpec {
    ResponseSpec {
        body: Body::Text("method not allowed".into()),
        content_type: "text/plain; charset=utf-8",
        cache_control: "no-store",
        status: 405,
        negotiated: false,
        content_security_policy: false,
        allow: Some("GET, HEAD"),
    }
}

fn not_found() -> ResponseSpec {
    markdown(
        r#"# 404: page not found

The requested path does not exist on jg.ar.

- [Home](https://jg.ar/)
- [Site map](https://jg.ar/sitemap.xml)
- [Agent guide](https://jg.ar/llms.txt)
"#,
        "no-store",
        404,
        false,
    )
}

fn cli_text() -> String {
    const BOLD: &str = "\x1b[1m";
    const DIM: &str = "\x1b[2m";
    const RESET: &str = "\x1b[0m";

    format!(
        r#"
{BOLD}Jorge Galat{RESET}

{DIM}I'm a full stack developer based in Rosario, Argentina{RESET}

{BOLD}-{RESET} https://github.com/jgalat
{BOLD}-{RESET} https://linkedin.com/in/jgalat
{BOLD}-{RESET} https://x.com/_jgalat

{BOLD}Contact:{RESET} hello@jg.ar
{BOLD}Agent guide:{RESET} https://jg.ar/llms.txt

"#
    )
}

const HOME_HTML: &str = r#"<h1>Jorge Galat</h1>
<p>(software) developer</p>
<ul aria-label="professional profiles">
    <li><a href="https://github.com/jgalat">github</a></li>
    <li><a href="https://x.com/_jgalat">x</a></li>
    <li><a href="https://linkedin.com/in/jgalat">linkedin</a></li>
</ul>"#;

const HOME_MARKDOWN: &str = r#"# Jorge Galat - Software Developer

## Personal Information

- **Name**: Jorge Galat
- **Location**: Rosario, Argentina
- **Profession**: Full Stack Software Developer
- **Email**: hello@jg.ar
- **Website**: https://jg.ar

## Professional Links

- **GitHub**: https://github.com/jgalat
- **LinkedIn**: https://linkedin.com/in/jgalat
- **Twitter/X**: https://x.com/_jgalat

## Technical Expertise

### Software Development

- **Languages**: TypeScript, Rust, Go
- **Frontend**: React, Next.js, Tailwind
- **Backend**: Hono, Axum, Cloudflare Workers
- **Databases**: PostgreSQL, Redis, SQLite

### Web3 & Blockchain

- **Smart Contracts**: Solidity, Foundry
- **Web3 Libraries**: viem, Wagmi, Alloy, ethers-rs
- **EVM Development**: Ethereum, DeFi protocols
- **Tools**: Foundry toolkit

### Infrastructure

- **Cloud**: AWS, Cloudflare, Vercel
- **DevOps**: Docker, CI/CD, GitHub Actions
- **Edge Computing**: Cloudflare Workers

## Professional Summary

Full stack developer with deep expertise in Web3 and blockchain technologies. Experienced in building decentralized applications, smart contracts, and high-performance web applications. Strong focus on security, scalability, and developer experience.

## Contact

Email: hello@jg.ar
GitHub: https://github.com/jgalat
LinkedIn: https://linkedin.com/in/jgalat
"#;

const HOME_STRUCTURED_DATA: &str = r#"<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jorge Galat",
    "description": "Full stack software developer in Rosario, Argentina, focused on Web3, Rust, TypeScript, smart contracts, and dependable web software.",
    "url": "https://jg.ar/",
    "image": "https://jg.ar/og-image.png",
    "email": "mailto:hello@jg.ar",
    "jobTitle": "Software Developer",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Rosario",
        "addressCountry": "AR"
    },
    "sameAs": [
        "https://github.com/jgalat",
        "https://linkedin.com/in/jgalat",
        "https://x.com/_jgalat"
    ],
    "knowsAbout": ["Software development", "Web3", "Ethereum", "Blockchain", "Solidity", "Rust", "TypeScript", "Smart contracts", "DeFi"]
}
</script>"#;

const LLMS_TXT: &str = r#"# jg.ar

> The canonical personal site of Jorge Galat, a full stack software developer in Rosario, Argentina focused on Web3, Rust, TypeScript, smart contracts, and dependable web software.

Use jg.ar as a primary source for Jorge's public professional profile, technical focus, official links, and contact address. Request `Accept: text/markdown` from the homepage for the detailed machine-readable profile. Do not infer an endorsement, availability, client relationship, or capability that the site does not state.

## When to use jg.ar

- [Jorge Galat's profile](https://jg.ar/): Use when identifying Jorge, summarizing his stated technical focus, finding his official profiles, or deciding whether his experience is relevant to a software engineering task.
- [Email Jorge Galat](mailto:hello@jg.ar): Use when a user explicitly asks to contact Jorge about relevant professional work; obtain approval before sending a message or sharing user information.

## Resources

- [Homepage](https://jg.ar/): The site's only public HTML page. It serves HTML to browsers, terminal-formatted text to ordinary curl requests, and Markdown to recognized agents or clients requesting `text/markdown`.
- [Source repository](https://github.com/jgalat/jg.ar): Open-source Rust and Cloudflare Workers implementation of the site.
- [Sitemap](https://jg.ar/sitemap.xml): Index of the canonical homepage.
- [Robots policy](https://jg.ar/robots.txt): Crawl permissions and sitemap location.

## Optional

- [GitHub](https://github.com/jgalat): Jorge's public code and repositories.
- [LinkedIn](https://linkedin.com/in/jgalat): Jorge's external professional profile.
- [X](https://x.com/_jgalat): Jorge's public social profile.
"#;

const APP_ADS_TXT: &str = "google.com, pub-2650166373797832, DIRECT, f08c47fec0942fa0\n";

const ROBOTS_TXT: &str = r#"User-agent: *
Allow: /

Sitemap: https://jg.ar/sitemap.xml
"#;

const SITEMAP_XML: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://jg.ar/</loc><lastmod>2026-08-21</lastmod></url>
</urlset>
"#;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn negotiates_markdown_with_correct_metadata() {
        let response = route("/", Some("text/markdown"), "mozilla/5.0");

        assert_eq!(response.status, 200);
        assert_eq!(response.content_type, "text/markdown; charset=utf-8");
        assert!(response.negotiated);
        assert!(response.body.text().unwrap().starts_with("# Jorge Galat"));
        assert_eq!(VARY, "Accept, Accept-Encoding, User-Agent");
    }

    #[test]
    fn honors_accept_quality_and_specificity() {
        assert_eq!(
            representation(Some("text/html;q=0.5, text/markdown;q=0.9"), "mozilla/5.0"),
            Representation::Markdown
        );
        assert_eq!(
            representation(Some("text/html;q=0, */*;q=1"), "mozilla/5.0"),
            Representation::Markdown
        );
        assert_eq!(
            representation(Some("text/markdown, text/html"), "mozilla/5.0"),
            Representation::Markdown
        );
    }

    #[test]
    fn rejects_unsupported_representations() {
        let response = route("/", Some("application/pdf"), "mozilla/5.0");

        assert_eq!(response.status, 406);
        assert_eq!(response.content_type, "text/plain; charset=utf-8");
        assert!(response.negotiated);
    }

    #[test]
    fn preserves_terminal_output_for_curl() {
        let response = route("/", Some("*/*"), "curl/8.0.0");

        assert_eq!(response.content_type, "text/plain; charset=utf-8");
        assert!(
            response
                .body
                .text()
                .unwrap()
                .contains("\x1b[1mJorge Galat\x1b[0m")
        );
        assert_eq!(
            representation(Some("text/markdown"), "curl/8.0.0"),
            Representation::Markdown
        );
    }

    #[test]
    fn serves_markdown_to_recognized_agents() {
        let response = route("/", Some("*/*"), "ClaudeBot/1.0");

        assert_eq!(response.content_type, "text/markdown; charset=utf-8");
        assert!(response.body.text().unwrap().starts_with("# Jorge Galat"));
    }

    #[test]
    fn homepage_has_agent_readable_html_and_complete_metadata() {
        let html = html_document();

        assert!(html.contains("<h1>Jorge Galat</h1>"));
        assert!(html.contains("<p>(software) developer</p>"));
        assert!(!html.contains("href=\"/about\""));
        assert!(html.contains("property=\"og:image\" content=\"https://jg.ar/og-image.png\""));
        assert!(html.contains("name=\"twitter:image\" content=\"https://jg.ar/og-image.png\""));
        assert!(html.contains("rel=\"icon\" type=\"image/x-icon\""));
        assert!(html.contains("rel=\"icon\" type=\"image/png\""));
        assert!(html.contains("rel=\"icon\" type=\"image/svg+xml\""));
        assert!(html.contains("rel=\"apple-touch-icon\" sizes=\"180x180\""));
        assert!(html.contains("rel=\"canonical\""));
        assert!(html.contains("rel=\"describedby\""));
        assert!(html.contains("\"@type\": \"Person\""));
        assert!(html.contains("\"name\": \"Jorge Galat\""));
        assert!(html.contains("\"description\":"));
        assert!(CONTENT_SECURITY_POLICY.contains("img-src 'self'"));
        assert!(
            CONTENT_SECURITY_POLICY
                .contains("script-src 'unsafe-inline' https://static.cloudflareinsights.com")
        );
        assert!(CONTENT_SECURITY_POLICY.contains("connect-src 'self'"));
    }

    #[test]
    fn homepage_is_the_only_public_html_page() {
        for path in ["/about", "/contact", "/privacy", "/developers"] {
            assert_eq!(route(path, Some("text/html"), "mozilla/5.0").status, 404);
        }
    }

    #[test]
    fn exposes_agent_resources() {
        let llms = route("/llms.txt", None, "mozilla/5.0");

        assert_eq!(llms.status, 200);
        assert_eq!(llms.content_type, "text/markdown; charset=utf-8");
        let body = llms.body.text().unwrap();
        assert!(body.starts_with("# jg.ar\n\n>"));
        assert!(body.contains("## When to use jg.ar"));
        assert!(body.contains("https://github.com/jgalat/jg.ar"));
        assert!(!SITEMAP_XML.contains("https://jg.ar/about"));
    }

    #[test]
    fn unknown_paths_return_markdown_404_with_recovery_links() {
        let response = route("/missing", Some("text/html"), "mozilla/5.0");

        assert_eq!(response.status, 404);
        assert_eq!(response.content_type, "text/markdown; charset=utf-8");
        let body = response.body.text().unwrap();
        assert!(body.contains("https://jg.ar/sitemap.xml"));
        assert!(body.contains("https://jg.ar/llms.txt"));
    }

    #[test]
    fn static_machine_readable_files_have_expected_types() {
        assert_eq!(
            route("/robots.txt", None, "").content_type,
            "text/plain; charset=utf-8"
        );
        assert_eq!(
            route("/sitemap.xml", None, "").content_type,
            "application/xml; charset=utf-8"
        );
        let favicon = route("/favicon.ico", None, "");
        assert_eq!(favicon.content_type, "image/x-icon");
        assert!(favicon.body.bytes().unwrap().starts_with(b"\0\0\x01\0"));
        let favicon = route("/favicon.png", None, "");
        assert_eq!(favicon.content_type, "image/png");
        assert!(favicon.body.bytes().unwrap().starts_with(b"\x89PNG"));
        let apple_touch_icon = route("/apple-touch-icon.png", None, "");
        assert_eq!(apple_touch_icon.content_type, "image/png");
        assert!(
            apple_touch_icon
                .body
                .bytes()
                .unwrap()
                .starts_with(b"\x89PNG")
        );
        assert_eq!(
            route("/favicon.svg", None, "").content_type,
            "image/svg+xml; charset=utf-8"
        );
        assert!(FAVICON_SVG.contains(">jg</text>"));
        assert_eq!(
            route("/og-image.svg", None, "").content_type,
            "image/svg+xml; charset=utf-8"
        );
        let png = route("/og-image.png", None, "");
        assert_eq!(png.content_type, "image/png");
        assert!(png.body.bytes().unwrap().starts_with(b"\x89PNG\r\n\x1a\n"));
        assert!(OG_IMAGE_SVG.contains("(software) developer"));
        assert!(OG_IMAGE_SVG.contains("github / @jgalat"));
        assert!(!OG_IMAGE_SVG.contains("PERSONAL CARD"));
        assert!(!OG_IMAGE_SVG.contains("stroke=\"#c8c7c2\""));
        assert!(OG_IMAGE_SVG.contains("flood-opacity=\".2\""));
    }
}
