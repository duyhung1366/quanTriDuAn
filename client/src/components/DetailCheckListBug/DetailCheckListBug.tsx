
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { AvatarGroup, Box, List, ListItemButton, TextField, Typography, Button, Stack } from '@mui/material';
import Avatar from '@mui/material/Avatar/Avatar';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Popover from "@mui/material/Popover";
import Tooltip from '@mui/material/Tooltip';
import * as React from 'react';
import { useState } from "react";
import { $enum } from 'ts-enum-util';
import { TaskStatus } from '../../../../common/constants';
import User from '../../../../common/models/user';
import { mapTaskStatusLabel } from '../../config/MapContraint';
import { useProjectCheckList } from '../../hooks/useProjectCheckList';
import useProjectMember from '../../hooks/useProjectMember';
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { searchStatusBugCheckList, setCurrentBugItem } from '../../redux/slices/projectCheckList.slice';
import { createSubTask, currentTaskActive, syncStatusSubTask } from '../../redux/slices/task.slice';
import { RootState } from "../../redux/store";
import BootstrapTooltip from '../CustomToolTip';
import { DesciptionBugPopup } from "../DescriptionBugPopup";
import AddMemIcon from '../icons/AddMemIcon';
import IconRenameItem from '../icons/IconRenameItem';
import UserCustomIcon from '../icons/UserCustomIcon';
import { removeAccents } from '../unidecode';
import { ColorStatus } from '../WorkSpace';
import './bugChecklist.scss';
import { ProjectRole, SprintStatus } from "../../../../common/constants";
import { useTask } from '../../hooks/useTask';
import Task from '../../../../common/models/task';


export const listButton = [
    { name: "To Do", status: TaskStatus.OPEN },
    { name: "In Progress", status: TaskStatus.IN_PROGRESS },
    { name: "Review", status: TaskStatus.REVIEW },
    { name: "Bug", status: TaskStatus.BUG },
    { name: "Complete", status: TaskStatus.COMPLETE }
]


const DetailCheckListForBug = () => {
    const {
        handleLoadProjectCheckListById, handleDeleteItemCheckList,
        handleCreateProjectCheckList, handleAddItemCheckList,
        handleUpdateItemCheckList, handleDeleteProjectCheckList
    } = useProjectCheckList()

    const { handleCreateNewTask } = useTask()

    const [searchByName, setSearchByName] = useState("")
    const [addNewItemBug, setAddNewItemBug] = useState(false)
    const [renamingBugItem, setRenamingBugItem] = useState(false);
    const [valueItemBugNew, setValueItemBugNew] = useState("");
    const [checkProjectBugCList, setCheckProjectBugCist] = useState("");
    const [anchorElAssignCheckList, setAnchorElAssignCheckList] = useState<HTMLLIElement | null>(null);
    const [anchorElStatusBug, setAnchorElStatusBug] = useState<HTMLLIElement | null>(null);
    const [anchorElItemBug, setAnchorElItemBug] = useState<HTMLLIElement | null>(null);
    const [checkItemId, setCheckItemId] = useState("");
    const [openDescriptionBugPopup, setOpenDescriptionBugPopup] = useState(false)
    const [checkListId, setCheckListId] = useState();
    const taskState = useAppSelector((state: RootState) => state.taskReducer)
    const projectCheckListState = useAppSelector((state: RootState) => state.projectCheckListReducer)
    const users = useAppSelector((state: RootState) => state.userReducer.mapUserData);
    const dispatch = useAppDispatch()
    const currentSprint = useAppSelector(state => state.sprintReducer.currentSprint)
    const auth = useAppSelector((state: RootState) => state.authReducer)

    const hasMasterOrOwnerPermission = !!(useProjectMember(taskState?.currentTask?.projectId)).find((e) => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id);
    const isDisabledEditSprint = !hasMasterOrOwnerPermission && (currentSprint?.status === SprintStatus.ARCHIVED)

    const getMembersProject = useProjectMember(taskState?.currentTask?.projectId)
    const mapListMembers = React.useMemo(() => {
        if (getMembersProject) {
            const dataMembers = getMembersProject.map(item => {
                return { ...item, ...(users[item?.userId] || {} as User) }
            })
            return dataMembers
        }
    }, [getMembersProject])
    const listMembers = mapListMembers.filter((s) => removeAccents(s?.name?.toLowerCase())?.includes(removeAccents(searchByName.toLowerCase())))

    const bugCheckLists = projectCheckListState.projectCheckListById.filter((a) => {
        return a.attachTo === 1
    })



    //Mở list members để assign mem checklist
    const openAnchorElAssign = Boolean(anchorElAssignCheckList); //Open List Assign bug checklist
    const openAnchorElItemBug = Boolean(anchorElItemBug); //Open settings bug checklist
    const openAnchorElStatusBug = Boolean(anchorElStatusBug)// Open list status bug checklist
    const openListMembers = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElAssignCheckList(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseListMembers = () => {
        setAnchorElAssignCheckList(null);
        setSearchByName("");
    };
    const openSettingsItemBug = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElItemBug(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseSettingsItemBug = () => {
        setAnchorElItemBug(null);
    };
    const openListStatusBug = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElStatusBug(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseListStatusBug = () => {
        setAnchorElStatusBug(null);
    };

    const handleAddCheckList = () => {
        if (bugCheckLists.length < 1) {
            handleCreateProjectCheckList({ name: "BUG CHECKLIST", parentId: taskState?.currentTask?._id, attachTo: 1, createDate: Date.now() })
        }
    }
    const handleOpenRenameItemBug = (itemId: string) => {
        setRenamingBugItem(true);
        setCheckItemId(itemId);
    }
    const handleChangeStatusBug = (projectCheckListId: string, itemId: string, newStatus: number) => {
        const parentTaskId = taskState.currentTask._id
        handleUpdateItemCheckList(projectCheckListId, itemId, { status: newStatus })
        dispatch(syncStatusSubTask({ itemId, newStatus, parentTaskId }))
        handleCloseListStatusBug()
    }
    const handleSaveRenameItem = (projectCheckListId: string, item: any) => {
        if (valueItemBugNew === "" || valueItemBugNew === item.title) {
            setRenamingBugItem(false)
            setValueItemBugNew("")
        }
        else {
            handleUpdateItemCheckList(projectCheckListId, item._id, { title: valueItemBugNew })
            setRenamingBugItem(false)
            setValueItemBugNew("")
        }
    }
    const handleSaveItem = (name: string) => {
        const projectCheckListId = name
        const data = { items: [{ title: valueItemBugNew, status: TaskStatus.OPEN, isExistSubtask: false }] }
        handleAddItemCheckList(projectCheckListId, data)
        setValueItemBugNew("")
        setAddNewItemBug(false)
    };

    const handleKeySaveNewItem = (event: React.KeyboardEvent<HTMLInputElement>, projectChecklistId: string) => {
        if (event.key === "Enter") {
            handleSaveItem(projectChecklistId)
        }
    }

    //Assign Member vào checklist
    const handleAssignMemToCheckList = (projectCheckListId: string, itemId: string, assignees: Array<string>, assigneeId: string) => {
        const checkAssignees = assignees.filter(i => i === assigneeId)
        if (checkAssignees.length > 0) {
            const newAssignees = [...assignees.filter(a => a !== assigneeId)]
            handleUpdateItemCheckList(projectCheckListId, itemId, { assignees: newAssignees })
            setAnchorElAssignCheckList(null)
        }
        else {
            const newAssignees = [...assignees, assigneeId]
            handleUpdateItemCheckList(projectCheckListId, itemId, { assignees: newAssignees })
            setAnchorElAssignCheckList(null)

        }
        setSearchByName("");
    }
    //Xóa Member khỏi checklist
    const handleDeleteAssignMemCList = (projectCheckListId: string, itemId: string, assignees: Array<string>, assigneeId: string) => {
        const newAssignees = [...assignees.filter(i => i !== assigneeId)]
        handleUpdateItemCheckList(projectCheckListId, itemId, { assignees: newAssignees })
    }
    const handleDeleteItem = (projectCheckList: any, item: any) => {
        handleDeleteItemCheckList(projectCheckList._id, item._id)
    }

    const handleCreateSubTask = (projectCheckList: any, item: any) => {
        // console.log("Item", item)
        const assignees = item.assignees
        const data = new Task({
            name: item.title,
            userId: auth.user._id,
            checkListItemRefId: item._id,
            projectId: taskState?.currentTask?.projectId,
            sprintId: taskState?.currentTask?.sprintId,
            parentTaskId: taskState?.currentTask?._id,
            status: item.status,
        })
        handleCreateNewTask(data, assignees)
        handleUpdateItemCheckList(projectCheckList._id, item._id, { isExistSubtask: true })
        dispatch(createSubTask(data))
        setAnchorElItemBug(null);
    }

    const handleCheck = (e: any, itemId: string, projectCheckListId: string) => {
        handleUpdateItemCheckList(projectCheckListId, itemId, { isResolved: e.target.checked })
    }
    // console.log("Project Check List", projectCheckListState)
    return (
        <Box>
            {
                bugCheckLists.map((projectCheckList, i) => {
                    const bugComplete = projectCheckList.items?.filter(bug => bug?.status === TaskStatus.COMPLETE);
                    return (
                        <Box className='bug-checklist-container' key={i}>
                            <Box className='title-bug-checklist' style={{ display: 'flex', flexDirection: 'row', width: '500px' }}>
                                <Typography className='title-bug-name'>
                                    {projectCheckList.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                                    {projectCheckList?.items?.length
                                        ? bugComplete?.length
                                            ? <Typography> ({bugComplete.length}/{projectCheckList?.items?.length}) </Typography>
                                            : <Typography>({projectCheckList?.items?.length}) </Typography>
                                        : null
                                    }
                                </Box>
                                <Box className='group-button-filter-bug'>
                                    {
                                        listButton.map(e => {
                                            const check = projectCheckListState?.searchStatusBugCheckList?.includes(e.status)
                                            return (
                                                <button
                                                    className='btn-filter-bug'
                                                    onClick={() => dispatch(searchStatusBugCheckList(e.status))}
                                                    style={{
                                                        border: check ? `1px solid ${ColorStatus[mapTaskStatusLabel[e.status]]}` : "",
                                                    }}
                                                >
                                                    <div style={{ background: `${ColorStatus[mapTaskStatusLabel[e.status]]}` }} className='dot-color-btn-filter-bug' /> {e.name}
                                                </button>
                                            )
                                        })
                                    }

                                </Box>
                            </Box>
                            {

                                (projectCheckListState?.searchStatusBugCheckList.length > 0 ?
                                    (projectCheckList?.items?.filter(s => projectCheckListState?.searchStatusBugCheckList.includes(s.status))) :
                                    (projectCheckList?.items)
                                ).map((item: any, i) => {
                                    return (
                                        <Box className='container-bug-check-list-item' key={i}>

                                            <Popover
                                                id={item._id}
                                                open={openAnchorElStatusBug && checkItemId === item._id}
                                                anchorEl={anchorElStatusBug}
                                                onClose={handleCloseListStatusBug}
                                                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                                            >
                                                {
                                                    $enum(TaskStatus).getValues().map(value => {
                                                        return (
                                                            <MenuItem key={value} value={value} onClick={() => handleChangeStatusBug(projectCheckList._id, item._id, value)}>
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <div style={{ background: `${ColorStatus[mapTaskStatusLabel[value]]}`, width: '8px', height: '8px', borderRadius: '3px', marginRight: '10px' }} />
                                                                    {mapTaskStatusLabel[value]}
                                                                </div>
                                                            </MenuItem>
                                                        )

                                                    })
                                                }
                                            </Popover>
                                            <BootstrapTooltip placement="top" title={mapTaskStatusLabel[item.status]}>
                                                <Box
                                                    className='container-status-bug'
                                                    onClick={(e: any) => openListStatusBug(e, item._id)}
                                                    sx={{ border: `1px solid ${ColorStatus[mapTaskStatusLabel[item.status]]}` }}
                                                >
                                                    <Box
                                                        className='custom-icon-checkbox-bug'
                                                        sx={{ background: `${ColorStatus[mapTaskStatusLabel[item.status]]}` }}
                                                    />
                                                </Box>
                                            </BootstrapTooltip>
                                            <Popover
                                                id={item._id}
                                                open={openAnchorElAssign && checkItemId === item._id}
                                                anchorEl={anchorElAssignCheckList}
                                                onClose={handleCloseListMembers}
                                                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                                            >
                                                <Box sx={{ height: "400px", overflow: 'hidden' }}>
                                                    <Box sx={{ padding: '10px', height: "70px" }}>
                                                        <TextField
                                                            placeholder='Search by name'
                                                            fullWidth
                                                            onChange={(e) => setSearchByName(e.target.value)}
                                                        />
                                                    </Box>

                                                    <Box sx={{ height: "330px", overflowY: 'auto' }}>
                                                        {listMembers.length > 0 && listMembers.map((mem, i) => {
                                                            const filterMemAssigned = item?.assignees?.includes(mem.userId)

                                                            return (
                                                                <div key={i}>
                                                                    <MenuItem
                                                                        key={mem.userId}
                                                                        onClick={() => handleAssignMemToCheckList(projectCheckList._id, item._id, item.assignees, mem.userId)}
                                                                    >
                                                                        <Box
                                                                            sx={filterMemAssigned ? { border: '3px solid #5d4ab3', borderRadius: '25px', marginRight: '10px' } : { marginRight: '10px' }}>
                                                                            <Avatar src={mem.avatar} sx={{ border: '3px solid #fff' }} />
                                                                        </Box>
                                                                        <div style={filterMemAssigned ? { fontWeight: 600 } : null}>{mem.name}</div>
                                                                    </MenuItem>
                                                                </div>
                                                            )
                                                        })}
                                                    </Box>

                                                </Box>
                                            </Popover>
                                            {
                                                item?.assignees.length > 0
                                                    ? <AvatarGroup
                                                        max={3}
                                                        className="group-avatar-bug-checklist"
                                                        classes={{ avatar: 'group-ava-checklist' }}
                                                        onClick={(e: any) => openListMembers(e, item._id)}
                                                    >
                                                        {listMembers.filter((m) => item?.assignees.includes(m.userId)).map(({ avatar, name }, i) => {
                                                            return <BootstrapTooltip placement='top' title={name}>
                                                                <Avatar
                                                                    key={i}
                                                                    onClick={(e: any) => openListMembers(e, item._id)}
                                                                    className='item-assignees-bug-checklist'
                                                                    src={avatar}
                                                                />
                                                            </BootstrapTooltip>
                                                        })}

                                                    </AvatarGroup>
                                                    : <button
                                                        className="btn-assign-mem-to-checklist"
                                                        onClick={(e: any) => openListMembers(e, item._id)}
                                                    >
                                                        <div className='icon-add-assign-bug'><AddMemIcon /></div>
                                                        <div className='icon-user-assign-bug'><UserCustomIcon /></div>
                                                    </button>
                                            }
                                            {
                                                renamingBugItem && checkItemId === item?._id
                                                    ? <Box className='rename-bug-item'>
                                                        <input
                                                            className='input-rename-bug-item'
                                                            defaultValue={item?.title}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleSaveRenameItem(projectCheckList._id, item)
                                                                }
                                                            }}
                                                            onChange={(e) => setValueItemBugNew(e.target.value)}
                                                            onBlur={() => handleSaveRenameItem(projectCheckList._id, item)}
                                                        />
                                                    </Box>
                                                    : <Box
                                                        key={projectCheckList._id}
                                                        className='edit-text-item-bug'
                                                        onClick={() => {
                                                            dispatch(setCurrentBugItem(item))
                                                            setOpenDescriptionBugPopup(true)
                                                            setCheckListId(projectCheckList._id)
                                                            setAnchorElItemBug(null)
                                                        }}
                                                    >
                                                        {item?.title}
                                                    </Box>
                                            }
                                            <Popover
                                                id={item._id}
                                                classes={{ paper: 'Popover-item-bug-checklist' }}
                                                open={openAnchorElItemBug && checkItemId === item._id}
                                                anchorEl={anchorElItemBug}
                                                onClose={handleCloseSettingsItemBug}
                                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                                transformOrigin={{ vertical: "center", horizontal: "left" }}
                                            >
                                                <Box>
                                                    <List>

                                                        <ListItemButton onClick={() => handleCreateSubTask(projectCheckList, item)} disabled={item.isExistSubtask} >
                                                            Convert to Task
                                                        </ListItemButton>
                                                        <ListItemButton onClick={() => handleDeleteItem(projectCheckList, item)} >
                                                            Delete
                                                        </ListItemButton>

                                                    </List>
                                                </Box>
                                            </Popover>
                                            {renamingBugItem && checkItemId === item._id
                                                ? null
                                                : <BootstrapTooltip key={item?._id} placement="top" title="Rename">
                                                    <IconButton onClick={() => handleOpenRenameItemBug(item?._id)} className='btn-rename-item-bug' disableRipple>
                                                        <Box className='icon-rename-item-bug'>
                                                            <IconRenameItem />
                                                        </Box>
                                                    </IconButton>
                                                </BootstrapTooltip>
                                            }
                                            {renamingBugItem && checkItemId === item._id
                                                ? null
                                                : <BootstrapTooltip placement="top" title="Settings">
                                                    <IconButton
                                                        key={item?._id}
                                                        disableRipple
                                                        className='btn-open-options-item-bug'
                                                        onClick={(e: any) => openSettingsItemBug(e, item?._id)}
                                                        style={{ marginLeft: '10px' }}
                                                    >
                                                        <MoreHorizIcon className='icon-hmore-options-bug' />
                                                    </IconButton>
                                                </BootstrapTooltip>
                                            }
                                        </Box>
                                    )
                                })
                            }
                            {
                                addNewItemBug && checkProjectBugCList === projectCheckList._id
                                    ? <div className='form-add-new-item-bug'>
                                        <div className='head-line-add-item-bug' />
                                        <input
                                            className='input-add-item-bug'
                                            autoFocus
                                            placeholder="Type'/' from commands"
                                            onChange={(e) => setValueItemBugNew(e.target.value)}
                                            onKeyDown={(e) => handleKeySaveNewItem(e, projectCheckList._id)}
                                            onBlur={() => {
                                                if (!valueItemBugNew) {
                                                    setAddNewItemBug(false)
                                                }

                                            }}
                                        />
                                        {/* <button
                                            className="btn-assign-mem-to-checklist"
                                        >
                                            <div className='icon-add-assign-bug'><AddMemIcon /></div>
                                            <div className='icon-user-assign-bug'><UserCustomIcon /></div>
                                        </button> */}
                                        <button
                                            className='btn-save-new-item-bug'

                                            onClick={() => handleSaveItem(projectCheckList._id)}
                                        >
                                            SAVE
                                        </button>
                                    </div>
                                    : <button className='btn-add-bug-item-checklist' disabled={isDisabledEditSprint} onClick={() => {
                                        setAddNewItemBug(true)
                                        setCheckProjectBugCist(projectCheckList._id)
                                    }}> + ADD BUG CHECKLIST ITEM</button>

                            }


                        </Box>
                    )
                })
            }
            {
                projectCheckListState.currentBugItem && <DesciptionBugPopup
                    open={openDescriptionBugPopup}
                    onClose={() => {
                        dispatch(setCurrentBugItem(null))
                        setOpenDescriptionBugPopup(false)
                    }}
                    checkListId={checkListId}
                />
            }
            {bugCheckLists.length < 1 && <button className='btn-add-bug-checklist' onClick={handleAddCheckList}> + ADD BUG CHECKLIST </button>}
        </Box >
    )

}

export default DetailCheckListForBug;