export default $config({
  app(input) {
    return {
      name: "s-food-studio",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
    };
  },
  async run() {
    const mongoUri = new sst.Secret("MongoUri");
    const sessionSecret = new sst.Secret("SessionSecret");
    const razorpayKeyId = new sst.Secret("RazorpayKeyId");
    const razorpayKeySecret = new sst.Secret("RazorpayKeySecret");

    const storefront = new sst.aws.Nextjs("Storefront", {
      environment: {
        MONGODB_URI: mongoUri.value,
        SESSION_SECRET: sessionSecret.value,
        RAZORPAY_KEY_ID: razorpayKeyId.value,
        RAZORPAY_KEY_SECRET: razorpayKeySecret.value,
      },
      server: {
        runtime: "nodejs24.x",
        memory: "1024 MB",
        timeout: "30 seconds",
      },
    });

    return { url: storefront.url };
  },
});
