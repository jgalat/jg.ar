use wasm_bindgen::JsValue;
use worker::*;

fn handle_options(req: Request) -> Result<Response> {
    let headers = req.headers();
    if headers.has("Origin")?
        && headers.has("Access-Control-Request-Method")?
        && headers.has("Access-Conrol-Request-Headers")?
    {
        let cors = Cors::default()
            .with_origins(["*"])
            .with_methods([Method::Get, Method::Head, Method::Post, Method::Options])
            .with_max_age(86400)
            .with_allowed_headers(headers.get("Access-Control-Request-Headers")?);

        return Response::empty()?.with_cors(&cors);
    }

    let mut headers = Headers::default();
    headers.append("Allow", "GET,HEAD,POST,OPTIONS")?;

    Ok(Response::empty()?.with_headers(headers))
}

async fn handle_request(mut original_req: Request, target_url: Url) -> Result<Response> {
    let target_origin = target_url
        .domain()
        .ok_or(Error::from("target origin undefined"))?;

    let request_init_body = original_req.text().await.ok().and_then(|s| {
        if s == "" {
            None
        } else {
            Some(JsValue::from_str(s.as_str()))
        }
    });

    let mut request_init = RequestInit::new();
    request_init
        .with_headers(original_req.headers().clone())
        .with_method(original_req.method())
        .with_body(request_init_body);

    let mut request = Request::new_with_init(target_url.as_str(), &request_init)?;
    request.headers_mut()?.set("Origin", target_origin)?;

    let response = Fetch::Request(request).send().await?;

    let mut cors = Cors::default();

    let original_req_origin = original_req.headers().get("Origin")?;
    if let Some(original_req_origin) = original_req_origin {
        cors = cors.with_origins([original_req_origin]);
    }

    let mut response = Response::from(response);
    response = response.with_cors(&cors)?;
    response.headers_mut().append("Vary", "Origin")?;
    Ok(response)
}

#[event(fetch)]
pub async fn main(req: Request, _env: Env, _ctx: worker::Context) -> Result<Response> {
    let raw_url = req.path();
    let method = req.method();

    let target_url = Url::parse(&raw_url[1..raw_url.len()]);

    match raw_url.as_str() {
        "/" if method == Method::Options => handle_options(req),
        "/" if method == Method::Get => {
            let mut headers = Headers::new();
            headers.set("Content-Type", "text/plain")?;
            let response = Response::ok("https://cors.jg.ar/{url}")?;
            Ok(response.with_headers(headers))
        }
        _ if target_url.is_err() => {
            Response::error(format!("bad request: {}", target_url.err().unwrap()), 400)
        }
        _ => {
            let response = handle_request(req, target_url.unwrap()).await;

            if let Err(err) = response {
                return Response::error(format!("internal server error: {}", err), 500);
            }

            response
        }
    }
}
