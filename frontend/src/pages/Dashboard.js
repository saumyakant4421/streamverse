import { Container, Typography, Button, Box } from "@mui/material";
import { auth } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>Welcome to Dashboard</Typography>
      {user ? (
        <>
          <Typography variant="h6">Hello, {user.email}!</Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={logout} 
            sx={{ mt: 3 }}
          >
            Logout
          </Button>
        </>
      ) : (
        <Typography variant="h6">Please log in to access the dashboard.</Typography>
      )}
    </Container>
  );
};

export default Dashboard;
