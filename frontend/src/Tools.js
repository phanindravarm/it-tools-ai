import { useParams, useNavigate } from 'react-router-dom';
import { useTools } from './ToolsContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch as MuiSwitch
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import RenderResult from './RenderResult';
import debounce from 'lodash.debounce';

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
        const defaults = found.inputs.map(inp => {
          if (inp.type === 'switch' || inp.type === 'checkbox' || inp.type === 'boolean') {
            return false;
          }
          if (inp.type === 'select' && Array.isArray(inp.options) && inp.options.length > 0) {
            return inp.options[0].value;
          }
          if (inp.type === 'number') {
            return inp.min ?? 0;
          }
          if (inp.type === 'range') {
            return inp.min ?? 1;
          }
          return '';
        });
        setInputs(defaults);
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
          } catch {
            throw new Error(`Invalid JSON input at argument ${index + 1}`);
          }
        }
        switch (type) {
          case 'number':
            return parseFloat(val);
          case 'checkbox':
          case 'boolean':
            return val === true || val === 'true';
          case 'switch': {
            const switchOptions = tool.inputs[index].options;
            if (Array.isArray(switchOptions) && switchOptions.length > 0) {
              return val === switchOptions[0].value;
            }
            return val === true || val === 'true';
          }
          default:
            return val;
        }
      });

      const func = new Function(`${tool.code}\n return ${tool.function_title};`)();
      const res = await func(...args);
      setResult(res);
      setExecError(null);
    } catch (err) {
      setExecError(err.message);
    }
  };

  const debounceExecute = useCallback(
    debounce(async () => {
      if (inputs.some(input => input !== '' && input !== null && input !== undefined)) {
        await handleExecute();
      }
    }, 200),
    [inputs]
  );

  useEffect(() => {
    if (inputs.length && tool) {
      debounceExecute();
    }
  }, [inputs, debounceExecute, tool]);

  if (loading || !tool) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleChange = (index, value) => {
    const updated = [...inputs];
    updated[index] = value;
    setInputs(updated);
  };

  const renderInputField = (input, index) => {
    const value = inputs[index];

    switch (input.type) {
      case 'checkbox':
        return (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(index, e.target.checked)}
            />
            <Typography sx={{ ml: 1 }}>{input.human_readable_title}</Typography>
          </Box>
        );

      case 'switch':
        return (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MuiSwitch
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(index, e.target.checked)}
            />
            <Typography sx={{ ml: 1 }}>{input.human_readable_title}</Typography>
          </Box>
        );

      case 'range':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography gutterBottom>
              {input.human_readable_title}: {value}
            </Typography>
            <input
              type="range"
              min={input.min}
              max={input.max}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              style={{ width: '100%' }}
            />
          </Box>
        );

      case 'radio':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography>{input.human_readable_title}</Typography>
            {Array.isArray(input.options) && input.options.length > 0
              ? input.options.map((opt, i) => (
                  <label key={i} style={{ marginRight: '1rem' }}>
                    <input
                      type="radio"
                      name={`radio-${index}`}
                      value={opt.value}
                      checked={value === opt.value}
                      onChange={(e) => handleChange(index, e.target.value)}
                    />
                    {opt.label}
                  </label>
                ))
              : <>No options available</>}
          </Box>
        );

      case 'file':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography>{input.human_readable_title}</Typography>
            <input
              type="file"
              onChange={(e) => handleChange(index, e.target.files[0])}
            />
          </Box>
        );

      case 'select':
        return (
          <FormControl fullWidth sx={{ mb: 2 }} key={index}>
            <InputLabel>{input.human_readable_title}</InputLabel>
            <Select
              value={value}
              label={input.human_readable_title}
              onChange={(e) => handleChange(index, e.target.value)}
            >
              {Array.isArray(input.options) && input.options.length > 0
                ? input.options.map((opt, i) => (
                    <MenuItem key={i} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))
                : <MenuItem disabled>No options available</MenuItem>}
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            key={index}
            fullWidth
            type={input.type || 'text'}
            label={input.human_readable_title}
            value={value}
            multiline
            onChange={(e) => handleChange(index, e.target.value)}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>{tool.human_readable_function_title}</Typography>

      {tool.inputs.map((input, index) => renderInputField(input, index))}

      <Box display="flex" gap={2} mt={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      {!result && inputs.every(v => v === '' || v === null || v === undefined) && (
        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
          Please enter your inputs.
        </Typography>
      )}

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
