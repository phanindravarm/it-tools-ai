import { Box, Typography, Paper } from '@mui/material';
export default function RenderResult({ result }) {
  const renderArray = (arr, depth = 0) => (
    <Box component="ul" sx={{ pl: depth * 2 }}>
      {arr.map((item, index) => (
        <li key={index}>
          {typeof item === 'object' && item !== null ? (
            Array.isArray(item)
              ? renderArray(item, depth + 1)
              : renderObject(item, depth + 1)
          ) : (
            <Typography variant="body2">{String(item)}</Typography>
          )}
        </li>
      ))}
    </Box>
  )

  const renderObject = (obj, depth = 0) => (
    <Box component="ul" sx={{ pl: depth * 2 }}>
      {Object.entries(obj).map(([key, value]) => (
        <li key={key}>
          {typeof value === 'object' && value !== null ? (
            <>
              <Typography variant="body2" fontWeight="bold">{key}:</Typography>
              {Array.isArray(value)
                ? renderArray(value, depth + 1)
                : renderObject(value, depth + 1)}
            </>
          ) : (
            <Typography variant="body2">
              <strong>{key}:</strong> {String(value)}
            </Typography>
          )}
        </li>
      ))}
    </Box>
  );

  if (result === null || result === undefined) return null;

  if (typeof result === 'string' && result.startsWith('data:image/')) {
    console.log("Entered image")
    return (
      <Box mt={2}>
        <img src={result} alt="Generated" style={{ maxWidth: '100%' }} />
      </Box>
    );
  }

  if (typeof result === 'string' && result.startsWith('audio/')) {
    return (
      <Box mt={2}>
        <audio controls src={result}>
          Your browser does not support audio playback.
        </audio>
      </Box>
    );
  }

  if (typeof result === 'string' && result.startsWith('video/')) {
    return (
      <Box mt={2}>
        <video controls width="100%" src={result}>
          Your browser does not support video playback.
        </video>
      </Box>
    );
  }

  if (typeof result === 'string' && result.toLowerCase().startsWith('error:')) {
    return (
      <Typography color="error" mt={2}>
        {result}
      </Typography>
    );
  }

  if (typeof result === 'string') {
      try {
    const parsed = JSON.parse(result);
    if (typeof parsed === 'object' && parsed !== null) {
      result = parsed;
    }
  } catch {

  }
  }

    if (typeof result === 'string') {
    if (result.includes('\n')) {
        return (
        <Box mt={2}>
            <pre style={{
            }}>{result}</pre>
        </Box>
        );
    }
    return <Typography mt={2}>{result}</Typography>;
    }

  if (typeof result === 'number' || typeof result === 'boolean') {
    return <Typography mt={2}>{String(result)}</Typography>;
  }

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

  if (typeof result === 'object') {
        return renderObject(result);
  }

  return (
    <Typography color="text.secondary" mt={2}>
      Unsupported result format.
    </Typography>
  );
}
