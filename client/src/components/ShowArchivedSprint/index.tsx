import * as React from 'react';
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { RootState } from "../../redux/store";
import { Box, Button, Switch, Stack, Divider, Typography, Grid } from '@mui/material';
import Popover from "@mui/material/Popover";
import BootstrapTooltip from "../CustomToolTip";
import { IconButton } from "@mui/material";
import UserAssignIcon from '../icons/UserAssignIcon';
import VisibilityIcon from '@mui/icons-material/Visibility';
import "./style.scss"
import { setShowArchivedSprint } from '../../redux/slices/sprint.slice';
import { SHOW_ARCHIVE_SPRINT } from '../../../../common/constants';
import { handleShowAllSubTasks } from '../../redux/slices/task.slice';

interface IProps {
    taskIdsByCurentSprint: Array<string>
}

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export default function ShowArchivedSprint(props: IProps) {
    const { taskIdsByCurentSprint } = props
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [showAllSubTasks, setShowAllSubTask] = React.useState(false)
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover-filtert-task-by-user' : undefined;
    const dispatch = useAppDispatch()
    const sprintState = useAppSelector(state => state.sprintReducer);
    const showArchivedSprint = sprintState.showArchivedSprint

    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setShowArchivedSprint(event.target.checked));
        localStorage.setItem(SHOW_ARCHIVE_SPRINT, JSON.stringify(event.target.checked));
    };
    const handleSwitchShowSubTasks = () => {
        setShowAllSubTask(!showAllSubTasks)
        showAllSubTasks
            ? dispatch(handleShowAllSubTasks([]))
            : dispatch(handleShowAllSubTasks(taskIdsByCurentSprint))
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <BootstrapTooltip placement="top" title="Show">
                <IconButton disableRipple className='img-sprint' onClick={handleClick} >
                    <Box sx={{ svg: { width: "15px", height: '15px', display: 'flex', alignItems: 'center', paddingLeft: '2px' } }}>
                        <VisibilityIcon sx={{ color: "#0085FF", fontSize: "20px" }} />
                    </Box>
                </IconButton>
            </BootstrapTooltip>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ height: "400px", overflow: 'hidden', width: '300px', position: 'relative' }}>
                    <Stack direction="row" spacing={8} sx={{ mx: 3, ml: 2, my: 1 }}>
                        <Box className='title-dropdown-show'> SHOW</Box>
                    </Stack>
                    {/* <Divider /> */}
                    <Box className='item-show-container'>
                        <Box
                            className="item-show"
                            onClick={() => {
                                const newState = !showArchivedSprint;
                                dispatch(setShowArchivedSprint(newState));
                                localStorage.setItem(SHOW_ARCHIVE_SPRINT, JSON.stringify(newState))
                            }}
                        >
                            <Box className='left-item-show'

                            >
                                Show sprint archive
                            </Box>
                            <Switch
                                className='btn-switch'
                                disableRipple
                                checked={showArchivedSprint}
                                {...label}
                                onChange={handleSwitchChange}
                            />
                        </Box>
                    </Box>
                    <Box className='item-show-container'>
                        <Box className="item-show" onClick={handleSwitchShowSubTasks}>
                            <Box className='left-item-show'>
                                Show all subtasks
                            </Box>
                            <Switch
                                className='btn-switch'
                                disableRipple
                                checked={showAllSubTasks}
                                {...label}
                                onChange={handleSwitchShowSubTasks}
                            />

                        </Box>
                    </Box>
                </Box>
            </Popover>
        </div >
    );
}