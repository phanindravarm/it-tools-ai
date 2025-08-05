import { Box, Typography } from '@mui/material';

export default function RenderResult({ result }) {
  if (result === null || result === undefined) return null;

  // Handle base64 images
  if (result.startsWith('data:image/')) {
    console.log("Entered image")
    return (
      <Box mt={2}>
        <img src={result} alt="Generated" style={{ maxWidth: '100%' }} />
      </Box>
    );
  }

  // Handle base64 audio
  if (typeof result === 'string' && result.startsWith('audio/')) {
    return (
      <Box mt={2}>
        <audio controls src={result}>
          Your browser does not support audio playback.
        </audio>
      </Box>
    );
  }

  // Handle base64 video
  if (typeof result === 'string' && result.startsWith('video/')) {
    return (
      <Box mt={2}>
        <video controls width="100%" src={result}>
          Your browser does not support video playback.
        </video>
      </Box>
    );
  }

  // Handle error string
  if (typeof result === 'string' && result.toLowerCase().startsWith('error:')) {
    return (
      <Typography color="error" mt={2}>
        {result}
      </Typography>
    );
  }

  // Handle simple string
  if (typeof result === 'string') {
    return <Typography mt={2}>{result}</Typography>;
  }

  // Handle number and boolean
  if (typeof result === 'number' || typeof result === 'boolean') {
    return <Typography mt={2}>{String(result)}</Typography>;
  }

  // Handle array
  if (Array.isArray(result)) {
    return (
      <Box component="ul" mt={2} sx={{ pl: 2 }}>
        {result.map((item, i) => (
          <li key={i}>
            <Typography variant="body2">
              {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
            </Typography>
          </li>
        ))}
      </Box>
    );
  }

  // Handle object
  if (typeof result === 'object') {
    return (
      <Box component="ul" mt={2} sx={{ pl: 2 }}>
        {Object.entries(result).map(([key, value]) => (
          <li key={key}>
            <Typography variant="body2">
              <strong>{key}:</strong>{' '}
              {typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </Typography>
          </li>
        ))}
      </Box>
    );
  }

  // Fallback
  return (
    <Typography color="text.secondary" mt={2}>
      Unsupported result format.
    </Typography>
  );
}
