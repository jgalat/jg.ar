use worker::*;

#[event(fetch)]
async fn fetch(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    let method = req.method();
    if !matches!(method, Method::Get | Method::Head) {
        return method_not_allowed();
    }

    let path = req.url()?.path().to_lowercase();
    let response = match path.as_str() {
        "/" => root_response(&req)?,
        "/app-ads.txt" => app_ads_txt_response()?,
        "/robots.txt" => robots_txt_response()?,
        "/sitemap.xml" => sitemap_xml_response()?,
        _ => not_found()?,
    };

    if method == Method::Head {
        let (builder, _) = response.into_parts();
        return Ok(builder.empty());
    }

    Ok(response)
}

fn root_response(req: &Request) -> Result<Response> {
    let accept = req
        .headers()
        .get("Accept")?
        .unwrap_or_default()
        .to_lowercase();
    let user_agent = req
        .headers()
        .get("User-Agent")?
        .unwrap_or_default()
        .to_lowercase();

    match representation(&accept, &user_agent) {
        Representation::Cli => cli_response(),
        Representation::Llm => llm_response(),
        Representation::Html => html_response(),
    }
}

#[derive(Debug, PartialEq)]
enum Representation {
    Cli,
    Html,
    Llm,
}

fn representation(accept: &str, user_agent: &str) -> Representation {
    if accept.contains("text/plain") || accept.contains("text/markdown") {
        return Representation::Llm;
    }

    if is_cli_agent(user_agent) {
        return Representation::Cli;
    }

    if is_llm_agent(user_agent) {
        return Representation::Llm;
    }

    Representation::Html
}

fn is_cli_agent(user_agent: &str) -> bool {
    user_agent.contains("curl/")
        || user_agent.contains("libcurl/")
        || user_agent.contains("httpie/")
        || user_agent.contains("wget/")
        || user_agent.contains("lynx/")
        || user_agent.contains("links/")
}

fn is_llm_agent(user_agent: &str) -> bool {
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

fn cli_response() -> Result<Response> {
    const BOLD: &str = "\x1b[1m";
    const DIM: &str = "\x1b[2m";
    const RESET: &str = "\x1b[0m";

    let text = format!(
        r#"
{BOLD}Jorge Galat{RESET}

{DIM}I'm a full stack developer based in Rosario, Argentina{RESET}

{BOLD}-{RESET} https://github.com/jgalat
{BOLD}-{RESET} https://linkedin.com/in/jgalat
{BOLD}-{RESET} https://x.com/_jgalat

{BOLD}Contact:{RESET} hello@jg.ar

"#
    );

    static_response(
        text,
        "text/plain; charset=utf-8",
        "public, max-age=3600",
        true,
        false,
        200,
    )
}

fn llm_response() -> Result<Response> {
    let text = r#"# Jorge Galat - Software Developer

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
- **Web3 Libraries**: viem, Wagmi, alloy, ethers-rs
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

    static_response(
        text,
        "text/plain; charset=utf-8",
        "public, max-age=3600",
        true,
        false,
        200,
    )
}

fn app_ads_txt_response() -> Result<Response> {
    let app_ads_txt = "google.com, pub-2650166373797832, DIRECT, f08c47fec0942fa0\n";

    static_response(
        app_ads_txt,
        "text/plain; charset=utf-8",
        "public, max-age=86400",
        false,
        false,
        200,
    )
}

fn robots_txt_response() -> Result<Response> {
    let robots_txt = r#"User-agent: *
Allow: /

Sitemap: https://jg.ar/sitemap.xml"#;

    static_response(
        robots_txt,
        "text/plain; charset=utf-8",
        "public, max-age=86400",
        false,
        false,
        200,
    )
}

fn sitemap_xml_response() -> Result<Response> {
    let sitemap = r#"<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://jg.ar/</loc>
        <lastmod>2025-11-12</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>"#;

    static_response(
        sitemap,
        "application/xml; charset=utf-8",
        "public, max-age=86400",
        false,
        false,
        200,
    )
}

fn html_response() -> Result<Response> {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jorge Galat - Software Developer</title>
    <meta name="description" content="Jorge Galat is a full stack software developer based in Rosario, Argentina. Specializing in Web3, blockchain, Rust, TypeScript, and smart contract development.">
    <meta name="keywords" content="Jorge Galat, software developer, full stack developer, Web3 developer, blockchain developer, Solidity, Rust developer, TypeScript developer, smart contracts, DeFi, Rosario Argentina">
    <meta name="author" content="Jorge Galat">

    <meta property="og:type" content="website">
    <meta property="og:url" content="https://jg.ar/">
    <meta property="og:title" content="Jorge Galat - Software Developer">
    <meta property="og:description" content="Full stack software developer based in Rosario, Argentina. Specializing in Web3, blockchain, Rust, TypeScript, and smart contract development.">
    <meta property="og:site_name" content="Jorge Galat">

    <meta property="twitter:card" content="summary">
    <meta property="twitter:url" content="https://jg.ar/">
    <meta property="twitter:title" content="Jorge Galat - Software Developer">
    <meta property="twitter:description" content="Full stack software developer based in Rosario, Argentina.">
    <meta property="twitter:creator" content="@_jgalat">

    <link rel="canonical" href="https://jg.ar/">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Jorge Galat",
        "url": "https://jg.ar",
        "email": "hello@jg.ar",
        "jobTitle": "Software Developer",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Rosario",
            "addressCountry": "Argentina"
        },
        "sameAs": [
            "https://github.com/jgalat",
            "https://linkedin.com/in/jgalat",
            "https://twitter.com/_jgalat"
        ],
        "knowsAbout": ["Software Development", "Web3", "Blockchain", "Solidity", "Rust", "TypeScript", "Web Development", "Full Stack Development", "Smart Contracts", "DeFi"]
    }
    </script>

    <style>
        * {
            margin: 0; 
            text-transform: lowercase;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            margin: 1em;
            line-height: 1.5;
            font-size: 18px;
            color: #111;
        }
        h1 {
            font-weight: normal;
            font-size: 1.5em;
            margin: 0 0 0.2em 0;
        }
        p {
            margin: 0 0 0.5em 0;
            color: #555;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        li {
            margin: 0.1em 0;
        }
        a {
            color: inherit;
        }
    </style>
</head>
<body>
    <main role="main">
        <h1>Jorge Galat</h1>
        <p>(software) developer</p>
        <ul>
            <li><a href="https://github.com/jgalat">github</a></li>
            <li><a href="https://x.com/_jgalat">x</a></li>
            <li><a href="https://linkedin.com/in/jgalat">linkedin</a></li>
        </ul>
    </main>
</body>
</html>"#;

    static_response(
        html,
        "text/html; charset=utf-8",
        "public, max-age=3600",
        true,
        true,
        200,
    )
}

fn static_response(
    body: impl Into<String>,
    content_type: &str,
    cache_control: &str,
    vary: bool,
    content_security_policy: bool,
    status: u16,
) -> Result<Response> {
    let headers = Headers::new();
    headers.set("Cache-Control", cache_control)?;
    headers.set("Content-Type", content_type)?;
    headers.set("Referrer-Policy", "no-referrer")?;
    headers.set("X-Content-Type-Options", "nosniff")?;
    headers.set("X-Frame-Options", "DENY")?;

    if vary {
        headers.set("Vary", "Accept, User-Agent")?;
    }

    if content_security_policy {
        headers.set(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        )?;
    }

    Ok(Response::ok(body)?
        .with_status(status)
        .with_headers(headers))
}

fn method_not_allowed() -> Result<Response> {
    let response = static_response(
        "method not allowed",
        "text/plain; charset=utf-8",
        "no-store",
        false,
        false,
        405,
    )?;
    let headers = response.headers().clone();
    headers.set("Allow", "GET, HEAD")?;
    Ok(response.with_headers(headers))
}

fn not_found() -> Result<Response> {
    static_response(
        "not found",
        "text/plain; charset=utf-8",
        "no-store",
        false,
        false,
        404,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn negotiates_markdown_for_plain_text() {
        assert_eq!(
            representation("text/plain", "mozilla/5.0"),
            Representation::Llm
        );
    }

    #[test]
    fn negotiates_cli_output_for_curl() {
        assert_eq!(representation("*/*", "curl/8.0.0"), Representation::Cli);
    }

    #[test]
    fn defaults_to_html() {
        assert_eq!(
            representation("text/html", "mozilla/5.0"),
            Representation::Html
        );
    }
}
