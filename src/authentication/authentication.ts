
interface Claims {
    user_id: number,
    profile_name?: string,
    uuid: string,
  }


export const BeforeAuthenticateCustom: nkruntime.BeforeHookFunction<nkruntime.AuthenticateCustomRequest> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.AuthenticateCustomRequest): nkruntime.AuthenticateCustomRequest | void {

    const secretKey = ctx.env["JWT_SECRET_KEY"];
    const claims = verifyAndParseJwt(secretKey, data.account.id);

    if (!claims) {
        logger.error(`error verifying and parsing jwt`);
        return null;
      }
    
      data.account.id = claims.uuid;
      data.username = claims.user_id.toString();
      data.account.vars['display_name'] = claims.profile_name || "";
      
    
      return data;

}


const verifyAndParseJwt = function (secretKey: string, jwt: string): Claims {
    // Use your favourite JWT library to verify the signature and decode the JWT contents
    // Once verified and decoded, return a Claims object accordingly
    return null;
}