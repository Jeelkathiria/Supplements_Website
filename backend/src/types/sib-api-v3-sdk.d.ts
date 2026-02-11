declare module "sib-api-v3-sdk" {
  export default class SibApiV3Sdk {
    static ApiClient: {
      instance: {
        authentications: {
          "api-key": {
            apiKey: string;
          };
        };
      };
    };
    static TransactionalEmailsApi: new () => {
      sendTransacEmail(payload: {
        sender: {
          email: string;
          name: string;
        };
        to: Array<{ email: string }>;
        subject: string;
        htmlContent: string;
      }): Promise<any>;
    };
  }
}
