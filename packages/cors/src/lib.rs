use worker::wasm_bindgen::JsValue;
use worker::*;

const ALLOWED_METHODS: &str = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";
const PROXY_HOST: &str = "cors.jg.ar";

#[event(fetch)]
pub async fn main(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    if req.method() == Method::Options {
        return handle_options(&req);
    }

    if req.path() == "/" {
        return cors_response(text_response(
            "https://cors.jg.ar/{absolute-http-or-https-url}",
            200,
        )?);
    }

    if !is_supported_method(&req.method()) {
        return cors_response(method_not_allowed()?);
    }

    let target = match parse_target(&req.path(), req.url()?.query()) {
        Ok(target) => target,
        Err(error) => return cors_response(text_response(&error.to_string(), 400)?),
    };

    match proxy(req, &target).await {
        Ok(response) => cors_response(response),
        Err(error) => {
            console_error!(
                "{}",
                serde_json::json!({
                    "message": "upstream request failed",
                    "error": error.to_string(),
                })
            );
            cors_response(text_response("bad gateway", 502)?)
        }
    }
}

fn handle_options(req: &Request) -> Result<Response> {
    if let Some(method) = req.headers().get("Access-Control-Request-Method")?
        && !is_supported_method_name(&method)
    {
        return cors_response(method_not_allowed()?);
    }

    let headers = Headers::new();
    apply_cors_headers(&headers)?;
    headers.set("Access-Control-Max-Age", "86400")?;

    if let Some(requested_headers) = req.headers().get("Access-Control-Request-Headers")? {
        headers.set("Access-Control-Allow-Headers", &requested_headers)?;
    }

    Ok(Response::empty()?.with_status(204).with_headers(headers))
}

async fn proxy(req: Request, target: &Url) -> Result<Response> {
    let method = req.method();
    let headers = outbound_headers(req.headers(), target)?;
    let body = if matches!(method, Method::Get | Method::Head) {
        None
    } else {
        req.inner().body().map(JsValue::from)
    };

    let mut init = RequestInit::new();
    init.with_method(method)
        .with_headers(headers)
        .with_body(body);

    let outbound = Request::new_with_init(target.as_str(), &init)?;
    Fetch::Request(outbound).send().await
}

fn outbound_headers(incoming: &Headers, target: &Url) -> Result<Headers> {
    let headers = incoming.clone();

    for name in [
        "cf-connecting-ip",
        "cf-connecting-ipv6",
        "cf-ipcountry",
        "cf-ray",
        "cf-visitor",
        "cf-worker",
        "connection",
        "content-length",
        "host",
        "keep-alive",
        "origin",
        "proxy-authenticate",
        "proxy-authorization",
        "sec-fetch-dest",
        "sec-fetch-mode",
        "sec-fetch-site",
        "sec-fetch-user",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "x-forwarded-for",
        "x-forwarded-proto",
        "x-real-ip",
    ] {
        headers.delete(name)?;
    }

    headers.set("Origin", &target.origin().ascii_serialization())?;
    Ok(headers)
}

fn parse_target(path: &str, query: Option<&str>) -> Result<Url> {
    let raw_target = path
        .strip_prefix('/')
        .filter(|target| !target.is_empty())
        .ok_or_else(|| Error::RustError("target URL is required".into()))?;
    let mut target = Url::parse(raw_target)
        .map_err(|error| Error::RustError(format!("invalid target URL: {error}")))?;

    if !matches!(target.scheme(), "http" | "https") {
        return Err(Error::RustError("target URL must use HTTP or HTTPS".into()));
    }

    if !target.username().is_empty() || target.password().is_some() {
        return Err(Error::RustError(
            "target URL must not contain user information".into(),
        ));
    }

    let host = target
        .host_str()
        .ok_or_else(|| Error::RustError("target URL must contain a host".into()))?;

    if host.eq_ignore_ascii_case(PROXY_HOST) {
        return Err(Error::RustError(
            "recursive proxy requests are not allowed".into(),
        ));
    }

    target.set_query(query);
    Ok(target)
}

fn is_supported_method(method: &Method) -> bool {
    matches!(
        method,
        Method::Get | Method::Head | Method::Post | Method::Put | Method::Patch | Method::Delete
    )
}

fn is_supported_method_name(method: &str) -> bool {
    matches!(
        method.to_ascii_uppercase().as_str(),
        "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE"
    )
}

fn method_not_allowed() -> Result<Response> {
    let headers = Headers::new();
    headers.set("Allow", ALLOWED_METHODS)?;
    Ok(Response::error("method not allowed", 405)?.with_headers(headers))
}

fn text_response(message: &str, status: u16) -> Result<Response> {
    let headers = Headers::new();
    headers.set("Content-Type", "text/plain; charset=utf-8")?;
    headers.set("Cache-Control", "no-store")?;
    Ok(Response::ok(message)?
        .with_status(status)
        .with_headers(headers))
}

fn cors_response(response: Response) -> Result<Response> {
    let headers = response.headers().clone();
    apply_cors_headers(&headers)?;
    Ok(response.with_headers(headers))
}

fn apply_cors_headers(headers: &Headers) -> Result<()> {
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS)?;
    headers.set("Access-Control-Expose-Headers", "*")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_target_and_preserves_query() {
        let target = parse_target("/https://example.com/api", Some("page=2")).unwrap();

        assert_eq!(target.as_str(), "https://example.com/api?page=2");
    }

    #[test]
    fn rejects_unsupported_schemes() {
        assert!(parse_target("/ftp://example.com/file", None).is_err());
    }

    #[test]
    fn rejects_recursive_requests() {
        assert!(parse_target("/https://cors.jg.ar/https://example.com", None).is_err());
    }

    #[test]
    fn recognizes_supported_methods() {
        assert!(is_supported_method_name("patch"));
        assert!(!is_supported_method_name("CONNECT"));
    }
}
