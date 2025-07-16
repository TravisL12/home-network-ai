import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Container,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Description as DocumentIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import StatusDashboard from './components/StatusDashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const drawerWidth = 240;

const menuItems = [
  { text: 'Chat', icon: <ChatIcon />, path: '/' },
  { text: 'Documents', icon: <DocumentIcon />, path: '/documents' },
  { text: 'Status', icon: <DashboardIcon />, path: '/status' },
];

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Home Network AI
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
        Your Personal AI Assistant
      </Typography>
      <Typography variant="body1" paragraph>
        Welcome to your personal AI assistant powered by Ollama and Weaviate. 
        This system allows you to chat with your documents, manage your knowledge base, 
        and get intelligent responses based on your personal data.
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Features:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText
              primary="Intelligent Chat"
              secondary="Ask questions and get responses based on your documents"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DocumentIcon />
            </ListItemIcon>
            <ListItemText
              primary="Document Management"
              secondary="Upload and automatically process PDFs, images, and text files"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="System Monitoring"
              secondary="Monitor the health and status of your AI services"
            />
          </ListItem>
        </List>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar
            position="fixed"
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <Toolbar>
              <HomeIcon sx={{ mr: 2 }} />
              <Typography variant="h6" noWrap component="div">
                Home Network AI
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Navigation />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              height: '100vh',
              overflow: 'auto',
            }}
          >
            <Toolbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/documents" element={<DocumentManager />} />
              <Route path="/status" element={<StatusDashboard />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;