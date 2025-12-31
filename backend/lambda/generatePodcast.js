const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const BUCKET_NAME = process.env.PODCAST_BUCKET_NAME;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Lambda handler for generating podcast from conversation turns using OpenAI TTS
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

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    // Create voice mapping
    const personVoiceMap = {};
    persons.forEach((person) => {
      personVoiceMap[person.id] = person.voiceId || getDefaultVoice(person.sex);
    });

    // Synthesize all turns in parallel for speed
    console.log(`Starting parallel synthesis of ${turns.length} turns`);

    const synthesisPromises = turns.map(async (turn, i) => {
      const voiceId = personVoiceMap[turn.personId];
      const text = turn.text;

      console.log(`Synthesizing turn ${i + 1}/${turns.length} with OpenAI voice ${voiceId}`);

      // Call OpenAI TTS API
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd', // High-definition quality
          input: text,
          voice: voiceId,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS failed for turn ${i + 1}: ${response.status} - ${errorText}`);
      }

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      console.log(`✅ Synthesized ${audioBuffer.length} bytes for turn ${i + 1}`);

      return { index: i, buffer: audioBuffer };
    });

    // Wait for all synthesis to complete
    const results = await Promise.all(synthesisPromises);

    // Sort by original index to maintain turn order
    results.sort((a, b) => a.index - b.index);
    const audioBuffers = results.map(r => r.buffer);

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
        message: 'Podcast generated successfully with OpenAI TTS',
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
  // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
  // Male voices: echo (clear male), onyx (deep male), fable (British)
  // Female voices: nova (warm), shimmer (soft), alloy (neutral)
  return sex === 'male' ? 'echo' : 'nova';
}
