import { useNavigate, useLocation } from "react-router-dom";

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import DynamicFormOutlinedIcon from '@mui/icons-material/DynamicFormOutlined';

import { useState } from "react";

const NavbarManager = () => {
  const navigateTo = [ '/vote', '/login', '/listQuestionnaire' ];

  const location = useLocation();
  const navigate = useNavigate();

  const index = navigateTo.indexOf(location.pathname);
  const [selected, setSelected] = useState((index > -1) ? index : 0);

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={selected}
        onChange={(value, newValue) => { setSelected(newValue); navigate(navigateTo[newValue]); }}
        style = {{ width: '100%', position: 'fixed', bottom: 10}} >

        <BottomNavigationAction label="Vote" icon={<HowToVoteOutlinedIcon />} />
        <BottomNavigationAction label="Logout" icon={<LogoutOutlinedIcon />} />
        <BottomNavigationAction label="Questionnaires" icon={<DynamicFormOutlinedIcon />} />

      </BottomNavigation>
    </Paper>
  );
}

export default NavbarManager;

