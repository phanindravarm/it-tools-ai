import { useNavigate } from 'react-router-dom';
import { useTools } from './ToolsContext';
import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const Home = () => {
  const { tools, setTools, loading: toolsLoading, error, setError } = useTools();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://it-backend-xi.vercel.app/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!data.error) {
        setTools(prev => [...prev, data]);
        setQuery('');
      }
    } catch {
      console.error('Failed to fetch new tool');
    } finally {
      setLoading(false);
    }
  };

  const handleToolDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch('https://it-backend-xi.vercel.app/tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.message === "Deleted successfully") {
        setTools(prev => prev.filter(tool => tool.id !== id));
        setError(null);
      } else {
        setError(`Deletion error in ${id}`);
      }
    } catch (error) {
      setError(`Deletion error in ${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <form onSubmit={handleQuerySubmit}>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            label="Enter query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Box>
      </form>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      <Divider sx={{ my: 4 }} />

      {tools.map(tool => (
        <Paper
          key={tool.id}
          sx={{
            p: 2,
            mb: 2,
            cursor: 'pointer',
            position: 'relative',
            '&:hover': { boxShadow: 6, bgcolor: 'grey.100' },
            transition: 'background-color 0.3s, box-shadow 0.3s',
          }}
          onClick={() => navigate(`/tool/${tool.id}`)}
        >
          <IconButton
            aria-label="delete"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
            onClick={(e) => {
              e.stopPropagation(); 
              handleToolDelete(tool.id);
            }}
            disabled={deletingId === tool.id}
          >
            <DeleteIcon color={deletingId === tool.id ? "disabled" : "error"} />
          </IconButton>

          <Typography variant="h6" gutterBottom>
            {tool.human_readable_function_title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {tool.function_description}
          </Typography>
        </Paper>
      ))}
    </Container>
  );
};

export default Home;
