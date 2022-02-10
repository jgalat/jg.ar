use worker::*;

#[event(fetch)]
pub async fn main(req: Request, _env: Env, _ctx: worker::Context) -> Result<Response> {
    if let Some(ip) = req.headers().get("CF-Connecting-IP")? {
        return Response::ok(ip);
    }

    Response::error("ip not found", 500)
}
