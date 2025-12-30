const { PollyClient, StartSpeechSynthesisTaskCommand, GetSpeechSynthesisTaskCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const pollyClient = new PollyClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const BUCKET_NAME = process.env.PODCAST_BUCKET_NAME;

/**
 * Lambda handler for generating podcast from conversation turns
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { persons, turns } = body;

    if (!persons || !turns || turns.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({ error: 'Missing required fields: persons and turns' }),
      };
    }

    // Create voice mapping
    const personVoiceMap = {};
    persons.forEach((person) => {
      personVoiceMap[person.id] = person.voiceId || getDefaultVoice(person.sex);
    });

    // Build SSML with multiple speakers
    const ssmlParts = turns.map((turn) => {
      const person = persons.find(p => p.id === turn.personId);
      const voiceId = personVoiceMap[turn.personId];

      // Escape special XML characters in the text
      const escapedText = escapeXml(turn.text);

      return `<speak><prosody rate="medium">${escapedText}</prosody><break time="1s"/></speak>`;
    });

    // Since Polly doesn't support multi-voice in a single synthesis,
    // we need to synthesize each turn separately and concatenate
    const audioBuffers = [];

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const person = persons.find(p => p.id === turn.personId);
      const voiceId = personVoiceMap[turn.personId];
      const escapedText = escapeXml(turn.text);

      const ssml = `<speak><prosody rate="medium">${escapedText}</prosody></speak>`;

      // Synthesize speech for this turn
      const pollyParams = {
        Text: ssml,
        TextType: 'ssml',
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: 'neural',
        LanguageCode: 'en-US',
      };

      const command = new StartSpeechSynthesisTaskCommand({
        ...pollyParams,
        OutputS3BucketName: BUCKET_NAME,
        OutputS3KeyPrefix: `temp/${event.requestContext.requestId}/${i}_`,
      });

      await pollyClient.send(command);
    }

    // For simplicity in this initial version, we'll use a single voice
    // and generate the entire conversation as one audio file
    // In production, you'd want to use a more sophisticated approach
    // like AWS Step Functions to orchestrate multiple Polly calls

    const fullText = turns.map((turn) => {
      const person = persons.find(p => p.id === turn.personId);
      return `${person.name} says: ${turn.text}`;
    }).join('. ');

    const mainVoiceId = personVoiceMap[turns[0].personId];

    const pollyParams = {
      Text: fullText,
      OutputFormat: 'mp3',
      VoiceId: mainVoiceId,
      Engine: 'neural',
      LanguageCode: 'en-US',
    };

    const outputKey = `podcasts/${event.requestContext.requestId}.mp3`;

    const command = new StartSpeechSynthesisTaskCommand({
      ...pollyParams,
      OutputS3BucketName: BUCKET_NAME,
      OutputS3KeyPrefix: outputKey,
    });

    const response = await pollyClient.send(command);
    const taskId = response.SynthesisTask.TaskId;

    // Poll for completion
    let taskStatus = 'inProgress';
    let attempts = 0;
    const maxAttempts = 30;

    while (taskStatus === 'inProgress' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusCommand = new GetSpeechSynthesisTaskCommand({ TaskId: taskId });
      const statusResponse = await pollyClient.send(statusCommand);
      taskStatus = statusResponse.SynthesisTask.TaskStatus;
      attempts++;
    }

    if (taskStatus !== 'completed') {
      throw new Error(`Speech synthesis failed with status: ${taskStatus}`);
    }

    // Get the output URI from Polly
    const statusCommand = new GetSpeechSynthesisTaskCommand({ TaskId: taskId });
    const finalStatus = await pollyClient.send(statusCommand);
    const audioUrl = finalStatus.SynthesisTask.OutputUri;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        audioUrl: audioUrl,
        message: 'Podcast generated successfully',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        error: 'Failed to generate podcast',
        message: error.message,
      }),
    };
  }
};

function getDefaultVoice(sex) {
  return sex === 'male' ? 'Matthew' : 'Joanna';
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
