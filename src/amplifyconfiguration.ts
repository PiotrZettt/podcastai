// This file will be populated with your Amplify configuration
// You'll need to set this up in the AWS Console and update these values

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
      region: import.meta.env.VITE_AWS_REGION || 'eu-west-2',
    }
  },
  API: {
    REST: {
      PodcastAPI: {
        endpoint: import.meta.env.VITE_API_ENDPOINT || '',
        region: import.meta.env.VITE_AWS_REGION || 'eu-west-2',
      }
    }
  }
};
