# PodcastAI

An AI-powered podcast creation platform that allows you to create realistic multi-person conversations using text-to-speech and AI-generated dialogue.

## Features

- **Multi-person conversations**: Define 2-10 participants with unique characteristics
- **AI-powered dialogue**: Have AI participants that generate contextual responses
- **Natural voices**: Uses Amazon Polly neural voices for realistic speech
- **Easy editing**: Modify any statement before generating the final podcast
- **Instant playback**: Listen to your podcast immediately after generation
- **Secure authentication**: AWS Cognito-powered user authentication

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- AWS Amplify for authentication
- Inline styling (no CSS framework needed)

**Backend:**
- AWS Lambda (Node.js 20.x)
- Amazon Polly for text-to-speech
- AWS Bedrock (Claude 3.5 Sonnet) for AI dialogue generation
- Amazon S3 for audio storage
- API Gateway for REST API
- Amazon Cognito for authentication

## Getting Started

### Prerequisites

- Node.js 20.x or later
- AWS Account
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd podcastai
```

2. Install dependencies:
```bash
npm install
```

3. Set up AWS infrastructure (see [Backend Setup](./backend/README.md))

4. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

5. Fill in your AWS configuration in `.env`:
```env
VITE_USER_POOL_ID=eu-west-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_IDENTITY_POOL_ID=eu-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AWS_REGION=eu-west-2
VITE_API_ENDPOINT=https://xxxxxxxxxx.execute-api.eu-west-2.amazonaws.com/prod
```

6. Start the development server:
```bash
npm run dev
```

7. Open http://localhost:5173 in your browser

## User Flow

1. **Login**: Sign up or sign in with email and password
2. **Define Participants**:
   - Select number of participants (2-10)
   - For each participant, specify:
     - Name
     - Sex (male/female)
     - Age
     - Personality description
     - Whether they are AI-controlled
3. **Build Conversation**:
   - Select who speaks next
   - For human participants: Type or paste their statement
   - For AI participants: Click "Generate" to create contextual response
   - Edit any statement as needed
4. **Generate Podcast**: Convert the conversation to audio
5. **Listen & Download**: Play back and download the MP3 file

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Option 1: AWS Amplify Hosting

1. Push your code to GitHub
2. Connect repository to AWS Amplify
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Amplify Console
5. Deploy

### Option 2: GitHub Actions

This project includes a GitHub Actions workflow for automated deployment.

Required secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AMPLIFY_APP_ID`
- `VITE_USER_POOL_ID`
- `VITE_USER_POOL_CLIENT_ID`
- `VITE_IDENTITY_POOL_ID`
- `VITE_AWS_REGION`
- `VITE_API_ENDPOINT`

See [deploy.yml](./.github/workflows/deploy.yml) for details.

## Project Structure

```
podcastai/
├── src/
│   ├── components/
│   │   ├── AuthWrapper.tsx          # Authentication UI wrapper
│   │   ├── PersonSetup.tsx          # Person definition interface
│   │   ├── ConversationBuilder.tsx  # Main conversation editor
│   │   └── PodcastPlayer.tsx        # Audio playback component
│   ├── services/
│   │   ├── bedrock.ts               # AI generation service
│   │   └── polly.ts                 # TTS service
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Main application component
│   ├── main.tsx                     # Application entry point
│   └── amplifyconfiguration.ts      # AWS Amplify config
├── backend/
│   ├── lambda/
│   │   ├── generatePodcast.js       # Lambda function
│   │   └── package.json             # Lambda dependencies
│   └── README.md                    # Backend setup guide
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD workflow
└── README.md                        # This file
```

## AWS Services Used

- **Amazon Cognito**: User authentication and authorization
- **AWS Bedrock**: AI dialogue generation with Claude 3.5 Sonnet
- **Amazon Polly**: Neural text-to-speech synthesis
- **AWS Lambda**: Serverless backend functions
- **Amazon S3**: Audio file storage
- **API Gateway**: REST API endpoints
- **AWS Amplify**: Frontend hosting and deployment
- **CloudWatch**: Logging and monitoring

## Cost Considerations

Estimated costs for moderate usage (100 podcasts/month, 5 min each):

- Polly Neural TTS: ~$2/month
- Bedrock (Claude): ~$1.50/month
- Lambda: <$0.10/month
- S3: <$0.10/month
- API Gateway: <$0.10/month
- Cognito: Free (under 50K MAUs)
- Amplify: Free tier available

**Total: ~$4-5/month** for moderate usage

## Security

- All API endpoints are protected with Cognito authentication
- IAM roles follow principle of least privilege
- CORS properly configured
- Environment variables for sensitive configuration
- HTTPS enforced

## Troubleshooting

See the [Backend README](./backend/README.md) for detailed troubleshooting steps.

Common issues:
- **CORS errors**: Check API Gateway and S3 CORS configuration
- **Authentication failures**: Verify Cognito configuration
- **TTS generation fails**: Check Lambda timeout and permissions
- **AI generation fails**: Ensure Bedrock model access is enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

- [ ] Support for multiple AI participants
- [ ] Voice customization options
- [ ] Background music and effects
- [ ] Podcast templates
- [ ] Script import/export
- [ ] Advanced audio editing
- [ ] Conversation history/saves
- [ ] Share podcasts with others
