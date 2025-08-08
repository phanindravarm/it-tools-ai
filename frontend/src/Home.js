import { useNavigate } from 'react-router-dom';
import { useTools } from './ToolsContext';
import { useState,useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';

const Home = () => {
  const { tools, setTools, error, setError } = useTools();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search,setSearch] = useState('')
  const [filteredTools,setFilteredTools] = useState(tools)
  const [selectedToolType, setSelectedToolType] = useState('');
  const navigate = useNavigate();

 useEffect(() => {
  const timeoutId = setTimeout(() => {
    const searchToLowerCase = search.toLowerCase();

    let filtered = tools.filter((tool) =>
      tool.human_readable_function_title.toLowerCase().includes(searchToLowerCase)
    );

    if (selectedToolType) {
      filtered = filtered.filter((tool) => tool.tool_type === selectedToolType);
    }
    setFilteredTools(filtered);
  }, 300); 

  return () => clearTimeout(timeoutId);
}, [search, tools, selectedToolType]);

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
  
  const groupedTools = tools.reduce((grp,tool)=>{
    grp[tool.tool_type] = grp[tool.tool_type] || []
    grp[tool.tool_type].push(tool)
    return grp
  },{})

  return (
    <Box sx={{ width: '100%', mt: 2 ,backgroundColor: '#1c1c1c'} }>
        <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
            <Box
                sx={{
                    width: '350px',
                    borderRight: '1px solid #ddd',
                    p: 2,
                    overflowY: 'auto',
                    backgroundColor: 'rgb(35, 35, 35)',
                    fontSize: '0.875rem',
                }}
            >
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.125rem', fontWeight: 500 }}>Tool Types</Typography>
                {Object.entries(groupedTools).map(([type, toolsOfType]) => (
                    <Accordion key={type} defaultExpanded sx={{color: 'rgba(255, 255, 255, 0.82)', backgroundColor:'rgba(35, 35, 35, 1)'}}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(64, 64, 67, 1)' }}/>}>
                        <Typography variant="subtitle1" sx={{ fontSize: '1rem', fontWeight: 500,color:'rgba(255, 255, 255, 0.82)' }}>{type}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List dense>
                        {toolsOfType.map((tool) => (
                            <ListItemButton
                            key={tool.id}
                            onClick={() => navigate(`/tool/${tool.id}`)}
                            >
                            <ListItemText primary={tool.human_readable_function_title} />
                            </ListItemButton>
                        ))}
                        </List>
                    </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <form onSubmit={handleQuerySubmit}>
                    <Box display="flex" gap={2} mb={3}>
                        <TextField
                            fullWidth
                            sx={{backgroundColor: 'rgb(70, 70, 70)',color:'red',}}
                            label="Enter query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ backgroundColor: 'rgb(70, 70, 70)',
                            color:'rgba(255, 255, 255, 0.82)' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Send'}
                        </Button>
                    </Box>
                </form>
                <form>
                    <Box display="flex" gap={2} mb={3}>
                        <TextField
                            fullWidth
                            label="Search tools"
                            value={search}
                            sx={{backgroundColor: 'rgb(70, 70, 70)',}}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Box>
                </form>
                <Box sx={{ mt: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[...new Set(tools.map((tool) => tool.tool_type))].map((type) => (
                    <Chip
                        key={type}
                        label={type}
                        color={selectedToolType === type? 'primary' : 'default'}
                        sx={{backgroundColor: 'rgb(70, 70, 70)',color:'rgba(255, 255, 255, 0.82)',}}
                        onClick={() => {
                            setSelectedToolType(prev => (prev === type ? '' : type))
                        }}
                    />
                    ))}
                </Box>
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                <Divider sx={{ my: 4 }} />
                <Box
                sx={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 2, 
                    p: 2,
                }}
                >
                {filteredTools.map(tool => (
                    <Paper
                        key={tool.id}
                        sx={{
                            width: '100%', 
                            height: '150px', 
                            p: 3, 
                            border: '2px rgb(70, 70, 70)',
                            m : 1, 
                            mb: 2,
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between', 
                            overflow: 'hidden', 
                            boxSizing: 'border-box',
                            '&:hover': { boxShadow: 6 },
                            transition: ' box-shadow 0.3s',
                            backgroundColor: 'rgb(50, 50, 50)',
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
                            <DeleteIcon  />
                        </IconButton>

                        <Typography
                            variant="h6"
                            sx={{
                            fontSize: '1rem', 
                            fontWeight: 500, 
                            whiteSpace: 'normal', 
                            lineHeight: 1.2, 
                            marginBottom: 'auto', 
                            color:'rgba(255, 255, 255, 0.82)'
                            }}
                        >
                            {tool.human_readable_function_title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                            fontSize: '0.875rem', 
                            lineHeight: 1.4, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'normal', 
                            color:'rgba(200, 200, 200, 0.82)'
                            }}
                        >
                            {tool.function_description}
                        </Typography>
                        </Paper>
                ))}
                </Box>
            </Box>
        </Box>
    </Box>
  );
};

export default Home;
