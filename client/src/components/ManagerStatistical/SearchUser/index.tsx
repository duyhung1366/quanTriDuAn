
import * as React from 'react';
import { useState, useEffect } from "react";
import { Box, Button, TextField } from '@mui/material';
import Popover from "@mui/material/Popover";
import Avatar from '@mui/material/Avatar/Avatar';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import useProjectMember from '../../../hooks/useProjectMember';
import User from '../../../../../common/models/user';
import { clearSearchUserStatistic, searchUserStatistic } from '../../../redux/slices/task.slice';
import SearchIcon from "@mui/icons-material/Search";

export default function SearchUser() {

    const [listUserProject, setListUserProject] = useState([])
    const users = useAppSelector(state => state.userReducer.mapUserData);
    const projectState = useAppSelector(state => state.projectReducer);
    const getMembersProject = useProjectMember(projectState.currentProject?._id);
    const taskState = useAppSelector(state => state.taskReducer);

    const dispatch = useAppDispatch()


    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;



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
            setListUserProject(lisMemberByTask)
        }
    }, [lisMemberByTask.length])


    const handleSearchUser = (e: any) => {
        const text = (e.target.value).trim();
        const members = text.length > 0
            ? lisMemberByTask.filter((user) => user.account.toLowerCase().includes(text.toLowerCase()))
            : lisMemberByTask;
        setListUserProject(members);
    }

    return (
        <div>
            <Button aria-describedby={id} variant="outlined" onClick={handleClick} sx={{ textTransform: "lowercase", marginLeft: '10px' }}>
                <SearchIcon className="icon-search-task-by-name" />
                Search User.....
            </Button>
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
                        onClick={() => dispatch(clearSearchUserStatistic())}
                        sx={{ width: '100%', textTransform: 'none' }}
                    >
                        Clear SearchUser
                    </Button>
                    <Box sx={{ height: "300px", overflowY: 'auto' }}>
                        {
                            listUserProject.map((e, i) => {
                                const isChooseUser = taskState.searchUserStatistic.includes(e.userId)

                                return (
                                    <div key={i}>
                                        <MenuItem
                                            onClick={() => dispatch(searchUserStatistic(e.userId))}
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
        </div>
    )
}