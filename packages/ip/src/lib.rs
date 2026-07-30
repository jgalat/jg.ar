use worker::*;

#[event(fetch)]
pub async fn main(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    let method = req.method();
    if !matches!(method, Method::Get | Method::Head) {
        return method_not_allowed();
    }

    let ip = client_ip(
        req.headers().get("CF-Connecting-IPv6")?,
        req.headers().get("CF-Connecting-IP")?,
    );

    match ip {
        Some(ip) => text_response(&ip, 200, method == Method::Head),
        None => text_response("ip not found", 503, method == Method::Head),
    }
}

fn client_ip(ipv6: Option<String>, connecting_ip: Option<String>) -> Option<String> {
    ipv6.filter(|ip| !ip.is_empty())
        .or_else(|| connecting_ip.filter(|ip| !ip.is_empty()))
}

fn method_not_allowed() -> Result<Response> {
    let headers = Headers::new();
    headers.set("Allow", "GET, HEAD")?;
    headers.set("Cache-Control", "no-store")?;
    headers.set("Content-Type", "text/plain; charset=utf-8")?;
    Ok(Response::error("method not allowed", 405)?.with_headers(headers))
}

fn text_response(body: &str, status: u16, head: bool) -> Result<Response> {
    let headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Cache-Control", "no-store")?;
    headers.set("Content-Type", "text/plain; charset=utf-8")?;

    let response = if head {
        Response::empty()?
    } else {
        Response::ok(body)?
    };

    Ok(response.with_status(status).with_headers(headers))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_real_ipv6_when_available() {
        let ip = client_ip(Some("2001:db8::1".into()), Some("192.0.2.1".into()));

        assert_eq!(ip.as_deref(), Some("2001:db8::1"));
    }

    #[test]
    fn falls_back_to_connecting_ip() {
        let ip = client_ip(None, Some("192.0.2.1".into()));

        assert_eq!(ip.as_deref(), Some("192.0.2.1"));
    }

    #[test]
    fn ignores_empty_headers() {
        assert_eq!(client_ip(Some(String::new()), Some(String::new())), None);
    }
}
