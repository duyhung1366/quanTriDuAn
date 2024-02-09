import * as React from 'react';
import { Input, MoreHoriz } from "@mui/icons-material";
import { AvatarGroup } from "@mui/lab";
import { Avatar, IconButton, MenuItem, TextField } from "@mui/material";
import { Box, List, ListItemButton, Popover, Tooltip } from "@mui/material";
import Task from "../../../../common/models/task";
import TaskAssignment from "../../../../common/models/task_assignment";
import './ItemTaskByList.scss'
import { useTask } from '../../hooks/useTask';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { EditTextarea } from 'react-edit-text';
import { styled } from '@mui/material/styles';
import { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import NotesIcon from '@mui/icons-material/Notes';
import { mapTaskStatusLabel } from '../../config/MapContraint';
import { $enum } from 'ts-enum-util';
import { TaskStatus } from '../../../../common/constants';
import ListItem from '@mui/material/ListItem/ListItem';
import { ColorPriority, ColorStatus } from '../WorkSpace';
import BootstrapTooltip from '../CustomToolTip';
import PriorityIcon from '../icons/PriorityIcon';
import IconStar from '../icons/IconDifficuty';
import Grid from '@mui/material/Grid';
import DOMPurify from 'dompurify';
import { useSnackbar } from 'notistack';

interface ItemTaskListProps {
    item: Task,
    index: number,
    color: any,
    nameStatus: string,
    assignees: Array<TaskAssignment>,
    priorityColor: number,
    priorityBackgroud: number,
    mapPriority: any,
    handleClickTask: (e: any, task: Task) => void
}
export const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#f5f5f9',
        color: 'rgba(0, 0, 0, 0.87)',
        maxWidth: 500,
        fontSize: theme.typography.pxToRem(12),
        border: '1px solid #dadde9',
    },
}));
const ItemTaskByList = (props: ItemTaskListProps) => {
    const [anchorElTask, setAnchorElTask] = React.useState<HTMLLIElement | null>(null);
    const [anchorElStatus, setAnchorElStatus] = React.useState<HTMLLIElement | null>(null);
    const [checkRename, setCheckRename] = React.useState<boolean>(false);
    const [inputRef, setInputRef] = React.useState<HTMLInputElement>(null);
    const { enqueueSnackbar } = useSnackbar();

    const item = props.item
    const { handleUpdateTask } = useTask();

    React.useEffect(() => {
        if (inputRef) {
            inputRef.focus({ preventScroll: true });
        }
    }, [inputRef]);
    //Mở popover đổi trạng thái nhanh của task
    const openSelectStatus = Boolean(anchorElStatus);
    //Đóng popover đổi trạng thái nhanh task
    const handleCloseSelectStatus = () => {
        setAnchorElStatus(null);
    };
    //Mở settings task by list
    const openSettingsTask = Boolean(anchorElTask);
    //Đóng settings task by list
    const handleCloseSettingsTask = () => {
        setAnchorElTask(null);
    };
    //Xử lý chuột trái chuột phải vào button settings của task by list
    const handleClickSettingTask = (evt: React.MouseEvent<HTMLLIElement>) => {
        if (evt.type === "click") {
            evt.preventDefault();
            evt.stopPropagation()
            setAnchorElTask(evt.currentTarget)

        }
        else if (evt.type === "contextmenu") {
            evt.preventDefault();
            evt.stopPropagation()
            setAnchorElTask(evt.currentTarget)

        }
    }
    //Xử lý chuột trái chuột phải vào task by list
    const handleClickSelectStatus = (evt: React.MouseEvent<HTMLLIElement>) => {
        if (evt.type === "click") {
            evt.preventDefault();
            setAnchorElStatus(evt.currentTarget)
        }
        else if (evt.type === "contextmenu") {
            evt.preventDefault();
            setAnchorElTask(evt.currentTarget)

        }
    }
    //Đổi tên task
    const handleRenameTask = () => {
        setCheckRename(true)
        setAnchorElTask(null)
    }
    //Lưu thay đổi tên task
    const handleSaveRenameTask = (newName: string) => {
        if (newName === item.name) {
            setCheckRename(false)
        }
        else {
            handleUpdateTask(item._id, { name: newName })
            setCheckRename(false)
        }
    }
    //Đổi trạng thái cho task
    const handleChangeStatus = (value: number) => {
        setAnchorElStatus(null)
        if (item.status === TaskStatus.OPEN && !item.estimatePoints && !item.deadline) {
            enqueueSnackbar("Chưa đặt `Estimate Point` và `Due Date` cho Task", { variant: "warning" });
            return;
        }
        handleUpdateTask(item._id, { status: value })
    }
    //Lấy ra assignees của task
    const assigneesTask = props.assignees.filter((x) => x.taskId === item._id)
        .filter((ele, ind) =>
            ind === props.assignees.filter((i) => i.taskId === item._id).findIndex(x => x.userId === ele.userId)
        )
    return (
        <Draggable
            draggableId={item._id}
            key={item._id}
            index={props.index}>
            {(providedRow, snapshotRow) => (
                <div
                    className={classNames("task-item-list-container", !!checkRename ? "Rename" : " ")}
                    ref={providedRow.innerRef}
                    {...providedRow.draggableProps}
                    {...providedRow.dragHandleProps}
                >
                    <BootstrapTooltip placement="top" title={`${props.nameStatus}`}>
                        <Box
                            className='task-item-list-status'
                            onClick={(evt: any) => handleClickSelectStatus(evt)}
                            sx={{ ':hover': { border: `1px solid ${props.color}` } }}
                        >
                            <div
                                className="color-status"
                                style={{ background: `${props.color}` }}
                                onContextMenu={(evt: any) => handleClickSelectStatus(evt)}
                            />
                        </Box>
                    </BootstrapTooltip>
                    <Popover
                        id={item._id}
                        open={openSelectStatus}
                        anchorEl={anchorElStatus}
                        onClose={handleCloseSelectStatus}
                        classes={{ paper: 'popover-task-by-list' }}
                        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                        transformOrigin={{ vertical: "top", horizontal: "center" }}>
                        <Box>
                            {
                                $enum(TaskStatus).getValues().map(value => (
                                    <MenuItem
                                        key={value}
                                        value={value}
                                        onClick={() => handleChangeStatus(value)}
                                        sx={{ display: 'flex', alignItems: 'center' }}
                                    >
                                        <div
                                            className="color-status"
                                            style={{ background: `${ColorStatus[mapTaskStatusLabel[value]]}`, marginRight: '10px' }}
                                        />
                                        <div>{mapTaskStatusLabel[value]}</div>
                                    </MenuItem>
                                ))
                            }
                        </Box>
                    </Popover>


                    <div className="task-item-list-left" onClick={(e) => props.handleClickTask(e, item)}>

                        <div className="task-item-list-name" >
                            {
                                checkRename
                                    ? <input
                                        ref={setInputRef}
                                        className='input-rename-task'
                                        defaultValue={item.name}
                                        onBlur={(e) => handleSaveRenameTask(e.target.value)}
                                    />
                                    : <div>{item.name}</div>
                            }

                            {
                                item.description
                                    ? <HtmlTooltip
                                        onClick={(e) => { e.stopPropagation() }}
                                        title={
                                            <div onClick={(e) => { e.stopPropagation() }}
                                                className="view-des-task-mini">
                                                <div
                                                    onClick={(e) => { e.stopPropagation() }}
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item?.description) }}

                                                />
                                            </div>
                                        }
                                    >
                                        <IconButton
                                            onClick={(e) => { e.preventDefault(), e.stopPropagation() }}
                                            sx={{ ":hover": { borderRadius: '5px' }, width: '20px', height: '20px', marginLeft: '5px' }}><NotesIcon sx={{ fontSize: '15px' }} /></IconButton>
                                    </HtmlTooltip>
                                    : null
                            }
                        </div>
                    </div>
                    <Grid container spacing={3} className="task-item-list-right" onClick={(e) => props.handleClickTask(e, item)}>
                        <Grid xs className="avatar-assignees" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AvatarGroup max={3} classes={{ avatar: 'avatar-group-task-list' }}>
                                {
                                    assigneesTask.map((i: any) => {
                                        return (
                                            <BootstrapTooltip placement="top" title={i.name}>
                                                <Avatar sx={{ width: 25, height: 24 }} src={i.avatar} />
                                            </BootstrapTooltip>
                                        )
                                    })
                                }
                            </AvatarGroup>
                        </Grid>
                        <Grid xs className="task-assessment-container" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {
                                item?.priority?.toString()
                                && <Box
                                    className="icon-priority-task-home"
                                    sx={{
                                        svg: { width: "14px", height: '16px' },
                                        "path": { fill: `${ColorPriority.color[item.priority]}` }
                                    }}
                                >
                                    <PriorityIcon />
                                </Box>
                            }
                            {
                                item?.difficulty?.toString()
                                && <Box
                                    className="icon-difficulty-task-home"
                                    sx={{
                                        svg: { width: "16px", height: '16px' },
                                        "path": { fill: `${ColorPriority.color[item.difficulty]}` }
                                    }}
                                >
                                    <IconStar />
                                </Box>
                            }
                            {
                                item.estimatePoints &&
                                <Tooltip title="Esstimate Point" placement="top">
                                    <div className="esstimate-point">{item.estimatePoints} </div>
                                </Tooltip>
                            }
                        </Grid>
                        <Popover
                            id={item._id}
                            open={openSettingsTask}
                            anchorEl={anchorElTask}
                            onClose={handleCloseSettingsTask}
                            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                            transformOrigin={{ vertical: "top", horizontal: "center" }}
                            onClick={(e) => { e.stopPropagation() }}
                        >
                            <Box onClick={(e) => { e.stopPropagation() }}
                            >
                                <List>
                                    <ListItemButton onClick={handleRenameTask}> Rename </ListItemButton>
                                    <ListItemButton> Delete </ListItemButton>
                                </List>
                            </Box>
                        </Popover>
                        <Grid xs sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BootstrapTooltip placement="top" title="Settings">
                                <button
                                    className="ibtn-task-list-setting"
                                    onClick={(evt: any) => handleClickSettingTask(evt)}
                                    onContextMenu={(evt: any) => handleClickSettingTask(evt)}
                                >
                                    <MoreHoriz className="icon-task-morehoriz" />
                                </button>
                            </BootstrapTooltip>
                        </Grid>
                    </Grid>

                </div>

            )}

        </Draggable>
    )

}

export default ItemTaskByList;