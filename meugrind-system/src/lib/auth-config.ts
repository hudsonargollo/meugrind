// AWS Amplify configuration for MEUGRIND system
import { Amplify } from 'aws-amplify';

export const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false,
      },
    },
  },
};

// Configure Amplify
export const configureAmplify = () => {
  Amplify.configure(authConfig);
};