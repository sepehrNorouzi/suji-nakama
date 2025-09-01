import { b64utoutf8 } from 'jsrsasign';

interface Claims {
    user_id: number,
    profile_name?: string,
    uuid: string,
    exp: number,
    iat: number,
    jti: string,
    avatar?: object
  }


export const BeforeAuthenticateCustom: nkruntime.BeforeHookFunction<nkruntime.AuthenticateCustomRequest> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.AuthenticateCustomRequest): nkruntime.AuthenticateCustomRequest | void {

    const secretKey = ctx.env["JWT_SECRET_KEY"];
    const claims = verifyAndParseJwt(secretKey, data.account.id, logger, nk);
    if (!claims) {
        logger.error(`error verifying and parsing jwt`);
        return null;
      }
      data.account.id = claims.uuid;    
      data.username = String(claims.user_id || "");
      data.create = true;
      data.account.vars = data.account.vars || {};
      data.account.vars['display_name'] = claims.profile_name || "";
      const claim_avatar = claims.avatar;
      let avatar_url = "";
      if(claim_avatar) {
        avatar_url = claim_avatar['image'] || "";
      }
      data.account.vars['avatar_url'] = avatar_url;
      return data;

}


export const AfterAuthenticateCustom: nkruntime.AfterHookFunction<
    nkruntime.Session,
    nkruntime.AuthenticateCustomRequest
  > = (ctx, logger, nk, session, req) => {
    const displayName = req.account.vars['display_name'] || "";
    const avatarUrl   = req.account.vars['avatar_url'] || "";

    try {
      nk.accountUpdateId(
        ctx.userId,
        null,            // username
        displayName,     // displayName
        null,            // timezone
        null,            // location
        null,            // langTag
        avatarUrl,       // avatarURL
        null             // metadata (object)
      );
    } catch (err) {
      logger.error("accountUpdateId failed: %s", err);
    }

    return session;
  };


function verifyAndParseJwt(secretKey: string, jwt: string, logger: nkruntime.Logger, nk: nkruntime.Nakama): Claims | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const [headerB64u, payloadB64u, sigB64u] = parts;

    const headerJson = b64utoutf8(headerB64u);
    const header = JSON.parse(headerJson);
    if (header.alg !== 'HS256') return null;

    const data = `${headerB64u}.${payloadB64u}`;

    const rawSig = nk.hmacSha256Hash(data, secretKey); // returns bytes/Uint8Array
    const calcB64 = nk.base64Encode(rawSig);              // standard base64
    const calcB64u = calcB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    if (calcB64u !== sigB64u) return null;

    const payloadJson = b64utoutf8(payloadB64u);
    const payload: Claims = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) return null;
    if (payload.iat && payload.iat > now) return null;

    return payload;
  } catch (err: any) {
    return null;
  }
}