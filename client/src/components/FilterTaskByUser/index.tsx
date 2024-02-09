import * as React from 'react';
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { RootState } from "../../redux/store";
import { Box, Button, TextField } from '@mui/material';
import Popover from "@mui/material/Popover";
import Avatar from '@mui/material/Avatar/Avatar';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import { getProjectMember } from '../../redux/slices/project-members.slice';
import { clearSearchUser, searchUser } from '../../redux/slices/task.slice';
import useProjectMember from "../../hooks/useProjectMember";
import User from '../../../../common/models/user';
import BootstrapTooltip from "../../components/CustomToolTip";
import { IconButton } from "@mui/material";
import UserAssignIcon from '../icons/UserAssignIcon';

export default function FilterTaskByUser() {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover-filtert-task-by-user' : undefined;
    const users = useAppSelector((state: RootState) => state.userReducer.mapUserData);
    const [listUserByTask, setListUserByTask] = useState([])
    const taskState = useAppSelector((state: RootState) => state.taskReducer);
    const projectMemberState = useAppSelector((state: RootState) => state.projectMemberReducer);
    const projectState = useAppSelector((state: RootState) => state.projectReducer);
    const authState = useAppSelector((state: RootState) => state.authReducer);

    const dispatch = useAppDispatch();

    const getMembersProject = useProjectMember(projectState.currentProject?._id);
    const lisMemberByTask = React.useMemo(() => {
        if (getMembersProject) {
            const dataMembers = getMembersProject.map(item => {
                return { ...item, ...(users[item?.userId] || {} as User) }
            })
            return dataMembers
        }
    }, [getMembersProject])

    useEffect(() => {
        if (lisMemberByTask.length > 0) {
            setListUserByTask(lisMemberByTask)
        }
    }, [lisMemberByTask.length])

    const handleSearchUser = (e: any) => {
        const text = (e.target.value).trim();
        const members = text.length > 0
            ? lisMemberByTask.filter((user) => user.account.toLowerCase().includes(text.toLowerCase()))
            : lisMemberByTask;
        setListUserByTask(members);
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFilterUser = (e: any) => {
        dispatch(searchUser(e.userId))
    }
    const handleClearSearchUser = () => {
        dispatch(clearSearchUser())
    }

    return (
        <div>
            <BootstrapTooltip placement="top" title="Assignees">
                <IconButton disableRipple className='img-sprint' onClick={handleClick} >
                    <Box sx={{ svg: { width: "15px", height: '15px', display: 'flex', alignItems: 'center', paddingLeft: '2px' } }}>
                        <UserAssignIcon />
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
                <Box sx={{ height: "400px", overflow: 'hidden' }}>
                    <Box sx={{ padding: '10px', height: "70px" }}>
                        <TextField
                            placeholder='Search by name'
                            fullWidth
                            onChange={handleSearchUser}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleClearSearchUser}
                        sx={{ width: '100%', textTransform: 'none' }}
                    >
                        Clear SearchUser
                    </Button>
                    <Box sx={{ height: "300px", overflowY: 'auto' }}>
                        {
                            listUserByTask.concat({ account: 'Unassigned', name: 'Unassigned', avatar: '' }).map((e, i) => {
                                const isMe = e._id === authState.user._id;
                                const isChooseUser = taskState.searchUser.includes(e.userId)
                                // const index = [e._id].indexOf(authState.user._id)
                                // if (index !== -1) {
                                //     e.account = 'Me';
                                //     e.name = 'Me';
                                // }
                                return (
                                    <div key={i}>
                                        <MenuItem
                                            onClick={() => handleFilterUser(e)}
                                        >
                                            <Box sx={isChooseUser ? { border: '3px solid #5d4ab3', borderRadius: '25px', marginRight: '10px' } : { marginRight: '10px' }}>
                                                <Avatar src={e.avatar} sx={{ border: '3px solid #fff' }} />
                                            </Box>
                                            <div style={isChooseUser ? { fontWeight: 700, color: 'red' } : null}>{e.name ?? e.account}</div>
                                        </MenuItem>
                                    </div>
                                )
                            })
                        }
                    </Box>

                </Box>
            </Popover>
        </div >
    );
}