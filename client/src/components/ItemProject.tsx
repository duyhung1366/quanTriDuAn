import { MoreHoriz } from "@mui/icons-material";
import { TreeItem } from '@mui/lab';
import { Box, Divider, IconButton, Input, List, ListItemButton, Popover, Tooltip } from "@mui/material";
import classNames from "classnames";
import { useSnackbar } from 'notistack';
import * as React from 'react';
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useMatch, useNavigate } from 'react-router-dom';
import { ProjectRole } from '../../../common/constants';
import Project from '../../../common/models/project';
import { isAdmin } from "../config/admin-config";
import { useProject } from '../hooks/useProject';
import { useSprint } from '../hooks/useSprint';
import "../pages/style/KSAppbar.scss";
import { setCurrentSprint } from "../redux/slices/sprint.slice";
import { ROUTER_PROJECT, ROUTER_SPRINT } from "../utils/router";
import { ColorProject } from "./ColorProject";
import { CreateOrUpdateSprintPopup } from "./CreateOrUpdateSprintPopup";
import BootstrapTooltip from "./CustomToolTip";
import ConfirmDialog from "./dialog/ConfirmDialog";
import ProjectMemberDialog from "./ProjectMemberDialog";
import { CreateOrUpdateProjectPopup } from "./CreateOrUpdateProjectPopup";

type Item = Project;

const ItemProject = (props: React.PropsWithoutRef<{ item: Item }>) => {
    const item = props.item;
    const matchProjectSprintPath = useMatch(`${ROUTER_PROJECT}/:projectId${ROUTER_SPRINT}/:sprintId`);
    const matchProjectPath = useMatch(`${ROUTER_PROJECT}/:projectId`);
    const [anchorEl, setAnchorEl] = React.useState<HTMLLIElement | null>(null);
    const [anchorElCheckProject, setAnchorElCheckProject] = React.useState<HTMLLIElement | null>(null);
    const [openScreenMembers, setOpenScreenMembers] = React.useState(false);
    const [renaming, setRenaming] = React.useState(false);
    const [inputRef, setInputRef] = React.useState<HTMLInputElement>(null);
    const [currentName, setCurrentName] = React.useState(item.name);
    const [valueRename, setValueRename] = React.useState("");

    const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
    const nav = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useDispatch();
    const itemRef = useRef<HTMLLIElement>(null);

    const buttonSettingRef = useRef<HTMLButtonElement>(null);
    // Auto focus to the renaming input
    React.useEffect(() => {
        if (inputRef) {
            inputRef.focus({ preventScroll: true });
        }
    }, [inputRef]);

    const {
        colorProjects,
        currentUser,
        currentProject,
        openPopupCreate: openCreateProjectPopup,
        setOpenPopupCreate: setOpenCreateProjectPopup,
        handleUpdateProject,
        handleDeleteProject,
        getUserProject
    } = useProject();
    const userProject = getUserProject(item._id);

    const {
        openPopup: openCreateSprintPopup,
        setOpenPopup: setOpenCreateSprintPopup,
        handleCreateSprint
    } = useSprint();

    const checkPermissionUser = [ProjectRole.OWNER, ProjectRole.SPRINT_MASTER].includes(userProject?.role) || isAdmin(currentUser)
    const checkPermissionProject = [ProjectRole.OWNER, ProjectRole.SPRINT_MASTER, ProjectRole.SPRINT_MEMBER].includes(userProject?.role) || isAdmin(currentUser)
    const checkPermissionOwner = [ProjectRole.OWNER].includes(userProject?.role) || isAdmin(currentUser)
    //Đóng mở màn hình project members
    const handleOpenScreenMembers = () => {
        setOpenScreenMembers(true);
        handleCloseSelectOptionProject();
    };
    const handleCloseScreenMembers = () => {
        setOpenScreenMembers(false);
    };
    //Đóng mở popover setting project
    const openSelectOptionProject = Boolean(anchorEl);
    const handleCloseSelectOptionProject = () => {
        setAnchorEl(null);
        // nav(`${ROUTER_PROJECT}/${currentProject._id}`)
    };
    //Mở popup chỉnh sửa project
    const handleOpenEditProjectPopup = () => {
        setOpenCreateProjectPopup(true);
        handleCloseSelectOptionProject();
    }
    //Mở popup tạo sprint
    const handleOpenCreateSprintPopup = () => {
        setOpenCreateSprintPopup(true);
        handleCloseSelectOptionProject();

    }
    // Set on renaming state to rename
    const handleRenameProject = () => {
        handleCloseSelectOptionProject();
        setRenaming(true);
    }

    //update lại tên project
    const handleSaveRenameProject = (newName: string) => {
        if (newName === "" || newName === currentName) {
            setRenaming(false);
        } else {
            handleUpdateProject({ name: newName }, item._id);
            setCurrentName(newName);
            setRenaming(false);
        }
    }
    //Xóa project
    const handleSelectDeleteProject = () => {
        handleCloseSelectOptionProject();
        handleDeleteProject({ deletedAt: Date.now() }, item._id);
        nav(`/`)
    }
    // xử lý chuột trái chuột phải khi click vào temporaryProject
    const handleClick = (evt: React.MouseEvent<HTMLLIElement>) => {
        evt.preventDefault();
        if (buttonSettingRef.current && buttonSettingRef.current.contains(evt.target as Node)) {
            setAnchorEl(itemRef.current);
        } else {
            setAnchorElCheckProject(itemRef.current);
            const matchData = matchProjectPath || matchProjectSprintPath;
            if (!matchData || matchData.params.projectId !== item._id) {
                nav(`${ROUTER_PROJECT}/${item._id}`)
            }
        }
    }

    const handleContextMenu = (evt: React.MouseEvent<HTMLLIElement>) => {
        evt.preventDefault();
        setAnchorEl(itemRef.current);
    }
    return <>
        {
            checkPermissionProject
                ? <TreeItem
                    classes={{ content: 'tree-item-custom-project', selected: 'tree-item-mui-slected' }}
                    nodeId={item._id}
                    className={classNames("tree-item-container", !!anchorEl ? "opening" : "" && !!anchorElCheckProject ? "pointing-at" : "")}
                    ref={itemRef}
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    label={<div className="tree-item-project">
                        <div className="project-item-bar">
                            {renaming
                                ? <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ColorProject color={colorProjects[item._id]} />
                                    <Input
                                        inputRef={setInputRef}
                                        defaultValue={currentName}
                                        onBlur={(evt) => {
                                            handleSaveRenameProject(evt.target.value);
                                        }}
                                        onChange={(e) => setValueRename(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSaveRenameProject(valueRename);
                                            }
                                        }}
                                    />
                                </div>
                                : <>
                                    <ColorProject color={colorProjects[item._id]} />

                                    <div className="project-item-name" title={item.name}>{item.name}</div>
                                </>}
                        </div>

                        <BootstrapTooltip placement="top" title="Project Settings" disableFocusListener>
                            <IconButton
                                disableFocusRipple
                                disableRipple
                                className="btn-project-setting"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                    }
                                }}
                                ref={buttonSettingRef}
                            >
                                <MoreHoriz className="icon-project-morehoriz" />
                            </IconButton>
                        </BootstrapTooltip>
                    </div>}
                />
                : null
        }
        <Popover
            classes={{ paper: 'Popover-settings-project' }}
            open={openSelectOptionProject}
            anchorEl={anchorEl}
            onClose={handleCloseSelectOptionProject}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "center", horizontal: "left" }}
        >
            <Box>
                <List>
                    <ListItemButton
                        onClick={handleOpenEditProjectPopup}
                        disabled={!checkPermissionOwner}
                    >
                        Edit
                    </ListItemButton>
                    <ListItemButton
                        onClick={handleRenameProject}
                        disabled={!checkPermissionOwner}
                    >
                        Rename
                    </ListItemButton>
                    <ListItemButton
                        onClick={() => {
                            handleCloseSelectOptionProject();
                            setOpenConfirmDelete(true);
                        }}
                        disabled={!checkPermissionOwner}
                    >
                        Delete
                    </ListItemButton>
                    <Divider />
                    <ListItemButton
                        onClick={handleOpenCreateSprintPopup}
                        disabled={!checkPermissionUser}
                    >
                        Create Sprint
                    </ListItemButton>
                    <Divider />
                    <ListItemButton onClick={handleOpenScreenMembers}>Members</ListItemButton>
                </List>
            </Box>
        </Popover>

        <ConfirmDialog
            open={openConfirmDelete}
            title="Confirm Delete?"
            content={<>Are you sure to delete project <b>{currentName}?</b></>}
            onClose={() => setOpenConfirmDelete(false)}
            onConfirm={handleSelectDeleteProject}
        />
        {openCreateSprintPopup && <CreateOrUpdateSprintPopup
            open={openCreateSprintPopup}
            onClose={() => setOpenCreateSprintPopup(false)}
            onCreate={(sprintArg) => {
                handleCreateSprint(sprintArg, item._id)
                    .then((sprint) => {
                        if (sprint) {
                            const matchData = matchProjectPath || matchProjectSprintPath;
                            if (matchData && matchData.params.projectId === item._id) {
                                dispatch(setCurrentSprint(sprint));
                                history.pushState(null, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_PROJECT}/${item._id}${ROUTER_SPRINT}/${sprint._id}`);
                            }
                        }
                    })
                    .finally(() => {
                        setOpenCreateSprintPopup(false);
                    })
            }}
            nameSprint={item?.name}
        />}
        {openCreateProjectPopup && <CreateOrUpdateProjectPopup
            open={openCreateProjectPopup}
            onClose={() => setOpenCreateProjectPopup(false)}
            dataUpdate={item}
            onUpdate={(data: Project) => handleUpdateProject(data, item._id)}
        />}
        {openScreenMembers && <ProjectMemberDialog
            open={!!item && openScreenMembers}
            checkPermission={checkPermissionUser}
            checkPermissionOwner={checkPermissionOwner}
            project={item}
            onClose={handleCloseScreenMembers}
        />}
    </>

}
export default ItemProject;