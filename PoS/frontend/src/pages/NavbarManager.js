import { useNavigate, useLocation } from "react-router-dom";

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';

import { useState } from "react";

const NavbarManager = () => {
  const navigateTo = [ '/manager/tokens', '/manager/wallets', '/manager/createVote','/manager/vote', '/manager/pointOfSale', '/login' ];

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

        <BottomNavigationAction label="Tokens"  icon={<TokenOutlinedIcon />} />
        <BottomNavigationAction label="Wallets" icon={<AccountBalanceWalletOutlinedIcon />} />
        <BottomNavigationAction label="New Vote" icon={<AddCircleOutlinedIcon />} />
        <BottomNavigationAction label="Vote" icon={<HowToVoteOutlinedIcon />} />
        <BottomNavigationAction label="PoS" icon={<PointOfSaleOutlinedIcon />} />
        <BottomNavigationAction label="Logout" icon={<LogoutOutlinedIcon />} />

      </BottomNavigation>
    </Paper>
  );
}

export default NavbarManager;

