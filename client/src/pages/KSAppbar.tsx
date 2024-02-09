import { Add, KeyboardDoubleArrowLeft } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import TreeView from "@mui/lab/TreeView";
import { Button, Input, Popover } from "@mui/material";
import { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material/styles";
import { unwrapResult } from "@reduxjs/toolkit";
import * as React from "react";
import Project from "../../../common/models/project";
import { CreateOrUpdateProjectPopup } from "../components/CreateOrUpdateProjectPopup";
import ItemProject from "../components/ItemProject";
import UserMenu from "../components/usermenu";
import { isAdmin } from "../config/admin-config";
import { useProject } from "../hooks/useProject";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  MapColorProject,
  getProjects,
  setMapColorProject,
} from "../redux/slices/project.slice";
import { checkedViewTaskByList, searchName } from "../redux/slices/task.slice";
import { localStorageJSONParse } from "../utils/storage";
import "./style/KSAppbar.scss";
import IconRenameItem from "../components/icons/IconRenameItem";
import IconBoard from "../components/icons/IconBoard";
import IconList from "../components/icons/IconList";
import classNames from "classnames";
import { ProjectRole } from "../../../common/constants";
import AppBarMultipleTask from "../components/AppBarMultipleTask";
import PrivacyTipOutlinedIcon from "@mui/icons-material/PrivacyTipOutlined";
import { useNavigate } from "react-router-dom";

const drawerWidth = 300;
const appbarHeight = 52;
const appbarHeightSm = 56;
const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  overflowY: "hidden",
  height: `calc(100vh - ${appbarHeight}px)`,
  [theme.breakpoints.down("sm")]: {
    height: `calc(100vh - ${appbarHeightSm}px)`,
  },
  background: "#ffffff",
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled("div", {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

type TreeData = Project[];
interface IProps {
  children?: React.ReactChild;
}

export default function KSAppbar(props: IProps) {
  const auth = useAppSelector((state) => state.authReducer);
  const [open, setOpen] = React.useState(true);
  const [isOpenInput, setIsOpenInput] = React.useState(false);
  const [searchProjectByName, setSearchProjectByName] = React.useState("");
  const [valueRename, setValueRename] = React.useState("");
  const [anchorElDesProject, setAnchorElDesProject] =
    React.useState<HTMLLIElement | null>(null);

  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const listTaskCloneOrMove = useAppSelector(
    (state) => state.taskReducer.listTaskCloneOrMove
  );
  const openAnchorElDesProject = Boolean(anchorElDesProject);
  const handleOpenViewDesProject = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorElDesProject(event.currentTarget);
  };
  const handleCloseViewDesProject = () => {
    setAnchorElDesProject(null);
  };

  const theme = useTheme();

  // First hook to fetch All Projects
  React.useEffect(() => {
    const promise = dispatch(getProjects());
    promise.then(unwrapResult).then(({ data }) => {
      const mapColorLocal =
        localStorageJSONParse<MapColorProject>("projectColors") || {};
      const mapColorProject = data.reduce((map, project) => {
        if (mapColorLocal[project._id])
          map[project._id] = mapColorLocal[project._id];
        else
          map[project._id] = `#${Math.floor(Math.random() * 16777215).toString(
            16
          )}`;
        return map;
      }, {} as MapColorProject);
      localStorage.setItem("projectColors", JSON.stringify(mapColorProject));
      dispatch(setMapColorProject(mapColorProject));
    });
    return () => {
      promise.abort();
    };
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const {
    openPopupCreate: openCreateProjectPopup,
    setOpenPopupCreate: setOpenCreateProjectPopup,
    handleCreateProject,
    handleUpdateProject,
    getUserProject,
    projectState,
    checkedViewList,
    currentUser,
  } = useProject();

  const currentProject = projectState.currentProject;
  const currentProjectId = currentProject?._id;
  const treeDataDeps = JSON.stringify(projectState.projects);
  const userProject = getUserProject(currentProjectId);
  const checkPermissionUser =
    [ProjectRole.OWNER].includes(userProject?.role) || isAdmin(currentUser);

  //Lưu thay đổi name Project
  const handleSaveRenameProject = (newName: string) => {
    if (newName === "" || newName === currentProject?.name) {
      setIsOpenInput(false);
    } else {
      handleUpdateProject({ name: newName }, currentProjectId);
      setIsOpenInput(false);
    }
  };
  //Đổi trạng thái hiển thị task bằng switch
  const checkViewTaskByList = (check: boolean) => {
    dispatch(checkedViewTaskByList(check));
  };
  //Data projects
  const treeData = React.useMemo<TreeData>(() => {
    return Object.values(JSON.parse(treeDataDeps)) as TreeData;
  }, [treeDataDeps]);

  return (
    <Box sx={{ overflowY: "hidden" }}>
      <Popover
        open={openAnchorElDesProject}
        anchorEl={anchorElDesProject}
        onClose={handleCloseViewDesProject}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        classes={{ paper: "paper-description-sprint" }}>
        <div className="custom-icon-arrow" />
        <div className="wraper-des-sprint">
          <div
            dangerouslySetInnerHTML={{ __html: currentProject?.description }}
            style={{ paddingBottom: "20px" }}
          />
        </div>
      </Popover>
      {openCreateProjectPopup && (
        <CreateOrUpdateProjectPopup
          open
          onClose={() => setOpenCreateProjectPopup(false)}
          onCreate={handleCreateProject}
        />
      )}
      {listTaskCloneOrMove.length > 0 && (
        <AppBarMultipleTask />
      )
      }
      <AppBar
        position="fixed"
        open={open}
        className="ks-appbar"
        style={{ display: "flex", flexDirection: "row" }}>
        <Toolbar
          sx={{ display: "flex", width: "100%" }}
          classes={{ root: "ks-toolbar-home" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            disableRipple
            sx={{
              mr: 2,
              ...(open && { display: "none" }),
              ":hover": {
                background: "#FFFFFF",
                color: "#0085FF",
                borderRadius: "5px",
              },
              marginRight: "10px",
              color: "#787486",
              width: "30px",
              height: "30px",
            }}>
            <MenuIcon />
          </IconButton>
          {isOpenInput ? (
            <input
              autoFocus
              required={true}
              className="input-rename-app-bar"
              defaultValue={currentProject?.name ?? ""}
              onChange={(e) => setValueRename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveRenameProject(valueRename);
                }
              }}
              onBlur={(e) => handleSaveRenameProject(e.target.value)}
            />
          ) : (
            <div className="app-bar-project">
              <Typography
                className="app-bar-project-name dot-1"
                variant="h4"
                noWrap
                component="div"
                title={currentProject?.name}>
                {currentProject?.name}
              </Typography>
              {checkPermissionUser && (
                <IconButton
                  onClick={() => setIsOpenInput(true)}
                  disableRipple
                  className="btn-rename-project-appbar"
                  sx={{
                    path: { fill: "#545962" },
                    ":hover": {
                      path: { fill: "#0085FF" },
                    },
                  }}>
                  <IconRenameItem />
                </IconButton>
              )}
            </div>
          )}
          {currentProject?.description && (
            <>
              <IconButton
                disableRipple
                className="btn-info-project"
                onClick={(e: any) => handleOpenViewDesProject(e)}>
                <PrivacyTipOutlinedIcon className="icon-info-project" />
              </IconButton>
            </>
          )}
          <Divider orientation="vertical" variant="middle" flexItem />
          <Box className="container-choose-view-task">
            <Box
              className="bag-choose-view"
              onClick={() => checkViewTaskByList(false)}>
              <Box
                className={classNames(
                  "custom-choose-view-board",
                  checkedViewList === false ? "actived-board" : ""
                )}>
                <Box className="icon-choose-view">
                  <IconBoard />
                </Box>
                <Typography className="text-choose-view">Board</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" variant="middle" flexItem />
            <Box
              className="bag-choose-view"
              onClick={() => checkViewTaskByList(true)}>
              <Box
                className={classNames(
                  "custom-choose-view-list",
                  checkedViewList === true ? "actived-list" : ""
                )}>
                <Box className="icon-choose-view">
                  <IconList />
                </Box>
                <Typography className="text-choose-view">List</Typography>
              </Box>
            </Box>
          </Box>
          <Divider orientation="vertical" variant="middle" flexItem />
          <div className="search-task-by-name-container">
            <input
              className="input-search-task-by-name"
              onChange={(e) => {
                dispatch(searchName(e.target.value));
              }}
              placeholder="Search tasks ..."
            />
            <SearchIcon className="icon-search-task-by-name" />
          </div>
        </Toolbar>
      </AppBar>

      <Main open={open}>{props.children}</Main>
      <Drawer
        classes={{ paper: "drawer-left-custom" }}
        className={classNames(
          "Drawer-left-container",
          isAdmin(currentUser) ? "isAdmin" : ""
        )}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}>
        <DrawerHeader
          sx={{
            "& img": {
              marginLeft: "5px",
              height: "auto",
              width: 52,
              position: "relative",
            },
            minHeight: "0 !important",
          }}>
          <img src="/images/logo.jpg" alt="logo" onClick={() => { nav('/') }} style={{ cursor: 'pointer' }} />
          <div
            onClick={() => { nav('/') }}
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginRight: "60px",
              lineHeight: "36px",
              cursor: 'pointer'
            }}>
            KoolSoft
          </div>
          <IconButton
            disableRipple
            onClick={handleDrawerClose}
            sx={{
              ":hover": {
                background: "#FFFFFF",
                color: "#0085FF",
                borderRadius: "5px",
              },
              marginRight: "10px",
              color: "#787486",
              width: "30px",
              height: "30px",
            }}>
            <KeyboardDoubleArrowLeft />
          </IconButton>
        </DrawerHeader>

        <div className="search-projects-container">
          <input
            className="input-search-projects"
            placeholder="Search"
            onChange={(e) => setSearchProjectByName(e.target.value)}
          />
          <SearchIcon className="icon-search-project" />
        </div>

        {isAdmin(currentUser) ? (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "end",
              alignItems: "center",
              height: "40px",
              padding: "10px",
            }}>
            <Button
              disableFocusRipple
              onClick={() => setOpenCreateProjectPopup(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="btn-add-project-admin">
              + Add project
            </Button>
          </div>
        ) : null}
        <TreeView
          expanded={treeData.map((item) => item._id)}
          className="tree-view-project">
          {treeData
            .filter((project) =>
              project.name
                .toLowerCase()
                .includes(searchProjectByName?.toLowerCase())
            )
            .map((item) => (
              <ItemProject key={item._id} item={item} />
            ))}
        </TreeView>
        <Box
          sx={{
            padding: "15px",
            position: "absolute",
            bottom: "0",
            borderTop: " 1px solid #E8E8EA",
            width: "100%",
            height: "65px",
            display: "flex",
            alignItems: "center",
          }}>
          <UserMenu />
        </Box>
      </Drawer>
    </Box>
  );
}
