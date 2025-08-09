import { useParams, useNavigate } from 'react-router-dom';
import { useTools } from './ToolsContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import RenderResult from './RenderResult';

const Tools = () => {
  const { id } = useParams();
  const { tools, loading } = useTools();
  const [tool, setTool] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [result, setResult] = useState(null);
  const [execError, setExecError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const found = tools.find((t) => String(t.id) === String(id));
      if (found) {
        setTool(found);
        setInputs(Array(found.inputs.length).fill(''));
      }
    }
  }, [loading, tools, id]);

  const handleExecute = async () => {
    try {
      const args = inputs.map((val, index) => {
        const type = tool.inputs[index].type;
        if (type === 'object' || type === 'json') {
            try {
            return JSON.parse(val);
            } catch (e) {
            throw new Error("Invalid JSON input at argument " + (index + 1));
            }
        }
        switch (type) {
          case 'number': return parseFloat(val);
          case 'boolean': return val === 'true' || val === true;
          default: return val;
        }
      });
      console.log(tool.code)
      const func = new Function(`${tool.code}\n return ${tool.function_title};`)()
    const res = await func(...args)
      setResult(res)
      if(res.startsWith('data:image/')){
        console.log("Entered")
      }
      setExecError(null);
    } catch (err) {
        console.log("Error in function")
      setExecError(err.message);
    }
  };

  if (loading || !tool) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>{tool.human_readable_function_title}</Typography>

      {tool.inputs.map((input, index) => (
        <TextField
          key={index}
          fullWidth
          label={input.human_readable_title}
          type={input.type}
          multiline 
          value={inputs[index] || ''}
          onChange={(e) => {
            const updated = [...inputs];
            updated[index] = e.target.value;
            setInputs(updated);
          }}
          sx={{ mb: 2 }}
        />
      ))}

      <Box display="flex" gap={2} mt={2}>
        <Button variant="contained" onClick={handleExecute}>Run</Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

{result !== null && (
  <Box sx={{ mt: 3 }}>
    <RenderResult result={result} />
  </Box>
)}
      {execError && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {execError}
        </Typography>
      )}
    </Container>
  );
};

export default Tools;
