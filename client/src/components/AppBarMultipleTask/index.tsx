import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Dialog, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import "./style.scss"
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import CloneOrMoveTask from '../CloneOrMoveTaskPopup';
import AdjustIcon from '@mui/icons-material/Adjust';
import { removeSelectedTasks } from '../../redux/slices/task.slice';
import SelectTaskCheckIcon from '../icons/SelectTaskCheckIcon';


export default function AppBarMultipleTask() {
    const selectedTasks = useAppSelector(state => state.taskReducer.listTaskCloneOrMove)
    const dispatch = useAppDispatch()
    return (
        <Box sx={{ flexGrow: 1, }}
        >
            <AppBar position="absolute" style={{ backgroundColor: '#363636', zIndex: 1300, height: '55px' }} >
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
                    <Box sx={{ width: "30px", height: '30px', display: 'flex', flexDirection: 'row', alignItems: 'center', flexGrow: 2, marginLeft: '380px' }}>
                        <IconButton
                            onClick={() => dispatch(removeSelectedTasks())}
                            className="selected-task"
                            sx={{ mx: 1 }}
                        >
                            <SelectTaskCheckIcon />
                        </IconButton>
                        {selectedTasks.length}  tasks selected

                    </Box>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 3, color: "#fff" }}>
                        <CloneOrMoveTask />
                    </Typography>
                </Stack>
            </AppBar>
        </Box>
    );
}

