const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

    // Synthesize each turn separately with the correct voice
    const audioBuffers = [];

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const voiceId = personVoiceMap[turn.personId];
      const escapedText = escapeXml(turn.text);

      console.log(`Synthesizing turn ${i + 1}/${turns.length} with voice ${voiceId}`);

      let audioBuffer;
      let success = false;
      
      // Try neural engine with conversational domain (only Matthew and Joanna support it)
      const supportsConversational = ['Matthew', 'Joanna'].includes(voiceId);
      
      if (supportsConversational) {
        try {
          const conversationalSSML = `<speak><amazon:domain name="conversational"><prosody rate="105%" pitch="+5%">${escapedText}</prosody></amazon:domain><break time="800ms"/></speak>`;
          
          const conversationalCommand = new SynthesizeSpeechCommand({
            Text: conversationalSSML,
            TextType: 'ssml',
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            Engine: 'neural',
            LanguageCode: 'en-US',
          });

          const response = await pollyClient.send(conversationalCommand);
          
          const audioChunks = [];
          for await (const chunk of response.AudioStream) {
            audioChunks.push(chunk);
          }
          audioBuffer = Buffer.concat(audioChunks);
          success = true;
          console.log(`Successfully used neural + conversational for ${voiceId}`);
          
        } catch (error) {
          console.log(`Neural + conversational failed for ${voiceId}: ${error.message}`);
        }
      }
      
      // If conversational failed or not supported, try neural without conversational
      if (!success) {
        try {
          const neuralSSML = `<speak><prosody rate="105%" pitch="+5%">${escapedText}</prosody><break time="800ms"/></speak>`;
          
          const neuralCommand = new SynthesizeSpeechCommand({
            Text: neuralSSML,
            TextType: 'ssml',
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            Engine: 'neural',
            LanguageCode: 'en-US',
          });

          const response = await pollyClient.send(neuralCommand);
          
          const audioChunks = [];
          for await (const chunk of response.AudioStream) {
            audioChunks.push(chunk);
          }
          audioBuffer = Buffer.concat(audioChunks);
          success = true;
          console.log(`Successfully used neural (no conversational) for ${voiceId}`);
          
        } catch (error) {
          console.log(`Neural engine failed for ${voiceId}: ${error.message}`);
        }
      }
      
      // Final fallback: use standard engine
      if (!success) {
        try {
          const standardSSML = `<speak><prosody rate="105%" pitch="+2%">${escapedText}</prosody><break time="800ms"/></speak>`;
          
          const standardCommand = new SynthesizeSpeechCommand({
            Text: standardSSML,
            TextType: 'ssml',
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            Engine: 'standard',
            LanguageCode: 'en-US',
          });

          const response = await pollyClient.send(standardCommand);
          
          const audioChunks = [];
          for await (const chunk of response.AudioStream) {
            audioChunks.push(chunk);
          }
          audioBuffer = Buffer.concat(audioChunks);
          success = true;
          console.log(`Successfully used standard engine for ${voiceId}`);
          
        } catch (error) {
          console.error(`All engines failed for ${voiceId}: ${error.message}`);
          throw error;
        }
      }
      
      audioBuffers.push(audioBuffer);
    }

    // Concatenate all audio buffers
    console.log(`Concatenating ${audioBuffers.length} audio segments`);
    const finalAudio = Buffer.concat(audioBuffers);

    // Upload to S3
    const outputKey = `podcasts/${event.requestContext.requestId}.mp3`;

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: outputKey,
      Body: finalAudio,
      ContentType: 'audio/mpeg',
    });

    await s3Client.send(uploadCommand);

    // Construct the public URL
    const audioUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-2'}.amazonaws.com/${outputKey}`;

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
  // Justin is warmer and more natural than Matthew for male voices
  return sex === 'male' ? 'Justin' : 'Joanna';
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
