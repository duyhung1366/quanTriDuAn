import { Cancel } from "@mui/icons-material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import {
  Avatar,
  Box,
  Button,
  DialogTitle,
  Grid,
  IconButton,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import { CKEditor } from "ckeditor4-react";
import { useState, useMemo } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";
import { $enum } from "ts-enum-util";
import { TaskStatus } from "../../../../common/constants";
import ProjectCheckList from "../../../../common/models/project_check_list";
import { mapTaskStatusLabel } from "../../config/MapContraint";
import { useProjectCheckList } from "../../hooks/useProjectCheckList";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import AddMemIcon from "../icons/AddMemIcon";
import UserCustomIcon from "../icons/UserCustomIcon";
import { ColorStatus } from "../WorkSpace";
import ImgUploadIcon from "./ImgUploadIcon";
import axios from "axios";
import "./style.scss";
import { AvatarGroup, Stack, Divider } from "@mui/material";
import { EditTextarea } from "react-edit-text";
import { setCurrentBugItem } from "../../redux/slices/projectCheckList.slice";
import useProjectMember from "../../hooks/useProjectMember";
import { debounce } from "lodash";
import { DialogTransitionUp } from "../dialog/DialogTransitions";
import BootstrapTooltip from "../CustomToolTip";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField/TextField";
import User from "../../../../common/models/user";
import DoneIcon from "@mui/icons-material/Done";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import ZoomAttachedImage from "../ZoomAttachedImage";
import { removeAccents } from "../unidecode";
import ConfirmDialog from "../dialog/ConfirmDialog";

const URL = `${process.env.REACT_APP_ENDPOINT}/${process.env.REACT_APP_PREFIX_API}`;
export const DesciptionBugPopup = (props: {
  open: boolean;
  onClose: () => void;
  checkListId: string;
}) => {
  const { open, onClose, checkListId } = props;
  const projectState = useAppSelector((state) => state.projectReducer);
  const currentTask = useAppSelector((state) => state.taskReducer.currentTask);
  const currentSprint = useAppSelector(
    (state) => state.sprintReducer.currentSprint
  );
  const { handleUpdateItemCheckList } = useProjectCheckList();
  const accessToken = useAppSelector((state) => state.authReducer.accessToken);
  const checkList = useAppSelector((state) => state.projectCheckListReducer);
  const users = useAppSelector((state) => state.userReducer.mapUserData);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [openZoomImage, setOpenZoomImage] = useState(false);
  const [checkIndexImage, setCheckIndexImage] = useState<number>(null);
  const [indexImageDelete, setIndexImageDelete] = useState(-1);
  const currentItemCheckList = useAppSelector(
    (state) => state.projectCheckListReducer.currentBugItem
  );
  const [searchByName, setSearchByName] = useState("");
  const [status, setStatus] = useState(
    currentItemCheckList.status ?? TaskStatus.OPEN
  );
  const dispatch = useAppDispatch();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setSearchByName("");
  };
  const openPopover = Boolean(anchorEl);
  const id = openPopover ? "simple-popover-description-bug" : undefined;
  const getMembersProject = useProjectMember(currentTask?.projectId);
  const mapListMembers = useMemo(() => {
    if (getMembersProject) {
      const dataMembers = getMembersProject.map((item) => {
        return { ...item, ...(users[item?.userId] || ({} as User)) };
      });
      return dataMembers;
    }
  }, [getMembersProject]);
  const listMembers = mapListMembers.filter((s) =>
    removeAccents(s?.name?.toLowerCase())?.includes(
      removeAccents(searchByName.toLowerCase())
    )
  );

  const handleOpenZoomImage = (index: number) => {
    setOpenZoomImage(true);
    setCheckIndexImage(index);
  };
  const handleCloseZoomImage = () => {
    setOpenZoomImage(false);
  };

  const handleAssignMemberToBugCheckList = (e: any) => {
    const checkAssignees = currentItemCheckList?.assignees.filter(
      (i) => i === e._id
    );
    if (checkAssignees?.length > 0) {
      const newAssignees = [
        ...currentItemCheckList.assignees.filter((a) => a !== e._id),
      ];
      handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
        assignees: newAssignees,
      });
      dispatch(
        setCurrentBugItem({ ...currentItemCheckList, assignees: newAssignees })
      );
    } else {
      const newAssignees = [...currentItemCheckList.assignees, e._id];
      handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
        assignees: newAssignees,
      });
      dispatch(
        setCurrentBugItem({ ...currentItemCheckList, assignees: newAssignees })
      );
    }
    setSearchByName("");
    handleClose();
  };
  const handleDeleteMembersToBug = (assigneeId: any) => {
    const newAssignees = [
      ...currentItemCheckList.assignees.filter((a) => a !== assigneeId),
    ];
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      assignees: newAssignees,
    });
    dispatch(
      setCurrentBugItem({ ...currentItemCheckList, assignees: newAssignees })
    );
  };

  const handleChangeDescription = debounce((event) => {
    if (
      currentItemCheckList?.desc?.localeCompare(event.editor.getData()) !== 0
    ) {
      handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
        desc: event.editor.getData(),
      });
    }
  }, 300);
  const handleChangeStatus = (e: any) => {
    setStatus(e.target.value);
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      status: e.target.value,
    });
    dispatch(
      setCurrentBugItem({ ...currentItemCheckList, status: e.target.value })
    );
  };
  const handleCompleteBugChecklist = () => {
    setStatus(TaskStatus.COMPLETE);
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      status: TaskStatus.COMPLETE,
    });
    dispatch(
      setCurrentBugItem({
        ...currentItemCheckList,
        status: TaskStatus.COMPLETE,
      })
    );
  };
  const handleSaveName = ({ value }) => {
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      title: value,
    });
  };

  const handleImageUpload = async (
    imageList: ImageListType,
    addUpdateIndex?: number[]
  ) => {
    await Promise.all(
      imageList.map(async (image, i) => {
        if (addUpdateIndex?.includes(i) ?? false) {
          const formData = new FormData();
          formData.append(
            "upload",
            image.file as File,
            `image-content-${image.file?.name}`
          );
          try {
            const { data, status } = await axios.post(
              `${URL}/upload-image-ckeditor`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            if (status !== 200) {
              data;
              return "";
            }

            imageList[i].dataURL = data?.url;
            return data?.url ?? "";
          } catch (e) {
            console.error(e);
            return "";
          }
        }
      })
    );
    const images = imageList.map((e) => {
      return e.dataURL;
    });
    // const attachImage = currentItemCheckList.attachImage.concat(images).filter(e => e !== undefined)
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      attachImage: images,
    });
    dispatch(
      setCurrentBugItem({ ...currentItemCheckList, attachImage: images })
    );
  };
  const handleDeleteImage = (image: string) => {
    const listImage = currentItemCheckList.attachImage.filter(
      (e) => e !== image
    );
    handleUpdateItemCheckList(checkListId, currentItemCheckList._id, {
      attachImage: listImage,
    });
    dispatch(
      setCurrentBugItem({ ...currentItemCheckList, attachImage: listImage })
    );
  };
  return (
    <Dialog
      disableAutoFocus
      classes={{ paper: "dialog-detail-bug-check-list-container" }}
      maxWidth="xl"
      open={open}
      onClose={() => onClose()}
      TransitionComponent={DialogTransitionUp}>
      <DialogTitle className="dialog-detail-bug-check-list-title">
        <Box className="title-detail-bug-check-list-name">
          <Box className="title-name-project-and-sprint">
            {projectState.projects[currentTask?.projectId]?.name}
          </Box>
          <ArrowForwardIosIcon
            style={{ fontSize: "10px", margin: "0 10px" }}
            classes="arrowicon-title-bug-check-list"
          />
          <Box className="title-name-project-and-sprint">
            {currentSprint?.name}
          </Box>
        </Box>
        <IconButton
          onClick={() => onClose()}
          className="btn-close-dialog-bug-check-list">
          <CloseIcon className="closeicon-title-bug-check-list-detail" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <Box className="dialog-detail-bug-checklist">
        <Box sx={{ margin: "0 26px" }}>
          <Select
            classes={{
              outlined: "select-status-bug-checklist",
              iconOutlined: "icon-status-bug-checklist",
            }}
            className="select-status-root"
            style={{
              backgroundColor: `${ColorStatus[mapTaskStatusLabel[status]]}`,
            }}
            value={status}
            onChange={handleChangeStatus}>
            {$enum(TaskStatus)
              .getValues()
              .map((value) => (
                <MenuItem key={value} value={value}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        background: `${ColorStatus[mapTaskStatusLabel[value]]}`,
                        width: "8px",
                        height: "8px",
                        borderRadius: "3px",
                        marginRight: "10px",
                      }}
                    />
                    {mapTaskStatusLabel[value]}
                  </div>
                </MenuItem>
              ))}
          </Select>
        </Box>
        <Box>
          {currentItemCheckList?.status !== TaskStatus.COMPLETE && (
            <BootstrapTooltip placement="top" title="Set to complete">
              <Box className="complete-bug-checklist-container">
                <button
                  className="btn-complete-bug-checklist"
                  onClick={handleCompleteBugChecklist}>
                  <DoneIcon className="icon-done-bug-checklist" />
                </button>
              </Box>
            </BootstrapTooltip>
          )}
        </Box>
        <Box className="custom-group-avatar-bug-checklist">
          <Popover
            id={id}
            open={openPopover}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}>
            <Box sx={{ padding: "10px", height: "70px" }}>
              <TextField
                placeholder="Search by name"
                fullWidth
                onChange={(e) => setSearchByName(e.target.value)}
              />
            </Box>
            <Box sx={{ height: "300px", overflowY: "auto" }}>
              {listMembers.map((e) => {
                const chooseUser = currentItemCheckList?.assignees?.includes(
                  e._id
                );
                return (
                  <div key={e._id}>
                    <MenuItem
                      onClick={() => handleAssignMemberToBugCheckList(e)}>
                      <Box
                        sx={
                          chooseUser && {
                            border: "3px solid #5d4ab3",
                            backgroundColor: "red",
                            borderRadius: "25px",
                            marginRight: "10px",
                          }
                        }>
                        <Avatar
                          src={e.avatar}
                          sx={{ border: "3px solid #fff" }}
                        />
                      </Box>
                      <div>{e.name}</div>
                    </MenuItem>
                  </div>
                );
              })}
            </Box>
          </Popover>
          <Box className="custom-square-assignees-bug-checklist">
            {currentItemCheckList?.assignees?.length > 0 && (
              <AvatarGroup
                max={3}
                className="group-avatar-bug-checklist"
                classes={{ avatar: "group-ava-checklist" }}
                onClick={(e: any) => setAnchorEl(e.currentTarget)}>
                {listMembers
                  .filter((m) =>
                    currentItemCheckList?.assignees.includes(m.userId)
                  )
                  .map(({ _id, avatar, name }, i) => {
                    return (
                      <div className="custom-hover-avatar-bug-checklist">
                        <BootstrapTooltip placement="bottom" title={name}>
                          <Avatar
                            key={i}
                            onClick={(e: any) => setAnchorEl(e.currentTarget)}
                            classes={{ root: "item-assignees-bug-checklist" }}
                            src={avatar}
                          />
                        </BootstrapTooltip>
                        <div
                          onClick={(evt) => {
                            handleDeleteMembersToBug(_id);
                            evt.stopPropagation();
                          }}
                          className="icon-x-custom-delete-asn-bug">
                          <AddMemIcon />
                        </div>
                      </div>
                    );
                  })}
              </AvatarGroup>
            )}
            <BootstrapTooltip placement="top" title="Assign">
              <button className="btn-assign-detail-task" onClick={handleClick}>
                <div className="custom-assign-detail-task-add">
                  <AddMemIcon />
                </div>
                <div className="custom-assign-detail-task-user">
                  <UserCustomIcon />
                </div>
              </button>
            </BootstrapTooltip>
          </Box>
          <label style={{ fontSize: "12px", marginLeft: "-15px" }}>
            Assignees
          </label>
        </Box>
      </Box>
      <Divider />
      <div className="content-detail-bug-checklist">
        <Stack sx={{ mx: 2, my: 1 }}>
          <EditTextarea
            name="textbox"
            defaultValue={currentItemCheckList?.title}
            onSave={handleSaveName}
            className="edit-text-name-description-bug"
            inputClassName="input-edit-name-description-bug"
            placeholder="Name"
          />
        </Stack>
        <div className="description-bug-checklist-container">
          <CKEditor
            initData={currentItemCheckList?.desc}
            onChange={handleChangeDescription}
            config={{
              filebrowserImageUploadUrl: `${URL}/upload-image-ckeditor`,
              uploadUrl: `${URL}/upload-image-ckeditor`,
              extraPlugins: "autogrow",
              fileTools_requestHeaders: {
                Authorization: `Bearer ${accessToken}`,
              },
            }}
            onInstanceReady={(event) => {
              event.editor.focus();
            }}
            style={{
              overflowY: 'auto',
              maxHeight: '320px',
            }}
          />
        </div>
        {/* image upload */}
        <div className="bug-images-container">
          <ImageUploading
            multiple
            value={currentItemCheckList?.attachImage?.map((e) => ({
              dataURL: e,
            }))}
            onChange={handleImageUpload}>
            {({ onImageUpload, dragProps, onImageRemove }) => (
              <div className="upload-image-wrapper">
                {currentItemCheckList?.attachImage?.map(
                  (image, index: number) => (
                    <div key={index} className="image-item-container">
                      <ZoomAttachedImage
                        open={openZoomImage && checkIndexImage === index}
                        handleClose={handleCloseZoomImage}
                        i={index}
                        onImageRemove={onImageRemove}
                        images={currentItemCheckList?.attachImage?.map(
                          (dataURL) => ({
                            dataURL,
                          })
                        )}
                      />
                      <div
                        className="image-item"
                        onClick={() => handleOpenZoomImage(index)}>
                        <img src={image} alt="" width="100" />
                      </div>
                      <div
                        className="custom-image-item"
                        onClick={() => handleOpenZoomImage(index)}>
                        <RemoveRedEyeOutlinedIcon className="icon-view-image-bug-checklist" />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIndexImageDelete(index)
                          }}
                          className="image-item-remove-button"
                          fullWidth>
                          <DeleteOutlineIcon />
                        </Button>
                      </div>
                      <span className="image-index-label">Ảnh {index + 1}</span>
                    </div>
                  )
                )}
                <div
                  {...dragProps}
                  className="add-item-button"
                  onClick={onImageUpload}>
                  <ImgUploadIcon />
                  Tải ảnh lên
                </div>
                <ConfirmDialog
                  open={indexImageDelete !== -1}
                  title="Confirm Delete?"
                  content={<>Are you sure to delete image  ?</>}
                  onClose={() => {
                    setIndexImageDelete(-1)
                  }}
                  onConfirm={() => {
                    onImageRemove(checkIndexImage)
                    setIndexImageDelete(-1)
                  }}
                />
              </div>
            )}
          </ImageUploading>
        </div>
      </div>
    </Dialog>
  );
};
