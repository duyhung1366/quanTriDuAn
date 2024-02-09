

import React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom"
import { requestLogout } from "../../redux/slices/auth.slice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { unwrapResult } from "@reduxjs/toolkit";
import LogoutIcon from '@mui/icons-material/Logout';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
const hrefWebMail = "https://webmail.koolsoftelearning.com"

export default function UserMenu() {
    const authState = useAppSelector((state: RootState) => state.authReducer);
    const dispatch = useAppDispatch();
    const navigate = useNavigate()
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    const handleClickLogout = () => {
        dispatch(requestLogout())
            .then(unwrapResult)
            .finally(() => {
                window.location.reload();
            });
    }
    const handleOpenWebMail = () => {
        window.open(hrefWebMail, "_blank")
        setAnchorElUser(null)
    }

    return (
        <Box style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Open settings">
                <IconButton sx={{ p: 0, mr: '10px', mt: '5px' }} onClick={handleOpenUserMenu} disableRipple>
                    <Avatar src={authState.user.avatar} />
                </IconButton>
            </Tooltip>
            <Typography sx={{ mr: '10px', mt: '5px' }}>{authState.user.name}</Typography>
            <Menu
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
            >
                <MenuItem sx={{ width: '150px' }} onClick={handleOpenWebMail} disableRipple><ForwardToInboxIcon sx={{ fontSize: '20px', marginRight: '10px' }} /> Mail </MenuItem>
                <MenuItem sx={{ width: '150px' }} onClick={handleClickLogout} > <LogoutIcon sx={{ fontSize: '20px', marginRight: '10px' }} />Logout</MenuItem>
            </Menu>
        </Box>
    );
}
