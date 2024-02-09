import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { AvatarGroup, Box, List, ListItemButton, TextField, Tooltip, Typography, Button, Stack } from '@mui/material';
import Avatar from '@mui/material/Avatar/Avatar';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Popover from "@mui/material/Popover";
import * as React from 'react';
import { useState } from "react";
import { EditText } from 'react-edit-text';
import { $enum } from 'ts-enum-util';
import { TaskStatus } from '../../../../common/constants';
import User from '../../../../common/models/user';
import { mapTaskStatusLabel } from '../../config/MapContraint';
import { useProjectCheckList } from '../../hooks/useProjectCheckList';
import useProjectMember from '../../hooks/useProjectMember';
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { searchStatusCheckList } from '../../redux/slices/projectCheckList.slice';
import { RootState } from "../../redux/store";
import BootstrapTooltip from '../CustomToolTip';
import { listButton } from '../DetailCheckListBug/DetailCheckListBug';
import AddMemIcon from '../icons/AddMemIcon';
import IconRenameItem from '../icons/IconRenameItem';
import UserCustomIcon from '../icons/UserCustomIcon';
import { removeAccents } from '../unidecode';
import { ColorStatus } from '../WorkSpace';
import './style.scss';
import { ProjectRole, SprintStatus } from "../../../../common/constants";


const DetailProjectCheckList = () => {
    const [searchByName, setSearchByName] = useState("")
    const [renamingCheckListItem, setRenamingCheckListItem] = useState(false);
    const [addNewItemCheckList, setNewItemCheckList] = useState(false)
    const [valueNewItemCList, setValueNewItemClist] = useState("")
    const [anchorElAssignCheckList, setAnchorElAssignCheckList] = React.useState<HTMLLIElement | null>(null);
    const [anchorElCheckList, setAnchorElCheckList] = React.useState<HTMLLIElement | null>(null);
    const [anchorElStatusCheckList, setAnchorElStatusCheckList] = React.useState<HTMLLIElement | null>(null);
    const [checkItemId, setCheckItemId] = useState("");
    const [checkProjectCheckList, setCheckProjectCheckList] = useState("");
    const taskState = useAppSelector((state: RootState) => state.taskReducer)
    const currentSprint = useAppSelector((state: RootState) => state.sprintReducer.currentSprint)
    const auth = useAppSelector((state: RootState) => state.authReducer)
    const projectCheckListState = useAppSelector((state: RootState) => state.projectCheckListReducer)
    const users = useAppSelector((state: RootState) => state.userReducer.mapUserData);
    const dispatch = useAppDispatch()

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

    const projectCheckLists = projectCheckListState.projectCheckListById.filter(a => a.attachTo === 0)

    const openAnchorElAssign = Boolean(anchorElAssignCheckList);
    const openAnchorElCheckList = Boolean(anchorElCheckList);
    const openAnchorElStatusCheckList = Boolean(anchorElStatusCheckList);

    const openListMembers = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElAssignCheckList(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseListMembers = () => {
        setAnchorElAssignCheckList(null);
        setSearchByName("")
        setCheckItemId("")
    };
    const openOptionsCheckList = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElCheckList(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseOptionsCheckList = () => {
        setAnchorElCheckList(null);
        setCheckItemId("")

    };
    const openListStatusCheckList = (e: React.MouseEvent<HTMLLIElement>, itemId: string) => {
        setAnchorElStatusCheckList(e.currentTarget)
        setCheckItemId(itemId)
    }
    const handleCloseListStatusCheckList = () => {
        setAnchorElStatusCheckList(null);
        setCheckItemId("")
    };
    const {
        handleDeleteItemCheckList,
        handleCreateProjectCheckList,
        handleAddItemCheckList,
        handleUpdateItemCheckList,
        handleDeleteProjectCheckList
    } = useProjectCheckList()

    const handleAddCheckList = () => {
        if (projectCheckLists.length < 1) {
            handleCreateProjectCheckList({ name: "CHECKLIST", parentId: taskState?.currentTask?._id, attachTo: 0, createDate: Date.now() })
        }
    }
    const handleChangeStatusCheckList = (projectCheckListId: string, itemId: string, newStatus: number) => {
        handleUpdateItemCheckList(projectCheckListId, itemId, { status: newStatus })
        handleCloseListStatusCheckList()

    }
    const handleOpenRenameItemCheckList = (itemId: string) => {
        setRenamingCheckListItem(true);
        setCheckItemId(itemId);
    }
    const handleSaveItem = (name) => {
        const projectCheckListId = name
        const data = { items: [{ title: valueNewItemCList, status: TaskStatus.OPEN }] }
        handleAddItemCheckList(projectCheckListId, data)
        setValueNewItemClist("")
        setNewItemCheckList(false)
    };
    const handleKeySaveNewItem = (event: React.KeyboardEvent<HTMLButtonElement>, projectChecklistId: string) => {
        if (event.key === "Enter") {
            handleSaveItem(projectChecklistId)
        }
    }
    const handleSaveRenameItem = (projectCheckListId: string, item: any) => {
        if (valueNewItemCList === "" || valueNewItemCList === item.title) {
            setRenamingCheckListItem(false)
            setValueNewItemClist("")
        }
        else {
            handleUpdateItemCheckList(projectCheckListId, item._id, { title: valueNewItemCList })
            setRenamingCheckListItem(false)
            setValueNewItemClist("")
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
        setSearchByName("")
    }
    // //Xóa Member khỏi checklist
    // const handleDeleteAssignMemCList = (projectCheckListId: string, itemId: string, assignees: Array<string>, assigneeId: string) => {
    //     const newAssignees = [...assignees.filter(i => i !== assigneeId)]
    //     handleUpdateItemCheckList(projectCheckListId, itemId, { assignees: newAssignees })
    // }
    const handleDeleteItem = (projectCheckList: any, item: any) => {
        handleDeleteItemCheckList(projectCheckList._id, item._id)
    }

    return (
        <Box>
            {
                projectCheckLists.map((projectCheckList, i) => {
                    const checkListComplete = projectCheckList.items?.filter(clist => clist?.status === TaskStatus.COMPLETE)

                    return (
                        <Box className='checklist-container' key={i}>
                            <Box className='title-checklist'>
                                <Typography className='title-name-checklist'> {projectCheckList.name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', margin: '0 5px' }}>
                                    {projectCheckList?.items?.length
                                        ? checkListComplete?.length
                                            ? <Typography> ({checkListComplete.length}/{projectCheckList?.items?.length}) </Typography>
                                            : <Typography> ({projectCheckList?.items?.length}) </Typography>
                                        : null
                                    }
                                </Box>
                                <Box className='group-button-filter-checklist'>
                                    {
                                        listButton.map(e => {
                                            const check = projectCheckListState?.searchStatusCheckList?.includes(e.status)
                                            return (
                                                <button
                                                    className='btn-filter-checklist'
                                                    onClick={() => dispatch(searchStatusCheckList(e.status))}
                                                    style={{
                                                        border: check ? `1px solid ${ColorStatus[mapTaskStatusLabel[e.status]]}` : "",
                                                    }}
                                                >
                                                    <div className='dot-color-btn-filter-checklist' style={{ background: `${ColorStatus[mapTaskStatusLabel[e.status]]}` }} />   {e.name}
                                                </button>
                                            )
                                        })
                                    }

                                </Box>
                            </Box>
                            {
                                (projectCheckListState?.searchStatusCheckList.length > 0 ?
                                    (projectCheckList?.items?.filter(s => projectCheckListState?.searchStatusCheckList.includes(s.status))) :
                                    (projectCheckList?.items)
                                ).map((item, i) => {
                                    return (
                                        <Box className='container-check-list-item' key={i} >
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
                                            <Popover
                                                id={item._id}
                                                open={openAnchorElStatusCheckList && checkItemId === item._id}
                                                anchorEl={anchorElStatusCheckList}
                                                onClose={handleCloseListStatusCheckList}
                                                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                                            >
                                                {
                                                    $enum(TaskStatus).getValues().map(value => {
                                                        return (
                                                            <MenuItem key={value} value={value} onClick={() => handleChangeStatusCheckList(projectCheckList._id, item._id, value)}>
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <div style={{ background: `${ColorStatus[mapTaskStatusLabel[value]]}`, width: '8px', height: '8px', borderRadius: '3px', marginRight: '10px' }} />
                                                                    {mapTaskStatusLabel[value]}
                                                                </div>
                                                            </MenuItem>
                                                        )

                                                    })
                                                }
                                            </Popover>
                                            <BootstrapTooltip arrow placement="top" title={mapTaskStatusLabel[item.status]}>
                                                <Box

                                                    className='container-status-checklist'
                                                    onClick={(e: any) => openListStatusCheckList(e, item._id)}
                                                    sx={{ border: `1px solid ${ColorStatus[mapTaskStatusLabel[item.status]]}` }}
                                                >
                                                    <Box
                                                        className='custom-status-checklist'
                                                        sx={{ background: `${ColorStatus[mapTaskStatusLabel[item.status]]}` }}
                                                    />
                                                </Box>
                                            </BootstrapTooltip>

                                            {
                                                item?.assignees.length > 0
                                                    ? <AvatarGroup
                                                        max={3}
                                                        className="group-avatar-checklist"
                                                        classes={{ avatar: 'group-ava-checklist' }}
                                                        onClick={(e: any) => openListMembers(e, item._id)}
                                                    >
                                                        {listMembers.filter((m) => item?.assignees.includes(m.userId)).map(({ avatar, name }, i) => {
                                                            return <BootstrapTooltip placement='top' title={name}>
                                                                <Avatar
                                                                    key={i}
                                                                    onClick={(e: any) => openListMembers(e, item._id)}
                                                                    className='item-assignees-checklist'
                                                                    src={avatar}
                                                                />
                                                            </BootstrapTooltip>
                                                        })}

                                                    </AvatarGroup>
                                                    : <button
                                                        className="btn-assign-mem-to-checklist"
                                                        onClick={(e: any) => openListMembers(e, item._id)}
                                                    >
                                                        <div className='icon-add-assign-clist'><AddMemIcon /></div>
                                                        <div className='icon-user-assign-clist'><UserCustomIcon /></div>

                                                    </button>
                                            }


                                            {
                                                renamingCheckListItem && checkItemId === item?._id
                                                    ? <Box className='rename-checklist-item'>
                                                        <input
                                                            className='input-rename-checklist-item'
                                                            defaultValue={item?.title}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleSaveRenameItem(projectCheckList._id, item)
                                                                }
                                                            }}
                                                            onChange={(e) => setValueNewItemClist(e.target.value)}
                                                            onBlur={() => handleSaveRenameItem(projectCheckList._id, item)}
                                                        />
                                                    </Box>
                                                    : <Box
                                                        key={projectCheckList._id}
                                                        className='edit-text-item-checklist'
                                                    >
                                                        {item?.title}
                                                    </Box>
                                            }
                                            <Popover
                                                id={item._id}
                                                classes={{ paper: 'Popover-item-checklist' }}
                                                open={openAnchorElCheckList && checkItemId === item._id}
                                                anchorEl={anchorElCheckList}
                                                onClose={handleCloseOptionsCheckList}
                                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                                transformOrigin={{ vertical: "center", horizontal: "left" }}
                                            >
                                                <Box>
                                                    <List>

                                                        <ListItemButton onClick={() => handleDeleteItem(projectCheckList, item)} >
                                                            Delete
                                                        </ListItemButton>
                                                    </List>
                                                </Box>
                                            </Popover>
                                            {renamingCheckListItem && checkItemId === item._id
                                                ? null
                                                : <BootstrapTooltip key={item?._id} arrow placement="top" title="Rename">
                                                    <IconButton onClick={() => handleOpenRenameItemCheckList(item?._id)} className='btn-rename-item-checklist' disableRipple>
                                                        <Box className='icon-rename-item-checklist'>
                                                            <IconRenameItem />
                                                        </Box>
                                                    </IconButton>
                                                </BootstrapTooltip>
                                            }
                                            {renamingCheckListItem && checkItemId === item._id
                                                ? null
                                                : <BootstrapTooltip arrow placement="top" title="Settings">
                                                    <IconButton
                                                        key={item?._id}
                                                        disableRipple
                                                        className='btn-open-options-item-checklist'
                                                        onClick={(e: any) => openOptionsCheckList(e, item?._id)}
                                                        style={{ marginLeft: '10px' }}
                                                    >
                                                        <MoreHorizIcon className='icon-hmore-options-checklist' />
                                                    </IconButton>
                                                </BootstrapTooltip>
                                            }

                                        </Box>
                                    )

                                })
                            }

                            {
                                addNewItemCheckList && checkProjectCheckList === projectCheckList._id
                                    ? <div key={projectCheckList._id} className='form-add-new-item-checklist'>
                                        <div className='head-line-add-item-checklist' />
                                        <input
                                            className='input-add-item-checklist'
                                            autoFocus
                                            placeholder="Type'/' from commands"
                                            onChange={(e) => setValueNewItemClist(e.target.value)}
                                            onKeyDown={(e) => handleKeySaveNewItem(e, projectCheckList._id)}
                                            onBlur={() => {
                                                if (!valueNewItemCList) {
                                                    setNewItemCheckList(false)
                                                }
                                            }}
                                        />
                                        {/* <button
                                            className="btn-assign-mem-to-checklist"
                                        >
                                            <div className='icon-add-assign-clist'><AddMemIcon /></div>
                                            <div className='icon-user-assign-clist'><UserCustomIcon /></div>
                                        </button> */}
                                        <button
                                            className='btn-save-new-item-checklist'
                                            onClick={() => handleSaveItem(projectCheckList._id)}
                                        >
                                            SAVE
                                        </button>
                                    </div>
                                    : <button className='btn-add-item-checklist' disabled={isDisabledEditSprint} onClick={() => {
                                        setNewItemCheckList(true)
                                        setCheckProjectCheckList(projectCheckList._id)
                                    }}> + ADD CHECKLIST ITEM</button>
                            }

                        </Box>
                    )
                })
            }
            {
                projectCheckLists.length < 1 && <button className='btn-add-checklist' onClick={handleAddCheckList}> + ADD CHECKLIST</button>
            }
        </Box>
    )

}

export default DetailProjectCheckList;