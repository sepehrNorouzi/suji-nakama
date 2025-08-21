function rpcHealthcheck(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
  ): string {
    logger.info("Healthcheck RPC called");
    // Return a simple JSON payload to the client
    return JSON.stringify({ success: true });
  }
  
  function InitModule(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    initializer: nkruntime.Initializer
  ) {
    // Register the RPC function with the name 'healthcheck'
    initializer.registerRpc("healthcheck", rpcHealthcheck);
  
    logger.info("TypeScript module loaded.");
  }
