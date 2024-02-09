import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  IconButton,
} from "@mui/material";
import { PropsWithoutRef, ReactNode, useState } from "react";
import { ImageListType, ImageType } from "react-images-uploading";
import { DialogTransitionDown } from "../dialog/DialogTransitions";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import "./ZoomImage.scss";
import BootstrapTooltip from "../CustomToolTip";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import classNames from "classnames";
import ConfirmDialog from "../dialog/ConfirmDialog";

const ZoomAttachedImage = (
  props: PropsWithoutRef<{
    open: boolean;
    handleClose: () => void;
    i: number;
    onImageRemove: (value: number) => void;
    images?: ImageListType;
  }>
) => {
  const { open, handleClose, i, onImageRemove, images } = props;
  const [currentImageIndex, setCurrentImageIndex] = useState(i);
  const [openConfirmDelImg, setOpenConfirmDelImg] = useState(false);


  const onNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  const onPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => {
      if (prevIndex === 0) {
        return images.length - 1;
      } else {
        return prevIndex - 1;
      }
    });
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      classes={{ paper: "paper-fullscreen-zoom-image" }}>
      <DialogTitle className="title-dialog-zoom-image">
        <Box className="title-image-task-attachedment">
          Ảnh {currentImageIndex + 1}
        </Box>
        <Box className="group-btn-zoom-image">
          <BootstrapTooltip placement="bottom" title="Delete">
            <IconButton
              disableRipple
              className="btn-delete-image"
              onClick={() => {
                setOpenConfirmDelImg(true);
              }}>
              <DeleteOutlineIcon className="icon-delete-zoom-image" />
            </IconButton>
          </BootstrapTooltip>

          <IconButton
            disableRipple
            className="btn-close-zoom-image"
            onClick={handleClose}>
            <CloseIcon className="icon-close-zoom-image" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className="dialog-content-zoom-image">
        <IconButton
          disableRipple
          disabled={currentImageIndex === 0}
          className="btn-back-image"
          onClick={onPreviousImage}>
          <ArrowBackIosNewIcon
            className={classNames(
              "icon-back-image",
              currentImageIndex === 0 ? "is-first-image" : ""
            )}
          />
        </IconButton>
        <IconButton
          disableRipple
          disabled={currentImageIndex === images.length - 1}
          className="btn-next-image"
          onClick={onNextImage}>
          <ArrowForwardIosIcon
            className={classNames(
              "icon-next-image",
              currentImageIndex === images.length - 1 ? "is-last-image" : ""
            )}
          />
        </IconButton>
        <Box className="image-enlarged">
          <img
            src={images[currentImageIndex].dataURL}
            alt={images[currentImageIndex].dataURL}
          />
        </Box>
      </DialogContent>
      <ConfirmDialog
        open={openConfirmDelImg}
        title="Confirm Delete?"
        content={<>Are you sure to delete image  ?</>}
        onClose={() => {
          setOpenConfirmDelImg(false)
        }}
        onConfirm={() => {
          onImageRemove(i)
          setOpenConfirmDelImg(false)
          handleClose();
        }}
      />
    </Dialog>
  );
};

export default ZoomAttachedImage;
