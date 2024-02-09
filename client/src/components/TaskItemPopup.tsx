import { Box, Divider, List, ListItemButton, Popover } from "@mui/material";
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { ProjectRole } from "../../../common/constants";
import { useTask } from '../hooks/useTask';
import { useAppSelector } from "../redux/hooks";
import { RootState } from "../redux/store";
import { ROUTER_TASK } from "../utils/router";


interface IProps {
    openSelectOptionTask?: boolean;
    anchorEl?: any;
    handleCloseSelectOptionTask?: any;
    data?: any;
    onDeleteSuccess?: () => void;
    onDeleteError?: () => void;
}

export default function TaskItemPopup(props: IProps) {
    const { openSelectOptionTask, handleCloseSelectOptionTask, data, anchorEl,
        onDeleteSuccess = () => { },
        onDeleteError = () => { }
    } = props;
    const [copyLink, setCopyLink] = useState(false)
    const { handleDeleteTask } = useTask()
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = useAppSelector((state: RootState) => state.authReducer).user._id
    const projectListMemberState = useAppSelector((state: RootState) => state.projectMemberReducer)
    const checkRole = projectListMemberState.projectMembers.filter(e => e.role !== ProjectRole.SPRINT_MEMBER).find(e => e.userId === currentUser)



    const deleteTask = () => {
        if (!checkRole) {
            enqueueSnackbar(" No role delete task", { variant: "error" });
            onDeleteError();
            return;
        }
        handleDeleteTask(data._id);
        onDeleteSuccess();
    }
    const handleCopyLinkTask = () => {
        setCopyLink(true)
        const linkTask = `${window.location.host}${process.env.PUBLIC_URL || ""}${ROUTER_TASK}/${data._id}`
        navigator.clipboard.writeText(linkTask);
    }

    return (
        <Popover
            id={data?._id}
            open={openSelectOptionTask}
            anchorEl={anchorEl}
            onClose={handleCloseSelectOptionTask}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Box>
                <List>
                    <ListItemButton onClick={deleteTask}>Delete Task</ListItemButton>
                    <Divider />
                    <ListItemButton onClick={handleCopyLinkTask}>{copyLink ? 'Copied' : 'Copy link'}</ListItemButton>
                </List>
            </Box>

        </Popover >
    );
}